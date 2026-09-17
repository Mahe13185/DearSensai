import React, { useState, useRef } from 'react';
import { FolderCode, X, Check, FileCode, CheckSquare, Square, RefreshCw, Layers, ArrowRight, FolderPlus, AlertTriangle } from 'lucide-react';
import { ScannedFile, ScanSummary, processRawFiles } from '../../core/importer/kaizenDsaScanner';
import { executeKaizenDsaImport, ImportResult } from '../../core/importer/kaizenDsaImporter';
import { codingProblemRepo, revisionItemRepo } from '../../storage/repositories';

interface KaizenDsaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

// Built-in sample KaizenDSA repository fixture for instant offline testing & verification
const SAMPLE_KAIZENDSA_FIXTURE: Array<{ path: string; content: string }> = [
  {
    path: 'Arrays/MoveZeroes.java',
    content: `/**
 * Problem: Move Zeroes
 * Given an integer array nums, move all 0's to the end of it while maintaining the relative order of the non-zero elements.
 * Must be done in-place without making a copy of the array.
 */
class MoveZeroes {
    public void moveZeroes(int[] nums) {
        int insertPos = 0;
        for (int i = 0; i < nums.length; i++) {
            if (nums[i] != 0) {
                nums[insertPos++] = nums[i];
            }
        }
        while (insertPos < nums.length) {
            nums[insertPos++] = 0;
        }
    }
}`,
  },
  {
    path: 'TwoPointer/TwoSumSorted.java',
    content: `/**
 * Problem: Two Sum II - Input Array Is Sorted
 * Find two numbers such that they add up to a specific target number using two pointers.
 */
class TwoSumSorted {
    public int[] twoSum(int[] numbers, int target) {
        int left = 0, right = numbers.length - 1;
        while (left < right) {
            int sum = numbers[left] + numbers[right];
            if (sum == target) {
                return new int[]{left + 1, right + 1};
            } else if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
        return new int[]{-1, -1};
    }
}`,
  },
  {
    path: 'BinarySearch/SearchRotatedArray.cpp',
    content: `/**
 * Problem: Search in Rotated Sorted Array
 * Binary search with monotonic space boundary check. Time complexity O(log n).
 */
#include <vector>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        int left = 0, right = nums.size() - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            
            if (nums[left] <= nums[mid]) {
                if (nums[left] <= target && target < nums[mid])
                    right = mid - 1;
                else
                    left = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[right])
                    left = mid + 1;
                else
                    right = mid - 1;
            }
        }
        return -1;
    }
};`,
  },
  {
    path: 'DP/ClimbingStairs.py',
    content: `"""
Problem: Climbing Stairs
You are climbing a staircase. It takes n steps to reach the top.
Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?
"""
class Solution:
    def climbStairs(self, n: int) -> int:
        if n <= 2:
            return n
        prev2, prev1 = 1, 2
        for _ in range(3, n + 1):
            curr = prev1 + prev2
            prev2 = prev1
            prev1 = curr
        return prev1
`,
  },
  {
    path: 'Uncategorized/QuickSortHelper.ts',
    content: `/**
 * QuickSort partition and recursive in-place sorting utility.
 */
export function quickSort(arr: number[], low = 0, high = arr.length - 1): number[] {
  if (low < high) {
    const pivot = arr[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      if (arr[j] <= pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    const pi = i + 1;
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
  return arr;
}`,
  },
];

