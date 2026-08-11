import type { ResultViewModel } from '../domain/types';

interface ResultPageProps {
  model: ResultViewModel;
  shareUrl: string;
  onShare: () => void;
  onRestart: () => void;
  shared?: boolean;
  feedback?: string;
}

export function ResultPage({
  model,
  shareUrl,
  onShare,
  onRestart,
  shared = false,
  feedback = '',
}: ResultPageProps) {
  return (
    <main className="app-shell result-page">
      <header className="result-header">
        <div className="result-brand">
          <strong>总决选 · RESULT</strong>
          <span className="accent-pair" aria-hidden="true">
            <i>♥</i>
            <i>♥</i>
          </span>
        </div>
        <span className="result-stamp">FINAL · 01</span>
      </header>

      <section className="champion-panel">
        <p>我心中的神糖 No.1</p>
        <h1>{model.champion.title}</h1>
        {model.champion.description && (
          <blockquote>{model.champion.description}</blockquote>
        )}
        <span className="crown-mark" aria-hidden="true">
          01
        </span>
      </section>

      <section className="top-seven-section" aria-labelledby="top-nine-title">
        <div className="section-heading">
          <div>
            <h2 id="top-nine-title">令人心动的糖点</h2>
          </div>
          <span className="tiny-emoji" aria-hidden="true">
            🫶
          </span>
        </div>
        <ol className="top-seven-list">
          {model.top9.map((item) => (
            <li data-testid="result-grid-item" key={item.id}>
              <strong>{item.title}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className="analysis-panel">
        <span className="analysis-label">YOUR FLAVOR</span>
        <h2>你的磕糖偏好</h2>
        <p className="analysis-copy">{model.analysisText}</p>
      </section>

      <section className="result-actions">
        {!shared && (
          <button className="primary-button" type="button" onClick={onShare}>
            分享结果 <span aria-hidden="true">↗</span>
          </button>
        )}
        <button
          className={shared ? 'primary-button' : 'text-button'}
          type="button"
          onClick={onRestart}
        >
          {shared ? '我也要测' : '再来一次'}
        </button>
      </section>

      <p className="share-feedback" role="status" aria-live="polite">
        {feedback}
      </p>
      <output data-testid="share-url" data-url={shareUrl} hidden>
        {shareUrl}
      </output>
    </main>
  );
}
