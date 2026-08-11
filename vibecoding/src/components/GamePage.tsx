import { useState } from 'react';
import type { CandyItem } from '../domain/types';

interface GamePageProps {
  left: CandyItem;
  right: CandyItem;
  completedMatches: number;
  totalMatches: number;
  locked: boolean;
  selectedId: string | null;
  onChoose: (id: string) => void;
  onRestart: () => void;
}

export function GamePage({
  left,
  right,
  completedMatches,
  totalMatches,
  locked,
  selectedId,
  onChoose,
  onRestart,
}: GamePageProps) {
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const progress = Math.round((completedMatches / totalMatches) * 100);

  const cardState = (id: string) => {
    if (!selectedId) return 'idle';
    return selectedId === id ? 'chosen' : 'rejected';
  };

  return (
    <main className="app-shell game-page">
      <header className="game-header">
        <div className="game-brand">
          <strong>总决选之我嗑lm嗑昏迷了</strong>
          <span className="accent-pair" aria-hidden="true">
            <i>♥</i>
            <i>♥</i>
          </span>
        </div>
        <button
          className="quiet-button"
          type="button"
          onClick={() => setConfirmingRestart(true)}
        >
          重新开始
        </button>
      </header>

      <section className="progress-block" aria-label="比赛进度">
        <div className="progress-copy">
          <span>{progress}%</span>
        </div>
        <progress max={totalMatches} value={completedMatches}>
          {progress}%
        </progress>
      </section>

      <section className="choice-section">
        <div className="choice-prompt">
          <span>THIS</span>
          <strong>更心动的是？</strong>
          <span>THAT</span>
        </div>

        <div className="pk-grid">
          {[left, right].map((item, index) => (
            <button
              className="pk-card"
              data-testid="pk-card"
              data-state={cardState(item.id)}
              disabled={locked}
              key={item.id}
              type="button"
              aria-pressed={selectedId === item.id}
              onClick={() => onChoose(item.id)}
            >
              <span className="card-index">0{index + 1}</span>
              <span className="card-label">PICK {index === 0 ? 'A' : 'B'}</span>
              <strong>{item.title}</strong>
              {item.description && <small>{item.description}</small>}
              <span className="card-action">
                选择它 <b aria-hidden="true">↗</b>
              </span>
            </button>
          ))}
          <span className="versus" aria-hidden="true">
            VS
          </span>
        </div>
      </section>

      {confirmingRestart && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restart-title"
          >
            <span className="dialog-emoji" aria-hidden="true">
              ↺
            </span>
            <h2 id="restart-title">要重新开一局吗？</h2>
            <p>当前进度会清空，48 个糖点将重新随机配对。</p>
            <div>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setConfirmingRestart(false)}
              >
                继续这一局
              </button>
              <button className="primary-button" type="button" onClick={onRestart}>
                确定重开
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
