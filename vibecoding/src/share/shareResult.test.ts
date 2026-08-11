import { afterEach, describe, expect, it, vi } from 'vitest';
import { shareResult } from './shareResult';

afterEach(() => vi.restoreAllMocks());

describe('shareResult', () => {
  it('uses native sharing when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });

    await expect(
      shareResult('结果标题', '结果文本', 'https://example.com/#result=x'),
    ).resolves.toBe('shared');
    expect(share).toHaveBeenCalledWith({
      title: '结果标题',
      text: '结果文本',
      url: 'https://example.com/#result=x',
    });
  });

  it('copies the full result when native sharing is unavailable', async () => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await expect(
      shareResult('结果标题', '冠军：捡绑带', 'https://example.com/#result=x'),
    ).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith(
      '冠军：捡绑带\nhttps://example.com/#result=x',
    );
  });
});
