import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GamePage } from './GamePage';
import type { CandyItem } from '../domain/types';

const left: CandyItem = {
  id: 'left',
  title: '捡绑带',
  description: null,
  preferenceId: 'present',
};
const right: CandyItem = {
  id: 'right',
  title: '26运动会散场',
  description: '“听到了大家的声音 所以知道你在我身边”',
  preferenceId: 'present',
};

describe('GamePage', () => {
  it('renders two semantic choice cards and reports a choice once', async () => {
    const onChoose = vi.fn();
    const { container } = render(
      <GamePage
        left={left}
        right={right}
        completedMatches={0}
        totalMatches={71}
        locked={false}
        selectedId={null}
        onChoose={onChoose}
        onRestart={vi.fn()}
      />,
    );
    expect(screen.getAllByTestId('pk-card')).toHaveLength(2);
    expect(
      [...container.querySelectorAll('.accent-pair i')].map(
        (element) => element.textContent,
      ),
    ).toEqual(['♥', '♥']);
    expect(screen.getByText('总决选之我嗑lm嗑昏迷了')).toBeVisible();
    expect(screen.queryByText('ROUND 01')).not.toBeInTheDocument();
    expect(screen.queryByText('第一轮 · 初遇')).not.toBeInTheDocument();
    expect(screen.getAllByText('0%')).toHaveLength(2);
    expect(screen.queryByText(/已完成.*次选择/)).not.toBeInTheDocument();
    expect(screen.queryByText('跟着第一反应选，不许端水。')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /捡绑带/ }));
    expect(onChoose).toHaveBeenCalledOnce();
    expect(onChoose).toHaveBeenCalledWith('left');
  });

  it('locks both cards during the transition', () => {
    render(
      <GamePage
        left={left}
        right={right}
        completedMatches={1}
        totalMatches={71}
        locked
        selectedId="left"
        onChoose={vi.fn()}
        onRestart={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /捡绑带/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /26运动会散场/ })).toBeDisabled();
  });
});
