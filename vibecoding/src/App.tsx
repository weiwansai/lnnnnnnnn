import { useMemo, useRef, useState } from 'react';
import { GamePage } from './components/GamePage';
import { ResultPage } from './components/ResultPage';
import { content } from './data/generatedContent';
import { selectPreference } from './domain/preference';
import { buildResultViewModel } from './domain/result';
import {
  decodeSharedResult,
  encodeSharedResult,
} from './domain/shareCodec';
import {
  completedMatchCount,
  createTournament,
  getActiveMatch,
  rankTop9,
  selectWinner,
  totalMatchCount,
  type TournamentState,
} from './domain/tournament';
import { shareResult } from './share/shareResult';
import type { CandyItem } from './domain/types';

type View = 'game' | 'result';

const itemIds: string[] = content.items.map((item) => item.id);
const protectedSeedIds = ['candy-14', 'candy-13', 'candy-26'].filter((id) =>
  itemIds.includes(id),
);
const itemById = new Map<string, CandyItem>(
  content.items.map((item) => [item.id, item]),
);
const validIds = new Set<string>(itemIds);

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

function resultUrl(top9Ids: string[]): string {
  const top9 = top9Ids.map((id) => itemById.get(id)!);
  const preference = selectPreference(top9, top9Ids[0]);
  const encoded = encodeSharedResult({
    version: 2,
    top9Ids,
    preferenceId: preference.fallback ? null : preference.id,
  });
  return `${window.location.origin}${window.location.pathname}#result=${encoded}`;
}

export default function App() {
  const initialSharedResult = useMemo(
    () => decodeSharedResult(window.location.hash, validIds),
    [],
  );
  const [view, setView] = useState<View>(initialSharedResult ? 'result' : 'game');
  const [tournament, setTournament] = useState<TournamentState | null>(() =>
    initialSharedResult
      ? null
      : createTournament(itemIds, randomSeed(), protectedSeedIds),
  );
  const [rankedIds, setRankedIds] = useState<string[] | null>(
    initialSharedResult?.top9Ids ?? null,
  );
  const [shared, setShared] = useState(Boolean(initialSharedResult));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const transitionTimer = useRef<number | null>(null);

  const startGame = () => {
    if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
    window.history.replaceState(null, '', window.location.pathname);
    setTournament(createTournament(itemIds, randomSeed(), protectedSeedIds));
    setRankedIds(null);
    setSelectedId(null);
    setFeedback('');
    setShared(false);
    setView('game');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const choose = (id: string) => {
    if (!tournament || selectedId) return;
    setSelectedId(id);
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    transitionTimer.current = window.setTimeout(() => {
      const next = selectWinner(tournament, id);
      setTournament(next);
      setSelectedId(null);
      if (next.championId) {
        setRankedIds(rankTop9(next));
        setView('result');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }, reducedMotion ? 20 : 320);
  };

  const model = rankedIds ? buildResultViewModel(rankedIds, content) : null;
  const shareUrl = rankedIds ? resultUrl(rankedIds) : '';

  const handleShare = async () => {
    if (!model) return;
    setFeedback('');
    try {
      const topLine = model.top9
        .map((item, index) => `${index + 1}. ${item.title}`)
        .join(' / ');
      const outcome = await shareResult(
        '总决选之我嗑lm嗑昏迷了',
        `我心中的神糖 No.1：${model.champion.title}\n我的前9名：${topLine}`,
        shareUrl,
      );
      if (outcome === 'shared') setFeedback('分享面板已打开 ✦');
      if (outcome === 'copied') setFeedback('结果和链接已复制，可以发给朋友啦 ✦');
    } catch {
      setFeedback('暂时没能复制，请长按地址栏复制当前链接。');
    }
  };

  if (view === 'result' && model) {
    return (
      <ResultPage
        model={model}
        shareUrl={shareUrl}
        onShare={handleShare}
        onRestart={startGame}
        shared={shared}
        feedback={feedback}
      />
    );
  }

  if (tournament) {
    const match = getActiveMatch(tournament);
    if (match) {
      return (
        <GamePage
          left={itemById.get(match.aId)!}
          right={itemById.get(match.bId)!}
          completedMatches={completedMatchCount(tournament)}
          totalMatches={totalMatchCount(content.items.length)}
          locked={Boolean(selectedId)}
          selectedId={selectedId}
          onChoose={choose}
          onRestart={startGame}
        />
      );
    }
  }

  return null;
}
