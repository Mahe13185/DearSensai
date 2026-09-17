import { CodingProblem, RevisionItem, Subject, Topic } from '../types';
import { subjectRepo, topicRepo, codingProblemRepo, revisionItemRepo, reviewRepo } from '../../storage/repositories';
import { createInitialSchedule } from '../scheduler/srs';
import { ScannedFile } from './kaizenDsaScanner';

export interface ImportOptions {
  repoName?: string;
  existingAction: 'SKIP' | 'UPDATE'; // What to do if file already exists in DB
}

export interface ImportResult {
  success: boolean;
  repoName: string;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  totalRevisionItemsCreated: number;
  topicsCreated: string[];
  errors: string[];
}

/**
 * Execute the import of selected scanned files into DearSensai IndexedDB
 */
export async function executeKaizenDsaImport(
  selectedFiles: ScannedFile[],
  options: ImportOptions = { existingAction: 'UPDATE' }
): Promise<ImportResult> {
  const repoName = options.repoName || 'KaizenDSA';
  const errors: string[] = [];
  const topicsCreated: string[] = [];
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let totalRevisionItemsCreated = 0;

  try {
    // 1. Ensure DSA Subject exists
    const subjects = await subjectRepo.getAll();
    let dsaSubject = subjects.find(
      (s) =>
        s.id === 'sub_dsa' ||
        s.title.toLowerCase().includes('data structures') ||
        s.title.toLowerCase() === 'dsa'
    );

    if (!dsaSubject) {
      dsaSubject = await subjectRepo.create({
        id: 'sub_dsa',
        title: 'Data Structures & Algorithms',
        icon: 'Binary',
        description: 'Core patterns, two-pointer, trees, graphs, dynamic programming, and complexity logic.',
        color: 'var(--subject-dsa)',
        orderIndex: 1,
      });
    }

    // 2. Fetch or create Topics for detected topic names
    const existingTopics = await topicRepo.getBySubject(dsaSubject.id);
    const topicMap = new Map<string, Topic>();
    existingTopics.forEach((t) => {
      topicMap.set(t.title.toLowerCase().trim(), t);
    });

    // Helper to get or create topic
    const getOrCreateTopic = async (topicTitle: string): Promise<Topic> => {
      const key = topicTitle.toLowerCase().trim();
      const existing = topicMap.get(key);
      if (existing) return existing;

      // Create new topic under DSA
      const newTopic = await topicRepo.create({
        id: `top_dsa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        subjectId: dsaSubject!.id,
        title: topicTitle,
        description: `Imported from ${repoName} (${topicTitle} patterns and solutions).`,
        orderIndex: topicMap.size + 1,
      });

      topicMap.set(key, newTopic);
      topicsCreated.push(topicTitle);
      return newTopic;
    };

    // 3. Process each selected file
    for (const file of selectedFiles) {
      try {
        const topic = await getOrCreateTopic(file.detectedTopic);

        if (file.status === 'EXISTING') {
          if (options.existingAction === 'SKIP') {
            skippedCount++;
            continue;
          }

          // UPDATE MODE: Update coding problem and revision items without touching attempt/schedule history
          if (file.existingProblem) {
            await codingProblemRepo.update({
              ...file.existingProblem,
              sourceCode: file.sourceCode,
              language: file.language,
              title: file.title,
              topicId: topic.id,
              subjectId: dsaSubject.id,
              updatedAt: Date.now(),
            });
          }

          if (file.existingRecallItem) {
            await revisionItemRepo.update({
              ...file.existingRecallItem,
              title: `${file.title} (Code Recall)`,
              frontContent: `Can you implement ${file.title} without looking at your previous solution?`,
              backContent: file.sourceCode,
              codeSnippet: file.sourceCode,
              codeLanguage: file.language,
              topicId: topic.id,
              updatedAt: Date.now(),
            });
          }

          if (file.existingExplainItem) {
            await revisionItemRepo.update({
              ...file.existingExplainItem,
              title: `${file.title} (Approach & Logic)`,
              frontContent: `Explain the approach and data structures used in your ${file.title} solution.`,
              backContent: file.docExplanation || file.existingExplainItem.backContent || '',
              codeSnippet: file.sourceCode,
              codeLanguage: file.language,
              topicId: topic.id,
              updatedAt: Date.now(),
            });
          }

          updatedCount++;
        } else {
          // NEW FILE: Create CodingProblem + Code Recall Item + Code Explanation Item
          const problemId = `prob_kaizen_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await codingProblemRepo.create({
            id: problemId,
            sourceType: 'KAIZEN_DSA',
            sourceRepo: repoName,
            filePath: file.filePath,
            normalizedPath: file.filePath,
            title: file.title,
            language: file.language,
            sourceCode: file.sourceCode,
            subjectId: dsaSubject.id,
            topicId: topic.id,
          });

          // 1. Code Recall Revision Item
          const recallItemId = `item_recall_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const recallItem: RevisionItem = {
            id: recallItemId,
            topicId: topic.id,
            type: 'CODE_RECALL',
            title: `${file.title} (Code Recall)`,
            frontContent: `Can you implement ${file.title} without looking at your previous solution?`,
            backContent: file.sourceCode,
            codeSnippet: file.sourceCode,
            codeLanguage: file.language,
            difficulty: 'LEVEL_1',
            sourceMetadata: {
              sourceType: 'KAIZEN_DSA',
              sourceRepo: repoName,
              filePath: file.filePath,
              problemId,
            },
            tags: ['KAIZEN_DSA', file.language.toUpperCase(), topic.title],
            isEnabled: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await revisionItemRepo.create(recallItem);
          await reviewRepo.saveSchedule(createInitialSchedule(recallItemId));
          totalRevisionItemsCreated++;

          // 2. Code Explanation Revision Item
          const explainItemId = `item_explain_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const explainItem: RevisionItem = {
            id: explainItemId,
            topicId: topic.id,
            type: 'CODE_EXPLANATION',
            title: `${file.title} (Approach & Logic)`,
            frontContent: `Explain the approach and data structures used in your ${file.title} solution.`,
            backContent: file.docExplanation || '', // Left blank if user hasn't provided explanation
            codeSnippet: file.sourceCode,
            codeLanguage: file.language,
            sourceMetadata: {
              sourceType: 'KAIZEN_DSA',
              sourceRepo: repoName,
              filePath: file.filePath,
              problemId,
            },
            tags: ['KAIZEN_DSA', file.language.toUpperCase(), topic.title],
            isEnabled: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await revisionItemRepo.create(explainItem);
          await reviewRepo.saveSchedule(createInitialSchedule(explainItemId));
          totalRevisionItemsCreated++;

          importedCount++;
        }
      } catch (itemErr: any) {
        errors.push(`Error importing ${file.filePath}: ${itemErr.message}`);
      }
    }

    return {
      success: errors.length === 0 || importedCount > 0 || updatedCount > 0,
      repoName,
      importedCount,
      updatedCount,
      skippedCount,
      totalRevisionItemsCreated,
      topicsCreated,
      errors,
    };
  } catch (err: any) {
    return {
      success: false,
      repoName,
      importedCount,
      updatedCount,
      skippedCount,
      totalRevisionItemsCreated,
      topicsCreated,
      errors: [err.message || 'Unknown import error'],
    };
  }
}
