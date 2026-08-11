import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { content } from './data/generatedContent';
import { encodeSharedResult } from './domain/shareCodec';

describe('App', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', window.location.pathname);
  });

  it('enters a fresh game immediately with the new title', () => {
    render(<App />);
    expect(screen.getAllByTestId('pk-card')).toHaveLength(2);
    expect(screen.getByText('总决选之我嗑lm嗑昏迷了')).toBeVisible();
    expect(screen.queryByRole('button', { name: '开始磕糖' })).not.toBeInTheDocument();
    expect(screen.queryByText(/已完成.*次选择/)).not.toBeInTheDocument();
  });

  it('opens a shared TOP 9 result with the unchanged result layout', () => {
    const encoded = encodeSharedResult({
      version: 2,
      top9Ids: content.items.slice(0, 9).map((item) => item.id),
      preferenceId: null,
    });
    window.location.hash = `result=${encoded}`;

    render(<App />);

    expect(
      screen.getByRole('heading', { name: '令人心动的糖点' }),
    ).toBeVisible();
    expect(screen.getAllByTestId('result-grid-item')).toHaveLength(9);
  });
});
