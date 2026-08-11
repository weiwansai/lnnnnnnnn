import { selectPreference } from './preference';
import type { GeneratedContent, ResultViewModel } from './types';

export function buildResultViewModel(
  rankedIds: readonly string[],
  source: GeneratedContent,
): ResultViewModel {
  if (rankedIds.length !== 9 || new Set(rankedIds).size !== 9) {
    throw new Error('A result requires exactly nine unique items.');
  }

  const byId = new Map(source.items.map((item) => [item.id, item]));
  const top9 = rankedIds.map((id) => byId.get(id));
  if (top9.some((item) => !item)) {
    throw new Error('A result references an unknown item.');
  }

  const resolvedTop9 = top9 as ResultViewModel['top9'];
  const champion = resolvedTop9[0];
  const preference = selectPreference(resolvedTop9, champion.id);

  return {
    champion,
    top9: resolvedTop9,
    analysisText: preference.fallback
      ? source.fallbackAnalysis
      : source.preferences[preference.id],
    analysisCount: preference.fallback ? null : preference.count,
  };
}
