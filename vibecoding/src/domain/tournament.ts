import { shuffle } from './random';

export interface Match {
  id: string;
  aId: string;
  bId: string;
  order: number;
}

export interface Elimination {
  loserId: string;
  round: number;
  order: number;
}

export type TournamentPhase =
  | 'round1-direct'
  | 'round1-rescue'
  | 'round2'
  | 'round3'
  | 'round4-main'
  | 'round4-challenge'
  | 'round5'
  | 'round6'
  | 'complete';

export interface TournamentState {
  version: 1;
  seed: number;
  phase: TournamentPhase;
  round: number;
  entrants: string[];
  protectedIds: string[];
  directQualifierIds: string[];
  finalNineIds: string[];
  pool: string[];
  matches: Match[];
  byeIds: string[];
  matchIndex: number;
  winners: string[];
  losers: string[];
  eliminations: Elimination[];
  round4ChallengerId: string | null;
  completedMatches: number;
  top9Ids: string[];
  championId: string | null;
}

function stageSeed(seed: number, stage: number, salt = 0): number {
  return (seed + stage * 2654435761 + salt) >>> 0;
}

function pairAll(
  pool: readonly string[],
  stage: number,
  seed: number,
  protectedIds: readonly string[] = [],
): Match[] {
  const protectedSet = new Set(protectedIds);
  const protectedPool = shuffle(
    pool.filter((id) => protectedSet.has(id)),
    stageSeed(seed ^ 0x4f1bbcdc, stage),
  );
  const regularPool = shuffle(
    pool.filter((id) => !protectedSet.has(id)),
    stageSeed(seed ^ 0x9e3779b9, stage),
  );

  if (protectedPool.length > regularPool.length) {
    throw new Error('Too many protected items for separated pairings.');
  }

  const pairs: [string, string][] = protectedPool.map((protectedId) => [
    protectedId,
    regularPool.shift()!,
  ]);
  while (regularPool.length > 0) {
    pairs.push([regularPool.shift()!, regularPool.shift()!]);
  }

  return shuffle(pairs, stageSeed(seed ^ 0x85ebca6b, stage)).map(
    ([leftId, rightId], order) => {
      const reverse = ((stageSeed(seed, stage) >>> (order % 24)) & 1) === 1;
      return {
        id: `s${stage}-m${order + 1}`,
        aId: reverse ? rightId : leftId,
        bId: reverse ? leftId : rightId,
        order,
      };
    },
  );
}

function startPairedStage(
  state: TournamentState,
  phase: TournamentPhase,
  round: number,
  pool: readonly string[],
  stage: number,
  protectSeeds: boolean,
): TournamentState {
  return {
    ...state,
    phase,
    round,
    pool: [...pool],
    matches: pairAll(
      pool,
      stage,
      state.seed,
      protectSeeds ? state.protectedIds : [],
    ),
    byeIds: [],
    matchIndex: 0,
    winners: [],
    losers: [],
  };
}

export function createTournament(
  ids: readonly string[],
  seed: number,
  protectedIds: readonly string[] = [],
): TournamentState {
  if (ids.length !== 48 || new Set(ids).size !== 48) {
    throw new Error('Tournament requires exactly forty-eight unique items.');
  }
  if (protectedIds.some((id) => !ids.includes(id))) {
    throw new Error('Protected items must be tournament entrants.');
  }

  const entrants = [...ids];
  const uniqueProtectedIds = [...new Set(protectedIds)];
  return {
    version: 1,
    seed,
    phase: 'round1-direct',
    round: 1,
    entrants,
    protectedIds: uniqueProtectedIds,
    directQualifierIds: [],
    finalNineIds: [],
    pool: entrants,
    matches: pairAll(entrants, 1, seed, uniqueProtectedIds),
    byeIds: [],
    matchIndex: 0,
    winners: [],
    losers: [],
    eliminations: [],
    round4ChallengerId: null,
    completedMatches: 0,
    top9Ids: [],
    championId: null,
  };
}

export function getActiveMatch(state: TournamentState): Match | null {
  return state.matches[state.matchIndex] ?? null;
}

function startRound4(
  state: TournamentState,
  finalNineIds: readonly string[],
): TournamentState {
  const mixed = shuffle(finalNineIds, stageSeed(state.seed, 5));
  const round4ChallengerId = mixed.at(-1)!;
  const mainPool = mixed.slice(0, 8);
  return {
    ...startPairedStage(state, 'round4-main', 4, mainPool, 5, false),
    pool: [...finalNineIds],
    finalNineIds: [...finalNineIds],
    round4ChallengerId,
  };
}

