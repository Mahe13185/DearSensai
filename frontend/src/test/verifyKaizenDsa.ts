declare const process: any;

import {
  isIgnoredPath,
  detectLanguage,
  formatProblemTitle,
  detectTopicFromPath,
  extractDocExplanation,
  processRawFiles,
} from '../core/importer/kaizenDsaScanner';
import { CodingProblem, RevisionItem } from '../core/types';

function runTests() {
  console.log('=== RUNNING KAIZENDSA IMPORTER TESTS ===\n');
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

  // 1. Ignored directory filtering
  assert(isIgnoredPath('node_modules/pkg/index.js'), 'Ignores node_modules');
  assert(isIgnoredPath('.git/objects/abc'), 'Ignores .git');
  assert(isIgnoredPath('target/classes/Solution.class'), 'Ignores target build dir');
  assert(isIgnoredPath('build/libs/app.jar'), 'Ignores build dir');
  assert(isIgnoredPath('.idea/workspace.xml'), 'Ignores .idea');
  assert(!isIgnoredPath('Arrays/MoveZeroes.java'), 'Allows Arrays/MoveZeroes.java');
  assert(!isIgnoredPath('TwoPointer/TwoSumSorted.java'), 'Allows TwoPointer/TwoSumSorted.java');

  // 2. Language Detection
  assert(detectLanguage('MoveZeroes.java') === 'java', 'Detects Java');
  assert(detectLanguage('solution.py') === 'python', 'Detects Python');
  assert(detectLanguage('main.cpp') === 'cpp', 'Detects C++');
  assert(detectLanguage('helper.ts') === 'typescript', 'Detects TypeScript');
  assert(detectLanguage('script.js') === 'javascript', 'Detects JavaScript');

  // 3. Problem Title Formatting
  assert(formatProblemTitle('MoveZeroes.java') === 'Move Zeroes', 'Formats PascalCase MoveZeroes');
  assert(formatProblemTitle('001_two_sum.py') === 'Two Sum', 'Formats snake_case with leading numbers');
  assert(formatProblemTitle('p123-binary-search.cpp') === 'Binary Search', 'Formats kebab-case with problem prefix');
  assert(formatProblemTitle('SearchRotatedArray.cpp') === 'Search Rotated Array', 'Formats SearchRotatedArray');

  // 4. Topic Detection
  assert(detectTopicFromPath('Arrays/MoveZeroes.java') === 'Arrays', 'Detects Arrays topic');
  assert(detectTopicFromPath('TwoPointer/TwoSum.java') === 'Two Pointer & Sliding Window', 'Detects Two Pointer topic');
  assert(detectTopicFromPath('BinarySearch/SearchRotated.cpp') === 'Binary Search & Monotonic Space', 'Detects Binary Search topic');
  assert(detectTopicFromPath('Trees/BinaryTreeMaxPath.java') === 'Binary Trees & Traversals', 'Detects Trees topic');
  assert(detectTopicFromPath('DP/ClimbingStairs.py') === 'Dynamic Programming', 'Detects DP topic');
  assert(detectTopicFromPath('Graphs/CourseSchedule.java') === 'Graphs', 'Detects Graphs topic');
  assert(detectTopicFromPath('LinkedList/ReverseList.java') === 'Linked Lists', 'Detects Linked Lists topic');
  assert(detectTopicFromPath('RandomFile.java') === 'Uncategorized', 'Root file becomes Uncategorized');

  // 5. Doc Explanation Extraction
  const javaWithDoc = `/**
 * Problem: Move Zeroes
 * In-place two-pointer technique.
 */
class Solution {}`;
  assert(extractDocExplanation(javaWithDoc)?.includes('In-place two-pointer technique.') === true, 'Extracts Java docstring');

  // 6. Scanner & Duplicate Detection Test
  const mockRawFiles = [
    { path: 'Arrays/MoveZeroes.java', content: 'class MoveZeroes {}' },
    { path: 'TwoPointer/TwoSum.java', content: 'class TwoSum {}' },
    { path: 'node_modules/lib/test.js', content: 'ignore me' },
    { path: 'DP/ClimbingStairs.py', content: 'class Solution: pass' },
  ];

  const existingProb: CodingProblem = {
    id: 'prob_1',
    sourceType: 'KAIZEN_DSA',
    sourceRepo: 'KaizenDSA',
    filePath: 'Arrays/MoveZeroes.java',
    normalizedPath: 'Arrays/MoveZeroes.java',
    title: 'Move Zeroes',
    language: 'java',
    sourceCode: 'class MoveZeroesOld {}',
    subjectId: 'sub_dsa',
    topicId: 'top_dsa_1',
    importedAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000,
  };

  const existingRecall: RevisionItem = {
    id: 'item_recall_1',
    topicId: 'top_dsa_1',
    type: 'CODE_RECALL',
    title: 'Move Zeroes (Code Recall)',
    frontContent: 'Can you implement Move Zeroes?',
    backContent: 'class MoveZeroesOld {}',
    codeSnippet: 'class MoveZeroesOld {}',
    codeLanguage: 'java',
    sourceMetadata: {
      sourceType: 'KAIZEN_DSA',
      filePath: 'Arrays/MoveZeroes.java',
    },
    isEnabled: true,
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000,
  };

  const summary = processRawFiles(mockRawFiles, [existingProb], [existingRecall]);

  assert(summary.totalFiles === 3, 'Found 3 valid files (ignored node_modules)');
  assert(summary.newCount === 2, 'Found 2 new files (TwoSum, ClimbingStairs)');
  assert(summary.existingCount === 1, 'Detected 1 existing file (MoveZeroes)');
  assert(summary.languageBreakdown['JAVA'] === 2, 'Language breakdown: 2 Java');
  assert(summary.languageBreakdown['PYTHON'] === 1, 'Language breakdown: 1 Python');

  const moveZeroesFile = summary.files.find((f) => f.filePath === 'Arrays/MoveZeroes.java');
  assert(moveZeroesFile?.status === 'EXISTING', 'MoveZeroes flagged as EXISTING');
  assert(moveZeroesFile?.existingProblem?.id === 'prob_1', 'Matched existing CodingProblem record');

  console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
}

runTests();
