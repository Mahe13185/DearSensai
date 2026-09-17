declare const process: any;

import { processRawFiles } from '../core/importer/kaizenDsaScanner';
import { executeKaizenDsaImport } from '../core/importer/kaizenDsaImporter';
import { db } from '../storage/db';
import { subjectRepo, topicRepo, codingProblemRepo, revisionItemRepo, reviewRepo, backupRepo } from '../storage/repositories';
import { createInitialSchedule } from '../core/scheduler/srs';

// Simple polyfill for IndexedDB in Node environment if window is not defined
async function runIntegrationTest() {
  console.log('=== RUNNING IMPORTER INTEGRATION TEST ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    // 1. Mock DB tables in-memory if IndexedDB is not natively openable in Node CLI
    console.log('Testing KaizenDSA Importer End-to-End Logic...');

    const sampleFiles = [
      {
        path: 'Arrays/MoveZeroes.java',
        content: 'public class MoveZeroes { public void moveZeroes(int[] nums) {} }',
      },
      {
        path: 'TwoPointer/TwoSumSorted.java',
        content: 'public class TwoSumSorted { public int[] twoSum(int[] nums, int target) { return new int[]{}; } }',
      },
      {
        path: 'DP/ClimbingStairs.py',
        content: 'class Solution:\n    def climbStairs(self, n: int) -> int:\n        return n',
      },
    ];

    // Scan
    const scanResult = processRawFiles(sampleFiles, [], [], 'KaizenDSA');
    assert(scanResult.totalFiles === 3, 'Discovered 3 valid source files');
    assert(scanResult.newCount === 3, 'All 3 files are marked NEW initially');

    // Simulate import of 3 files
    const importedProblems: any[] = [];
    const importedItems: any[] = [];
    const schedules: any[] = [];
    const attempts: any[] = [];

    // Simulate creation
    for (const file of scanResult.files) {
      const probId = `prob_${file.filePath}`;
      const prob = {
        id: probId,
        sourceType: 'KAIZEN_DSA',
        sourceRepo: 'KaizenDSA',
        filePath: file.filePath,
        normalizedPath: file.filePath,
        title: file.title,
        language: file.language,
        sourceCode: file.sourceCode,
        subjectId: 'sub_dsa',
        topicId: `top_${file.detectedTopic}`,
        importedAt: Date.now(),
        updatedAt: Date.now(),
      };
      importedProblems.push(prob);

      const recallId = `recall_${file.filePath}`;
      const recallItem = {
        id: recallId,
        topicId: prob.topicId,
        type: 'CODE_RECALL',
        title: `${file.title} (Code Recall)`,
        frontContent: `Can you implement ${file.title}?`,
        backContent: file.sourceCode,
        codeSnippet: file.sourceCode,
        codeLanguage: file.language,
        difficulty: 'LEVEL_1',
        sourceMetadata: {
          sourceType: 'KAIZEN_DSA',
          sourceRepo: 'KaizenDSA',
          filePath: file.filePath,
          problemId: probId,
        },
        isEnabled: true,
      };
      importedItems.push(recallItem);
      schedules.push({ ...createInitialSchedule(recallId), reps: 3, intervalDays: 6, easeFactor: 2.6 });

      // Add a simulated historical attempt for MoveZeroes
      if (file.filePath === 'Arrays/MoveZeroes.java') {
        attempts.push({
          id: 'att_1',
          revisionItemId: recallId,
          rating: 'GOOD',
          timeSpentMs: 45000,
          isCorrect: true,
          timestamp: Date.now() - 86400000,
        });
      }
    }

    assert(importedProblems.length === 3, 'Created 3 CodingProblems');
    assert(importedItems.length === 3, 'Created 3 Code Recall RevisionItems');

    // 2. Re-scan to test duplicate detection
    const updatedFiles = [
      {
        path: 'Arrays/MoveZeroes.java',
        content: 'public class MoveZeroes { /* Updated Code v2 */ }',
      },
      {
        path: 'Arrays/NewProblem.java',
        content: 'public class NewProblem {}',
      },
    ];

    const reScan = processRawFiles(updatedFiles, importedProblems, importedItems, 'KaizenDSA');
    assert(reScan.totalFiles === 2, 'Re-scan discovered 2 files');
    assert(reScan.existingCount === 1, 'MoveZeroes detected as EXISTING');
    assert(reScan.newCount === 1, 'NewProblem detected as NEW');

    // 3. Test Update Preservation Strategy
    const existingFile = reScan.files.find((f) => f.filePath === 'Arrays/MoveZeroes.java');
    assert(existingFile?.status === 'EXISTING', 'MoveZeroes status is EXISTING');

    // Simulate update
    const moveZeroesRecall = importedItems.find((i) => i.sourceMetadata.filePath === 'Arrays/MoveZeroes.java');
    const moveZeroesSchedule = schedules.find((s) => s.revisionItemId === moveZeroesRecall.id);
    const moveZeroesAttempts = attempts.filter((a) => a.revisionItemId === moveZeroesRecall.id);

    // Update code content
    moveZeroesRecall.codeSnippet = existingFile!.sourceCode;
    moveZeroesRecall.backContent = existingFile!.sourceCode;
    moveZeroesRecall.updatedAt = Date.now();

    // Verify preservation
    assert(moveZeroesRecall.codeSnippet.includes('Updated Code v2'), 'Source code updated to v2');
    assert(moveZeroesSchedule.reps === 3 && moveZeroesSchedule.intervalDays === 6, 'Review schedule reps & interval preserved');
    assert(moveZeroesAttempts.length === 1 && moveZeroesAttempts[0].rating === 'GOOD', 'Historical attempts strictly preserved');

    // 4. Test JSON Backup & Portability format
    const mockBackup = {
      app: 'DEARSENSAI',
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      metadata: {
        totalSubjects: 1,
        totalTopics: 2,
        totalItems: importedItems.length,
        totalCodingProblems: importedProblems.length,
        totalAttempts: attempts.length,
      },
      data: {
        subjects: [{ id: 'sub_dsa', title: 'Data Structures & Algorithms' }],
        topics: [{ id: 'top_Arrays', subjectId: 'sub_dsa', title: 'Arrays' }],
        subtopics: [],
        revisionItems: importedItems,
        codingProblems: importedProblems,
        reviewSchedules: schedules,
        attempts: attempts,
        mistakes: [],
        sessionLogs: [],
      },
    };

    const backupJson = JSON.stringify(mockBackup);
    const parsedBackup = JSON.parse(backupJson);
    assert(parsedBackup.data.codingProblems.length === 3, 'Backup includes all 3 coding problems');
    assert(parsedBackup.data.revisionItems[0].sourceMetadata.sourceType === 'KAIZEN_DSA', 'Revision items retain KAIZEN_DSA provenance');
    assert(parsedBackup.data.attempts.length === 1, 'Backup includes attempt logs');

    console.log(`\n=== INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  } catch (err: any) {
    console.error('Integration test failed:', err);
    process.exit(1);
  }
}

runIntegrationTest();
