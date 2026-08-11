import { describe, expect, it } from 'vitest';
import {
  completedMatchCount,
  createTournament,
  getActiveMatch,
  rankFinalNine,
  rankTop9,
  selectWinner,
  totalMatchCount,
  type Elimination,
  type TournamentState,
} from './tournament';

const ids = Array.from({ length: 48 }, (_, index) => `item-${index + 1}`);
const protectedIds = ids.slice(0, 3);

function activeMatch(state: TournamentState) {
  const match = getActiveMatch(state);
  if (!match) throw new Error('Expected an active match.');
  return match;
}

function playCurrentStage(
  state: TournamentState,
  pickWinner: (state: TournamentState) => string = (current) =>
    activeMatch(current).aId,
): TournamentState {
  const phase = state.phase;
  let next = state;
  while (!next.championId && next.phase === phase) {
    next = selectWinner(next, pickWinner(next));
  }
  return next;
}

function expectProtectedSeparated(state: TournamentState) {
  const protectedSet = new Set(protectedIds);
  expect(
    state.matches.every(
      (match) =>
        Number(protectedSet.has(match.aId)) +
          Number(protectedSet.has(match.bId)) <=
        1,
    ),
  ).toBe(true);
}

function chooseProtected(state: TournamentState): string {
  const match = activeMatch(state);
  if (protectedIds.includes(match.aId)) return match.aId;
  if (protectedIds.includes(match.bId)) return match.bId;
  return match.aId;
}

function makeProtectedLose(state: TournamentState): string {
  const match = activeMatch(state);
  if (protectedIds.includes(match.aId)) return match.bId;
  if (protectedIds.includes(match.bId)) return match.aId;
  return match.aId;
}

