import { describe, expect, it } from 'vitest';
import { content } from './generatedContent';

describe('generated workbook content', () => {
  it('contains 48 unique categorized items including 捡绑带', () => {
    expect(content.items).toHaveLength(48);
    expect(new Set(content.items.map((item) => item.id)).size).toBe(48);
    expect(content.items.some((item) => item.title === '捡绑带')).toBe(true);
    expect(content.items.every((item) => item.title.length > 0)).toBe(true);
    expect(
      content.items.every(
        (item) => item.preferenceId in content.preferences,
      ),
    ).toBe(true);
  });

  it('contains four analyses and one fallback', () => {
    expect(Object.keys(content.preferences)).toHaveLength(4);
    expect(Object.values(content.preferences).every(Boolean)).toBe(true);
    expect(content.fallbackAnalysis.length).toBeGreaterThan(0);
  });

  it('reflects the revised workbook copy and moved preference boundary', () => {
    expect(
      content.items.find((item) => item.title === '网易云ai兔子头像')?.description,
    ).toBe('怎么能把师兄喂ai呢？！');
    expect(content.items.some((item) => item.title === '楼道过生日')).toBe(true);
    expect(
      content.items.find((item) => item.title === '摸耳朵')?.preferenceId,
    ).toBe('present');
    expect(content.preferences['slow-burn']).toContain('真心是最要紧的');
    expect(content.fallbackAnalysis).toContain('os好想看');
  });
});
