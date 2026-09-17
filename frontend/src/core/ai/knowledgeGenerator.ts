import { KnowledgeDraft, KnowledgeExtractionResult, KnowledgeDraftType } from '../types';

export interface KnowledgeExtractionInput {
  lessonId: string;
  courseId: string;
  courseName: string;
  sectionName: string;
  lessonTitle: string;
  content: string; // Transcript / lecture notes
  notes?: string;
}

/**
 * KnowledgeGenerator Contract Interface
 *
 * Pluggable abstraction for future extraction backends:
 * - OllamaKnowledgeGenerator (Local LLM via Ollama)
 * - CloudKnowledgeGenerator (OpenAI / Anthropic / Gemini Cloud API)
 * - MockKnowledgeGenerator (Automated unit tests)
 *
 * Guarantees:
 * 1. Extraction outputs KnowledgeDraft items that must be user-approved before becoming RevisionItems.
 * 2. Generated drafts preserve full Mosh provenance (courseId, videoId, sectionName, lessonTitle).
 * 3. Does not write directly to active revision rotation without user consent.
 */
export interface KnowledgeGenerator {
  readonly providerName: string;
  generate(input: KnowledgeExtractionInput): Promise<KnowledgeExtractionResult>;
}

/**
 * Placeholder / Staging Knowledge Generator
 *
 * Serves as the default contract implementation before live AI models are connected.
 * Throws a clear, human-readable operational message or returns empty staged drafts.
 */
export class PlaceholderKnowledgeGenerator implements KnowledgeGenerator {
  readonly providerName = 'Placeholder (AI Provider Not Connected Yet)';

  async generate(input: KnowledgeExtractionInput): Promise<KnowledgeExtractionResult> {
    if (!input.content || !input.content.trim()) {
      throw new Error('Lesson transcript or notes are required for knowledge extraction.');
    }

    // Returns empty drafts for now - live provider will be connected in next milestone
    return {
      lessonId: input.lessonId,
      courseId: input.courseId,
      courseName: input.courseName,
      sectionName: input.sectionName,
      lessonTitle: input.lessonTitle,
      drafts: [],
      extractedAt: Date.now(),
    };
  }
}

/**
 * Knowledge Generator Factory
 * Returns active configured generator instance.
 */
export function getKnowledgeGenerator(): KnowledgeGenerator {
  return new PlaceholderKnowledgeGenerator();
}
