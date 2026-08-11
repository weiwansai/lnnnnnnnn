import { describe, expect, it } from 'vitest';
import { content } from '../data/generatedContent';
import { buildResultViewModel } from './result';

describe('buildResultViewModel', () => {
  it('uses the ranked champion and a four-item preference across TOP 9', () => {
    const summer = content.items.filter((item) => item.preferenceId === 'summer');
    const rankedIds = [
      ...summer.slice(0, 4),
      ...content.items.filter((item) => item.preferenceId === 'duet').slice(0, 2),
      ...content.items.filter((item) => item.preferenceId === 'present').slice(0, 2),
      content.items.find((item) => item.preferenceId === 'slow-burn')!,
    ].map((item) => item.id);

    const model = buildResultViewModel(rankedIds, content);

    expect(model.champion.id).toBe(rankedIds[0]);
    expect(model.top9).toHaveLength(9);
    expect(model.analysisCount).toBe(4);
    expect(model.analysisText).toBe(content.preferences.summer);
  });

  it('uses fallback copy when no category reaches four items', () => {
    const rankedIds = [
      ...content.items.filter((item) => item.preferenceId === 'slow-burn').slice(0, 3),
      ...content.items.filter((item) => item.preferenceId === 'summer').slice(0, 2),
      ...content.items.filter((item) => item.preferenceId === 'duet').slice(0, 2),
      ...content.items.filter((item) => item.preferenceId === 'present').slice(0, 2),
    ].map((item) => item.id);

    const model = buildResultViewModel(rankedIds, content);
    expect(model.top9).toHaveLength(9);
    expect(model.analysisCount).toBeNull();
    expect(model.analysisText).toBe(content.fallbackAnalysis);
  });
});