function startRound4Challenge(state: TournamentState): TournamentState {
  const challengedWinnerId = shuffle(
    state.winners,
    stageSeed(state.seed ^ 0xc2b2ae35, 6),
  )[0];
  const byeIds = state.winners.filter((id) => id !== challengedWinnerId);
  const challengerId = state.round4ChallengerId!;
  const reverse = (stageSeed(state.seed, 6) & 1) === 1;
  return {
    ...state,
    phase: 'round4-challenge',
    matches: [
      {
        id: 's6-m1',
        aId: reverse ? challengedWinnerId : challengerId,
        bId: reverse ? challengerId : challengedWinnerId,
        order: 4,
      },
    ],
    byeIds,
    matchIndex: 0,
    winners: [],
    losers: [],
  };
}

export function rankFinalNine(
  finalNineIds: readonly string[],
  championId: string,
  eliminations: readonly Elimination[],
  directQualifierIds: readonly string[],
  seed: number,
): string[] {
  const eliminationRound = new Map(
    eliminations.map((entry) => [entry.loserId, entry.round]),
  );
  const direct = new Set(directQualifierIds);
  const stableOrder = new Map(
    shuffle(finalNineIds, (seed ^ 0xa5a5a5a5) >>> 0).map((id, index) => [
      id,
      index,
    ]),
  );
  const others = finalNineIds
    .filter((id) => id !== championId)
    .sort(
      (left, right) =>
        (eliminationRound.get(right) ?? 0) -
          (eliminationRound.get(left) ?? 0) ||
        Number(direct.has(right)) - Number(direct.has(left)) ||
        stableOrder.get(left)! - stableOrder.get(right)!,
    );
  return [championId, ...others];
}

function completeTournament(
  state: TournamentState,
  championId: string,
): TournamentState {
  return {
    ...state,
    phase: 'complete',
    pool: [championId],
    matches: [],
    byeIds: [],
    matchIndex: 0,
    winners: [],
    losers: [],
    top9Ids: rankFinalNine(
      state.finalNineIds,
      championId,
      state.eliminations,
      state.directQualifierIds,
      state.seed,
    ),
    championId,
  };
}

export function selectWinner(
  state: TournamentState,
  winnerId: string,
): TournamentState {
  const match = getActiveMatch(state);
  if (!match || ![match.aId, match.bId].includes(winnerId)) {
    throw new Error('Invalid winner.');
  }

  const loserId = winnerId === match.aId ? match.bId : match.aId;
  const recordsFinalNineElimination = state.round >= 4;
  const next: TournamentState = {
    ...state,
    matchIndex: state.matchIndex + 1,
    winners: [...state.winners, winnerId],
    losers: [...state.losers, loserId],
    eliminations: recordsFinalNineElimination
      ? [
          ...state.eliminations,
          { loserId, round: state.round, order: match.order },
        ]
      : state.eliminations,
    completedMatches: state.completedMatches + 1,
  };
  if (next.matchIndex < next.matches.length) return next;

  if (state.phase === 'round1-direct') {
    return startPairedStage(
      { ...next, directQualifierIds: [...next.winners] },
      'round1-rescue',
      1,
      next.losers,
      2,
      true,
    );
  }

  if (state.phase === 'round1-rescue') {
    return startPairedStage(
      next,
      'round2',
      2,
      [...state.directQualifierIds, ...next.winners],
      3,
      true,
    );
  }

  if (state.phase === 'round2') {
    return startPairedStage(next, 'round3', 3, next.winners, 4, true);
  }

  if (state.phase === 'round3') {
    return startRound4(next, next.winners);
  }

  if (state.phase === 'round4-main') {
    return startRound4Challenge(next);
  }

  if (state.phase === 'round4-challenge') {
    return startPairedStage(
      next,
      'round5',
      5,
      [...state.byeIds, winnerId],
      7,
      false,
    );
  }

  if (state.phase === 'round5') {
    return startPairedStage(next, 'round6', 6, next.winners, 8, false);
  }

  return completeTournament(next, winnerId);
}

export function rankTop9(state: TournamentState): string[] {
  if (!state.championId || state.top9Ids.length !== 9) {
    throw new Error('Tournament is incomplete.');
  }
  return [...state.top9Ids];
}

export function completedMatchCount(state: TournamentState): number {
  return state.completedMatches;
}

export function totalMatchCount(entrantCount: number): number {
  return entrantCount === 48 ? 71 : 0;
}