export const KaizenDsaImportModal: React.FC<KaizenDsaImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [step, setStep] = useState<'SELECT' | 'PREVIEW' | 'IMPORTING' | 'SUMMARY'>('SELECT');
  const [repoName, setRepoName] = useState<string>('KaizenDSA');
  const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [existingAction, setExistingAction] = useState<'SKIP' | 'UPDATE'>('UPDATE');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep('SELECT');
    setScanSummary(null);
    setSelectedFileIds(new Set());
    setImportResult(null);
    setStatusMessage('');
  };

  const handleCloseModal = () => {
    handleReset();
    onClose();
  };

  // 1. Process files list into ScanSummary
  const handleProcessRawFiles = async (rawFiles: Array<{ path: string; content: string }>, customRepoName: string) => {
    setStatusMessage('Scanning files and matching database topics...');
    const [existingProblems, existingItems] = await Promise.all([
      codingProblemRepo.getAll(),
      revisionItemRepo.getAll(),
    ]);

    const summary = processRawFiles(rawFiles, existingProblems, existingItems, customRepoName);
    setScanSummary(summary);
    setRepoName(customRepoName);

    // Default: select all files
    const allIds = new Set(summary.files.map((f) => f.id));
    setSelectedFileIds(allIds);
    setStep('PREVIEW');
  };

  // 2. Folder upload via HTML input
  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setStatusMessage(`Reading ${fileList.length} files from selected directory...`);
    const rawFiles: Array<{ path: string; content: string }> = [];

    let detectedRepo = 'KaizenDSA';
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relPath = file.webkitRelativePath || file.name;
      if (i === 0 && file.webkitRelativePath) {
        const parts = file.webkitRelativePath.split('/');
        if (parts.length > 1 && parts[0]) {
          detectedRepo = parts[0];
        }
      }

      try {
        const content = await file.text();
        rawFiles.push({ path: relPath, content });
      } catch (err) {
        console.warn(`Could not read file ${relPath}:`, err);
      }
    }

    await handleProcessRawFiles(rawFiles, detectedRepo);
  };

  // 3. Folder selection via native File System Access API (window.showDirectoryPicker)
  const handleDirectoryPicker = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        setStatusMessage(`Reading folder ${dirHandle.name}...`);
        const rawFiles: Array<{ path: string; content: string }> = [];

        async function readDir(handle: any, currentPath: string) {
          for await (const entry of handle.values()) {
            const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
            if (entry.kind === 'file') {
              const file = await entry.getFile();
              const content = await file.text();
              rawFiles.push({ path: entryPath, content });
            } else if (entry.kind === 'directory') {
              // Ignore standard non-source dirs immediately
              const lower = entry.name.toLowerCase();
              if (
                lower === 'node_modules' ||
                lower === '.git' ||
                lower === 'build' ||
                lower === 'target' ||
                lower === 'dist' ||
                lower === '.idea' ||
                lower === '.vscode'
              ) {
                continue;
              }
              await readDir(entry, entryPath);
            }
          }
        }

        await readDir(dirHandle, '');
        await handleProcessRawFiles(rawFiles, dirHandle.name || 'KaizenDSA');
      } else {
        // Fallback to file input
        fileInputRef.current?.click();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Directory picker error:', err);
        // Fallback to standard input
        fileInputRef.current?.click();
      }
    }
  };

  // 4. Load Sample Fixture
  const handleLoadSampleFixture = async () => {
    await handleProcessRawFiles(SAMPLE_KAIZENDSA_FIXTURE, 'KaizenDSA');
  };

  // Toggle selection
  const handleToggleFile = (fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!scanSummary) return;
    setSelectedFileIds(new Set(scanSummary.files.map((f) => f.id)));
  };

  const handleDeselectAll = () => {
    setSelectedFileIds(new Set());
  };

  const handleSelectOnlyNew = () => {
    if (!scanSummary) return;
    const newOnly = scanSummary.files.filter((f) => f.status === 'NEW').map((f) => f.id);
    setSelectedFileIds(new Set(newOnly));
  };

  // Execute Import
  const handleExecuteImport = async () => {
    if (!scanSummary) return;
    setStep('IMPORTING');
    setStatusMessage('Creating DSA topics, code records, and Code Recall items...');

    const filesToImport = scanSummary.files.filter((f) => selectedFileIds.has(f.id));
    const result = await executeKaizenDsaImport(filesToImport, {
      repoName,
      existingAction,
    });

    setImportResult(result);
    setStep('SUMMARY');
    onImportComplete();
  };

  // Group files by topic for clean tree preview
  const filesByTopic = (scanSummary?.files || []).reduce<Record<string, ScannedFile[]>>((acc, file) => {
    if (selectedLanguageFilter !== 'ALL' && file.language.toUpperCase() !== selectedLanguageFilter) {
      return acc;
    }
    const topic = file.detectedTopic;
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(file);
    return acc;
  }, {});

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-overlay)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Hidden webkitdirectory input */}
      <input
        ref={fileInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        style={{ display: 'none' }}
        onChange={handleFolderInputChange}
      />

      <div
        className="animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-elevated)',
          overflow: 'hidden',
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderCode size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                KaizenDSA Repository Importer
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Import local coding solutions into DSA topics and Code Recall cards
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: 'var(--radius-sm)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* STEP 1: SELECT REPOSITORY */}
          {step === 'SELECT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '16px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Select Local DSA Repository
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Choose your local <strong>KaizenDSA</strong> directory on your machine. DEARSENSAI will automatically scan for <code>.java</code>, <code>.py</code>, <code>.cpp</code>, <code>.js</code>, and <code>.ts</code> files, discover topic categories from folder names, and build Code Recall practice items completely offline.
                </p>
              </div>

              {/* Action Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {/* 1. Choose Local Directory */}
                <button
                  type="button"
                  onClick={handleDirectoryPicker}
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-surface)',
                    border: '2px dashed var(--accent-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <FolderPlus size={32} color="var(--accent-primary)" />
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block' }}>
                      Choose Local Folder
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Select KaizenDSA repo directory
                    </span>
                  </div>
                </button>

                {/* 2. Load Built-in Test Sample */}
                <button
                  type="button"
                  onClick={handleLoadSampleFixture}
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <FileCode size={32} color="#F59E0B" />
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block' }}>
                      Load Sample KaizenDSA Fixture
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Test with 5 sample DSA solutions
                    </span>
                  </div>
                </button>
              </div>

              {statusMessage && (
                <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {statusMessage}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PREVIEW & SELECTION */}
          {step === 'PREVIEW' && scanSummary && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Summary Stats Header */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '14px 18px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {scanSummary.repoName} — Found {scanSummary.totalFiles} Source Files
                  </h4>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '12px' }}>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>● {scanSummary.newCount} New</span>
                    <span style={{ color: '#F59E0B', fontWeight: 600 }}>● {scanSummary.existingCount} Existing</span>
                    <span style={{ color: 'var(--text-secondary)' }}>● {selectedFileIds.size} Selected for Import</span>
                  </div>
                </div>

                {/* Language Pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {Object.entries(scanSummary.languageBreakdown).map(([lang, count]) => (
                    <span
                      key={lang}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: 'var(--accent-primary)',
                        fontWeight: 700,
                      }}
                    >
                      {lang}: {count}
                    </span>
                  ))}
                </div>
              </div>

              {/* Selection Bar & Existing Action Picker */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    style={{ fontSize: '12px', padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontWeight: 600 }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    style={{ fontSize: '12px', padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}
                  >
                    Deselect All
                  </button>
                  {scanSummary.existingCount > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectOnlyNew}
                      style={{ fontSize: '12px', padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--accent-primary)', fontWeight: 600 }}
                    >
                      Only New ({scanSummary.newCount})
                    </button>
                  )}
                </div>

                {/* Duplicate Policy Picker */}
                {scanSummary.existingCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>If already exists:</span>
                    <select
                      value={existingAction}
                      onChange={(e) => setExistingAction(e.target.value as 'SKIP' | 'UPDATE')}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    >
                      <option value="UPDATE">Update Code (Preserve Attempts)</option>
                      <option value="SKIP">Skip Existing Files</option>
                    </select>
                  </div>
                )}
              </div>

              {/* TREE PREVIEW BY TOPIC */}
              <div
                style={{
                  maxHeight: '340px',
                  overflowY: 'auto',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} color="var(--accent-primary)" />
                  <span>Subject: Data Structures & Algorithms</span>
                </div>

                {Object.entries(filesByTopic).map(([topicTitle, topicFiles]) => (
                  <div key={topicTitle} style={{ marginLeft: '12px', borderLeft: '2px solid var(--border-subtle)', paddingLeft: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Topic: {topicTitle} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>({topicFiles.length})</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {topicFiles.map((file) => {
                        const isSelected = selectedFileIds.has(file.id);
                        return (
                          <div
                            key={file.id}
                            onClick={() => handleToggleFile(file.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-sm)',
                              background: isSelected ? 'var(--bg-card)' : 'transparent',
                              border: isSelected ? '1px solid var(--border-medium)' : '1px solid transparent',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {isSelected ? (
                                <CheckSquare size={16} color="var(--accent-primary)" />
                              ) : (
                                <Square size={16} color="var(--text-muted)" />
                              )}
                              <span style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 400, color: 'var(--text-primary)' }}>
                                {file.fileName}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                ({file.filePath})
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  textTransform: 'uppercase',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#FBBF24',
                                }}
                              >
                                {file.language}
                              </span>

                              {file.status === 'NEW' ? (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#34D399',
                                  }}
                                >
                                  NEW
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: 'rgba(99, 102, 241, 0.15)',
                                    color: 'var(--accent-primary)',
                                  }}
                                >
                                  EXISTING
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: IMPORTING STATE */}
          {step === 'IMPORTING' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: '16px' }}>
              <RefreshCw size={36} color="var(--accent-primary)" className="animate-spin" />
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Importing KaizenDSA Code Records...
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                {statusMessage}
              </p>
            </div>
          )}

          {/* STEP 4: SUCCESS SUMMARY */}
          {step === 'SUMMARY' && importResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                  <Check size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#34D399' }}>
                    KaizenDSA Import Completed Successfully!
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Your coding problems and practice items are now integrated into DEARSENSAI.
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#34D399', display: 'block' }}>
                    {importResult.importedCount}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>New Problems</span>
                </div>

                <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#F59E0B', display: 'block' }}>
                    {importResult.updatedCount}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Updated</span>
                </div>

                <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-primary)', display: 'block' }}>
                    {importResult.totalRevisionItemsCreated}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Revision Items</span>
                </div>
              </div>

              {importResult.topicsCreated.length > 0 && (
                <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '12px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>New Topics Generated:</strong>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>{importResult.topicsCreated.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
          }}
        >
          {step === 'SELECT' && (
            <button
              type="button"
              onClick={handleCloseModal}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '13px' }}
            >
              Cancel
            </button>
          )}

          {step === 'PREVIEW' && (
            <>
              <button
                type="button"
                onClick={() => setStep('SELECT')}
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '13px' }}
              >
                Back
              </button>

              <button
                type="button"
                disabled={selectedFileIds.size === 0}
                onClick={handleExecuteImport}
                style={{
                  padding: '8px 22px',
                  borderRadius: 'var(--radius-sm)',
                  background: selectedFileIds.size > 0 ? 'var(--accent-primary)' : 'var(--bg-surface)',
                  color: selectedFileIds.size > 0 ? '#FFF' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: selectedFileIds.size > 0 ? '0 2px 8px var(--accent-glow)' : 'none',
                  cursor: selectedFileIds.size > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                <span>Import Selected ({selectedFileIds.size})</span>
                <ArrowRight size={15} />
              </button>
            </>
          )}

          {step === 'SUMMARY' && (
            <button
              type="button"
              onClick={handleCloseModal}
              style={{
                padding: '8px 24px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-primary)',
                color: '#FFF',
                fontWeight: 600,
                fontSize: '13px',
                boxShadow: '0 2px 8px var(--accent-glow)',
              }}
            >
              View in Library
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
