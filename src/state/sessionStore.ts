import { create } from 'zustand';
import type { Token } from '../content/schemas';
export type TextMode = 'blind' | 'single' | 'all';
type Session = {
  mode: TextMode; furigana: boolean; selectedWord: Token | null; dictation: string; compare: boolean;
  setMode: (mode: TextMode) => void; setFurigana: (value: boolean) => void;
  selectWord: (word: Token | null) => void; setDictation: (text: string) => void;
  setCompare: (value: boolean) => void; resetQuestion: () => void;
};
export const useSession = create<Session>(set => ({
  mode: 'all', furigana: false, selectedWord: null, dictation: '', compare: false,
  setMode: mode => set({mode, selectedWord: null, compare: false}),
  setFurigana: furigana => set({furigana}), selectWord: selectedWord => set({selectedWord}),
  setDictation: dictation => set({dictation}), setCompare: compare => set({compare}),
  resetQuestion: () => set({selectedWord: null, dictation: '', compare: false}),
}));
