import { z } from 'zod';
const ms = z.number().int().nonnegative();
export const tokenSchema = z.object({
  id: z.string().min(1), surface: z.string().min(1), reading: z.string().optional(),
  lemma: z.string().optional(), pos: z.string().optional(), meaning: z.string().optional(),
  note: z.string().optional(), isPunctuation: z.boolean().optional(),
});
export const sentenceSchema = z.object({
  id: z.string(), unitIndex: z.number().int(),
  role: z.enum(['narration', 'dialogue', 'question', 'prompt', 'option']),
  speaker: z.string().nullable(), optionNumber: z.number().int().nullable(),
  text: z.string().min(1), sourcePdfPage: z.number().int().positive().nullable(), sourceAsrLines: z.array(z.number().int()),
  startMs: ms.nullable(), endMs: ms.nullable(), confidence: z.number().min(0).max(1),
  alignment: z.enum(['asr_text_estimated', 'unmatched_interpolated']), needsAudioReview: z.boolean(),
  tokensStatus: z.enum(['pending_agent_annotation', 'reviewed']), tokens: z.array(tokenSchema),
  highlightRole: z.enum(['neutral', 'question', 'important', 'contrast', 'negation']),
  translation: z.string().optional(), grammarNotes: z.array(z.string()).optional(), annotationReview: z.string().optional(),
  textSource: z.string().optional(), timingStatus: z.string().optional(), timingConflict: z.boolean().optional(),
  furiganaTokens: z.array(z.object({surface:z.string(),reading:z.string()})).optional(), sourcePdfLines:z.array(z.number().int()).optional(), sourceExamId:z.string().optional(), sourceWindowStartMs:ms.optional(), sourceWindowEndMs:ms.optional(), boundaryPauseDetected:z.boolean().optional(), readingNeedsReview:z.boolean().optional(),
  sourceSrtIndices: z.array(z.number().int()).optional(), loopAllowed: z.boolean().optional(), timingSubtitleSource: z.string().optional(),
}).refine(s => (s.startMs === null && s.endMs === null) || (s.startMs !== null && s.endMs !== null && s.startMs < s.endMs), '句子时间倒置');
export const questionSchema = z.object({
  id: z.string(), number: z.number().int().nonnegative(), kind:z.enum(['example','question']).optional(), title:z.string().nullish(), exampleSource:z.string().optional(), audioOverride:z.object({src:z.string(),available:z.boolean(),note:z.string(),durationMs:ms.optional(),peaksPath:z.string().optional(),redistributionAuthorized:z.boolean().default(false)}).optional(), section: z.number().int().min(1).max(5),
  sectionName: z.string(), startMs: ms.nullable(), endMs: ms.nullable(), playStartMs: ms.nullable(), playEndMs: ms.nullable(),
  rawWindowStartMs: ms.nullable(), rawWindowEndMs: ms.nullable(), answer: z.number().int().nullable(),
  answerDescription: z.string().nullable(), answerExtra: z.array(z.string()),
  subQuestions: z.array(z.object({number: z.number().int(), prompt: z.string(), answerText: z.string().nullable()})).nullish(),
  sentences: z.array(sentenceSchema).min(1),
});
export const paperSchema = z.object({
  schemaVersion: z.enum(['3.0.0','4.0.0','5.0.0']), id: z.string(), level: z.literal('N1'), year: z.number().int(), month: z.union([z.literal(7), z.literal(12)]),
  displayName: z.string(),
  audio: z.object({src: z.string(), available: z.boolean(), note: z.string(), durationMs: ms.optional(), peaksPath: z.string().optional(), redistributionAuthorized: z.boolean().default(false), timelineStatus:z.string().optional()}),
  timing: z.object({source: z.string(), precision: z.enum(['estimated', 'verified']), audioVerified: z.boolean(), warning: z.string()}),
  textAuthority: z.string(),
  sections: z.array(z.object({id: z.number().int().min(1).max(5), name: z.string(), questions: z.array(questionSchema).min(1)})).min(1),
  sourceIssues: z.array(z.string()).optional(),
  aiAvailable:z.boolean().optional(),
});
export const manifestSchema = z.object({schemaVersion: z.literal('3.0.0'), papers: z.array(z.object({id: z.string(), year: z.number().int(), month: z.number().int(), level: z.literal('N1'), label: z.string(), contentPath: z.string()}))});
export type Paper = z.infer<typeof paperSchema>;
export type Question = z.infer<typeof questionSchema>;
export type Sentence = z.infer<typeof sentenceSchema>;
export type Token = z.infer<typeof tokenSchema>;