describe('tournament engine', () => {
  it('runs 48→24, rescue 24→12, then 36→18→9→4→2→1', () => {
    let state = createTournament(ids, 12345, protectedIds);
    expect(state.phase).toBe('round1-direct');
    expect(state.round).toBe(1);
    expect(state.matches).toHaveLength(24);
    expect(new Set(state.matches.flatMap((match) => [match.aId, match.bId]))).toEqual(
      new Set(ids),
    );

    state = playCurrentStage(state);
    expect(state.phase).toBe('round1-rescue');
    expect(state.round).toBe(1);
    expect(state.directQualifierIds).toHaveLength(24);
    expect(state.pool).toHaveLength(24);
    expect(state.matches).toHaveLength(12);

    state = playCurrentStage(state);
    expect(state.phase).toBe('round2');
    expect(state.round).toBe(2);
    expect(state.pool).toHaveLength(36);
    expect(state.matches).toHaveLength(18);

    state = playCurrentStage(state);
    expect(state.phase).toBe('round3');
    expect(state.pool).toHaveLength(18);
    expect(state.matches).toHaveLength(9);

    state = playCurrentStage(state);
    expect(state.phase).toBe('round4-main');
    expect(state.pool).toHaveLength(9);
    expect(state.finalNineIds).toHaveLength(9);
    expect(state.matches).toHaveLength(4);
    expect(state.round4ChallengerId).not.toBeNull();

    state = playCurrentStage(state);
    expect(state.phase).toBe('round4-challenge');
    expect(state.matches).toHaveLength(1);
    expect(state.byeIds).toHaveLength(3);

    state = playCurrentStage(state);
    expect(state.phase).toBe('round5');
    expect(state.pool).toHaveLength(4);
    expect(state.matches).toHaveLength(2);

    state = playCurrentStage(state);
    expect(state.phase).toBe('round6');
    expect(state.pool).toHaveLength(2);
    expect(state.matches).toHaveLength(1);

    state = playCurrentStage(state);
    expect(state.phase).toBe('complete');
    expect(state.pool).toHaveLength(1);
    expect(completedMatchCount(state)).toBe(71);
    expect(totalMatchCount(48)).toBe(71);
    expect(rankTop9(state)).toHaveLength(9);
    expect(new Set(rankTop9(state))).toHaveLength(9);
    expect(rankTop9(state)[0]).toBe(state.championId);
  });

  it('keeps all three seeds apart through direct, rescue, Round 2, and Round 3', () => {
    let state = createTournament(ids, 8765, protectedIds);
    expectProtectedSeparated(state);

    state = playCurrentStage(state, makeProtectedLose);
    expect(state.phase).toBe('round1-rescue');
    expect(protectedIds.every((id) => state.pool.includes(id))).toBe(true);
    expectProtectedSeparated(state);

    state = playCurrentStage(state, chooseProtected);
    expect(state.phase).toBe('round2');
    expectProtectedSeparated(state);

    state = playCurrentStage(state, chooseProtected);
    expect(state.phase).toBe('round3');
    expectProtectedSeparated(state);

    state = playCurrentStage(state, chooseProtected);
    expect(state.phase).toBe('round4-main');
    expect(protectedIds.every((id) => state.finalNineIds.includes(id))).toBe(true);
  });

  it('uses the odd ninth candy to challenge one of four Round 4 winners', () => {
    let state = createTournament(ids, 222, protectedIds);
    while (state.phase !== 'round4-main') {
      state = selectWinner(state, activeMatch(state).aId);
    }

    const challengerId = state.round4ChallengerId!;
    const mainIds = state.matches.flatMap((match) => [match.aId, match.bId]);
    expect(mainIds).toHaveLength(8);
    expect(new Set(mainIds)).toHaveLength(8);
    expect(mainIds).not.toContain(challengerId);

    state = playCurrentStage(state);
    const challenge = activeMatch(state);
    expect([challenge.aId, challenge.bId]).toContain(challengerId);
    const challengedWinner =
      challenge.aId === challengerId ? challenge.bId : challenge.aId;
    expect(state.byeIds).toHaveLength(3);
    expect(state.byeIds).not.toContain(challengedWinner);
    const untouchedWinners = [...state.byeIds];

    state = selectWinner(state, challengerId);
    expect(state.phase).toBe('round5');
    expect(new Set(state.pool)).toEqual(new Set([...untouchedWinners, challengerId]));
  });

  it('ranks later eliminations first and direct qualifiers first within a round', () => {
    const finalNine = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
    const eliminations: Elimination[] = [
      { loserId: 'b', round: 6, order: 0 },
      { loserId: 'c', round: 5, order: 0 },
      { loserId: 'd', round: 5, order: 1 },
      { loserId: 'e', round: 4, order: 0 },
      { loserId: 'f', round: 4, order: 1 },
      { loserId: 'g', round: 4, order: 2 },
      { loserId: 'h', round: 4, order: 3 },
      { loserId: 'i', round: 4, order: 4 },
    ];
    const direct = ['a', 'b', 'd', 'e', 'g'];

    const ranked = rankFinalNine(
      finalNine,
      'a',
      eliminations,
      direct,
      77,
    );

    expect(ranked[0]).toBe('a');
    expect(ranked[1]).toBe('b');
    expect(ranked.indexOf('d')).toBeLessThan(ranked.indexOf('c'));
    expect(Math.max(ranked.indexOf('e'), ranked.indexOf('g'))).toBeLessThan(
      Math.min(ranked.indexOf('f'), ranked.indexOf('h'), ranked.indexOf('i')),
    );
    expect(rankFinalNine(finalNine, 'a', eliminations, direct, 77)).toEqual(
      ranked,
    );
  });

  it('reproduces pairings and rejects invalid tournaments or selections', () => {
    expect(createTournament(ids, 77, protectedIds).matches).toEqual(
      createTournament(ids, 77, protectedIds).matches,
    );
    expect(createTournament(ids, 78, protectedIds).matches).not.toEqual(
      createTournament(ids, 77, protectedIds).matches,
    );
    expect(() => createTournament(ids.slice(0, 46), 1)).toThrow(
      'exactly forty-eight unique items',
    );
    expect(() => createTournament(ids, 1, ['unknown'])).toThrow(
      'Protected items must be tournament entrants',
    );
    const state = createTournament(ids, 1, protectedIds);
    expect(() => selectWinner(state, 'unknown')).toThrow('Invalid winner');
  });
});
