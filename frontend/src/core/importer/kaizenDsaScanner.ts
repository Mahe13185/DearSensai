import { CodingProblem, RevisionItem } from '../types';

export interface ScannedFile {
  id: string;
  fileName: string;
  filePath: string; // normalized relative path e.g. "Arrays/MoveZeroes.java"
  title: string; // "Move Zeroes"
  language: 'java' | 'python' | 'cpp' | 'javascript' | 'typescript' | 'other';
  detectedTopic: string; // "Arrays", "Two Pointer", "Uncategorized", etc.
  sourceCode: string;
  docExplanation?: string;
  status: 'NEW' | 'EXISTING';
  existingProblem?: CodingProblem;
  existingRecallItem?: RevisionItem;
  existingExplainItem?: RevisionItem;
}

export interface ScanSummary {
  repoName: string;
  totalFiles: number;
  languageBreakdown: Record<string, number>;
  topicBreakdown: Record<string, number>;
  newCount: number;
  existingCount: number;
  files: ScannedFile[];
}

const SUPPORTED_EXTENSIONS = new Set(['java', 'py', 'cpp', 'cc', 'cxx', 'c', 'js', 'ts']);

const IGNORED_PATH_SEGMENTS = new Set([
  'node_modules',
  '.git',
  '.github',
  'build',
  'target',
  'dist',
  'bin',
  '.idea',
  '.vscode',
  '.next',
  'out',
  '__pycache__',
  '.gradle',
  '.settings',
  '.ds_store',
  'coverage',
]);

/**
 * Check if a file should be ignored based on its relative path
 */
export function isIgnoredPath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/').toLowerCase();
  const segments = normalized.split('/');
  return segments.some((segment) => IGNORED_PATH_SEGMENTS.has(segment));
}

/**
 * Extract language identifier from filename
 */
export function detectLanguage(fileName: string): 'java' | 'python' | 'cpp' | 'javascript' | 'typescript' | 'other' {
  const parts = fileName.split('.');
  const ext = (parts[parts.length - 1] || '').toLowerCase();
  switch (ext) {
    case 'java':
      return 'java';
    case 'py':
      return 'python';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'c':
      return 'cpp';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    default:
      return 'other';
  }
}

/**
 * Clean up filename/path into a human-readable problem title
 * e.g. "001_TwoSum.java" -> "Two Sum"
 * "move_zeroes.py" -> "Move Zeroes"
 * "BinaryTreeMaxPathSum.cpp" -> "Binary Tree Max Path Sum"
 */
export function formatProblemTitle(fileName: string): string {
  // Strip extension
  let base = fileName.replace(/\.[^/.]+$/, '');

  // Strip leading numbers like "001_", "1-", "p123_"
  base = base.replace(/^[pP]?\d+[-_.]?/, '');

  // If underscore or hyphen separated: e.g. "two_sum" or "two-sum"
  if (base.includes('_') || base.includes('-')) {
    return base
      .split(/[-_]+/)
      .filter((w) => w.length > 0)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // If PascalCase or camelCase: e.g. "TwoSum" -> "Two Sum"
  const spaced = base.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  return spaced.trim() || base;
}

/**
 * Deterministic topic detection based on folder name
 */
export function detectTopicFromPath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);

  // If file is at repo root with no enclosing folder
  if (parts.length <= 1) {
    return 'Uncategorized';
  }

  // Get the enclosing directory
  const folderName = parts[0].trim();
  const folderLower = folderName.toLowerCase().replace(/[-_]/g, '');

  if (/array|matrix|matrices/.test(folderLower)) {
    return 'Arrays';
  }
  if (/twopointer|slidingwindow|2pointer/.test(folderLower)) {
    return 'Two Pointer & Sliding Window';
  }
  if (/binarysearch|bisect|searchspace/.test(folderLower)) {
    return 'Binary Search & Monotonic Space';
  }
  if (/tree|bst|binarytree|trie/.test(folderLower)) {
    return 'Binary Trees & Traversals';
  }
  if (/graph|bfs|dfs|topological|unionfind|dijkstra/.test(folderLower)) {
    return 'Graphs';
  }
  if (/dp|dynamicprogramming|memoization|tabulation/.test(folderLower)) {
    return 'Dynamic Programming';
  }
  if (/linkedlist|listnode|singlylinked/.test(folderLower)) {
    return 'Linked Lists';
  }
  if (/stack|queue|heap|priorityqueue|deque/.test(folderLower)) {
    return 'Stacks & Queues';
  }
  if (/recursion|backtracking|permutation|combination/.test(folderLower)) {
    return 'Recursion & Backtracking';
  }
  if (/string|palindrome|anagram/.test(folderLower)) {
    return 'Strings';
  }
  if (/greedy|intervals/.test(folderLower)) {
    return 'Greedy Algorithms';
  }
  if (/bit|bitwise|math/.test(folderLower)) {
    return 'Bit Manipulation & Math';
  }

  // If folder has a clear name (e.g. "Sorting", "HashMaps"), format as title
  if (folderName.length > 2 && !/^(src|main|test|code|solutions|dsa|problems)$/i.test(folderName)) {
    return formatProblemTitle(folderName);
  }

  return 'Uncategorized';
}

