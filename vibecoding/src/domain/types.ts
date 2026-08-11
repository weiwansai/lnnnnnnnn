export type PreferenceId = 'slow-burn' | 'summer' | 'duet' | 'present';

export interface CandyItem {
  id: string;
  title: string;
  description: string | null;
  preferenceId: PreferenceId;
}

export interface GeneratedContent {
  items: readonly CandyItem[];
  preferences: Readonly<Record<PreferenceId, string>>;
  fallbackAnalysis: string;
}

export interface ResultViewModel {
  champion: CandyItem;
  top9: CandyItem[];
  analysisText: string;
  analysisCount: number | null;
}
