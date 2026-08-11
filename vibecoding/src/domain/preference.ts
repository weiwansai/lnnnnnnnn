import type { CandyItem, PreferenceId } from './types';

const preferenceOrder: PreferenceId[] = [
  'slow-burn',
  'summer',
  'duet',
  'present',
];

export type PreferenceResult =
  | { id: PreferenceId; count: number; fallback: false }
  | { id: null; count: 0; fallback: true };

export function selectPreference(
  top9: readonly CandyItem[],
  championId: string,
): PreferenceResult {
  if (top9.length !== 9) {
    throw new Error('Preference analysis requires exactly nine items.');
  }

  const counts = Object.fromEntries(
    preferenceOrder.map((id) => [id, 0]),
  ) as Record<PreferenceId, number>;

  top9.forEach((entry) => {
    counts[entry.preferenceId] += 1;
  });

  const maximum = Math.max(...Object.values(counts));
  if (maximum < 4) {
    return { id: null, count: 0, fallback: true };
  }

  const tied = preferenceOrder.filter((id) => counts[id] === maximum);
  const champion = top9.find((entry) => entry.id === championId);
  const id =
    champion && tied.includes(champion.preferenceId)
      ? champion.preferenceId
      : tied[0];

  return { id, count: counts[id], fallback: false };
}