/**
 * Extract leading comments from source code for Code Explanation without hallucinating
 */
export function extractDocExplanation(code: string): string | undefined {
  const trimmed = code.trim();
  
  // Java/C++/JS multi-line comment /** ... */
  if (trimmed.startsWith('/*')) {
    const endIdx = trimmed.indexOf('*/');
    if (endIdx !== -1) {
      const comment = trimmed.substring(2, endIdx)
        .split('\n')
        .map((line) => line.replace(/^\s*\*\s?/, '').trim())
        .filter(Boolean)
        .join('\n');
      if (comment.length > 10) return comment;
    }
  }

  // Python docstring """ ... """ or ''' ... '''
  if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
    const quote = trimmed.substring(0, 3);
    const endIdx = trimmed.indexOf(quote, 3);
    if (endIdx !== -1) {
      const doc = trimmed.substring(3, endIdx).trim();
      if (doc.length > 10) return doc;
    }
  }

  return undefined;
}

/**
 * Scan a list of raw files with content, compare against existing records in Dexie, and generate a ScanSummary.
 */
export function processRawFiles(
  rawFiles: Array<{ path: string; content: string }>,
  existingProblems: CodingProblem[],
  existingItems: RevisionItem[],
  repoName: string = 'KaizenDSA'
): ScanSummary {
  const existingProblemMap = new Map<string, CodingProblem>();
  existingProblems.forEach((p) => {
    existingProblemMap.set(p.normalizedPath, p);
    existingProblemMap.set(p.filePath, p);
  });

  const existingRecallMap = new Map<string, RevisionItem>();
  const existingExplainMap = new Map<string, RevisionItem>();
  existingItems.forEach((i) => {
    if (i.sourceMetadata?.filePath) {
      if (i.type === 'CODE_RECALL') existingRecallMap.set(i.sourceMetadata.filePath, i);
      if (i.type === 'CODE_EXPLANATION') existingExplainMap.set(i.sourceMetadata.filePath, i);
    }
  });

  const languageBreakdown: Record<string, number> = {};
  const topicBreakdown: Record<string, number> = {};
  const files: ScannedFile[] = [];
  let newCount = 0;
  let existingCount = 0;

  for (const raw of rawFiles) {
    const normalizedPath = raw.path.replace(/\\/g, '/').replace(/^\/+/, '');
    
    // Check ignored paths
    if (isIgnoredPath(normalizedPath)) {
      continue;
    }

    const pathParts = normalizedPath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const ext = (fileName.split('.').pop() || '').toLowerCase();

    // Check supported extension
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      continue;
    }

    // Skip empty files
    if (!raw.content || !raw.content.trim()) {
      continue;
    }

    const language = detectLanguage(fileName);
    const title = formatProblemTitle(fileName);
    const detectedTopic = detectTopicFromPath(normalizedPath);
    const docExplanation = extractDocExplanation(raw.content);

    const existingProb = existingProblemMap.get(normalizedPath);
    const isExisting = !!existingProb || existingRecallMap.has(normalizedPath);

    if (isExisting) {
      existingCount++;
    } else {
      newCount++;
    }

    // Stats
    const langDisplay = language.toUpperCase();
    languageBreakdown[langDisplay] = (languageBreakdown[langDisplay] || 0) + 1;
    topicBreakdown[detectedTopic] = (topicBreakdown[detectedTopic] || 0) + 1;

    files.push({
      id: `scan_${normalizedPath.replace(/[^a-zA-Z0-9]/g, '_')}`,
      fileName,
      filePath: normalizedPath,
      title,
      language,
      detectedTopic,
      sourceCode: raw.content,
      docExplanation,
      status: isExisting ? 'EXISTING' : 'NEW',
      existingProblem: existingProb,
      existingRecallItem: existingRecallMap.get(normalizedPath),
      existingExplainItem: existingExplainMap.get(normalizedPath),
    });
  }

  // Sort files by topic then by title
  files.sort((a, b) => {
    if (a.detectedTopic !== b.detectedTopic) {
      return a.detectedTopic.localeCompare(b.detectedTopic);
    }
    return a.title.localeCompare(b.title);
  });

  return {
    repoName,
    totalFiles: files.length,
    languageBreakdown,
    topicBreakdown,
    newCount,
    existingCount,
    files,
  };
}
