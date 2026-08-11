import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CandyItem, ResultViewModel } from '../domain/types';
import { ResultPage } from './ResultPage';

const top9: CandyItem[] = Array.from({ length: 9 }, (_, index) => ({
  id: `item-${index}`,
  title: index === 0 ? '捡绑带' : `糖点 ${index + 1}`,
  description: null,
  preferenceId: 'present',
}));
const model: ResultViewModel = {
  champion: top9[0],
  top9,
  analysisText: '家产现阶段的风味就是你心中的最好风味。',
  analysisCount: 4,
};

describe('ResultPage', () => {
  it('keeps the result layout while showing the champion and all TOP 9 items', () => {
    const { container } = render(
      <ResultPage
        model={model}
        shareUrl="https://example.com/#result=abc"
        onShare={vi.fn()}
        onRestart={vi.fn()}
      />,
    );
    expect(screen.getByText('我心中的神糖 No.1')).toBeVisible();
    expect(container.querySelector('.champion-orbit')).not.toBeInTheDocument();
    expect(
      [...container.querySelectorAll('.accent-pair i')].map(
        (element) => element.textContent,
      ),
    ).toEqual(['♥', '♥']);
    expect(screen.getByRole('heading', { name: '捡绑带' })).toBeVisible();
    expect(screen.getAllByTestId('result-grid-item')).toHaveLength(9);
    expect(
      screen.getByRole('heading', { name: '令人心动的糖点' }),
    ).toBeVisible();
    expect(screen.queryByText('MY FINAL LIST')).not.toBeInTheDocument();
    const grid = container.querySelector('.top-seven-list');
    expect(grid).not.toBeNull();
    for (let index = 1; index <= 9; index += 1) {
      expect(
        within(grid as HTMLElement).queryByText(String(index).padStart(2, '0')),
      ).not.toBeInTheDocument();
    }
    expect(within(grid as HTMLElement).queryByText('NO.1')).not.toBeInTheDocument();
    expect(screen.getByText(model.analysisText)).toBeVisible();
    expect(screen.queryByText(/TOP 9 中有/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '分享结果' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: '保存海报' })).not.toBeInTheDocument();
  });
});
