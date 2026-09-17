import React, { useState, useRef } from 'react';
import { Video, X, Check, FileText, CheckSquare, Square, RefreshCw, ArrowRight, FolderPlus, Film, PlayCircle, BookOpen } from 'lucide-react';
import { MoshScanSummary, ScannedMoshVideo, ScannedMoshResource, processRawMoshFiles } from '../../core/importer/moshCourseScanner';
import { executeMoshCourseImport, MoshImportResult } from '../../core/importer/moshCourseImporter';
import { moshRepo } from '../../storage/repositories';

interface MoshCourseImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

// Built-in Sample Fixtures for Course 1 & Course 2
const SAMPLE_COURSE_1_FIXTURE: Array<{ path: string; size: number }> = [
  // 0. Resources (Exercise PDFs)
  { path: 'Spring Boot Course/0. Resources/1. Questions and Support.pdf', size: 120400 },
  { path: 'Spring Boot Course/0. Resources/2. Connect with Me.pdf', size: 95000 },
  { path: 'Spring Boot Course/0. Resources/3. Exercise - Building a Store Controller.pdf', size: 340200 },
  { path: 'Spring Boot Course/0. Resources/4. Exercise - Dependency Injection with Beans.pdf', size: 410000 },
  { path: 'Spring Boot Course/0. Resources/5. Exercise - JPA Entities & Repositories.pdf', size: 520000 },

  // 1. Introduction
  { path: 'Spring Boot Course/1. Introduction/01. Welcome.mp4', size: 15400000 },
  { path: 'Spring Boot Course/1. Introduction/02. What is Spring Boot.mp4', size: 38200000 },
  { path: 'Spring Boot Course/1. Introduction/03. Prerequisites.mp4', size: 12100000 },

  // 2. Getting Started with Spring Boot
  { path: 'Spring Boot Course/2. Getting Started with Spring Boot/01. Setting Up the Environment.mp4', size: 45000000 },
  { path: 'Spring Boot Course/2. Getting Started with Spring Boot/02. Creating Our First Project.mp4', size: 68000000 },
  { path: 'Spring Boot Course/2. Getting Started with Spring Boot/03. Project Structure and Maven.mp4', size: 54000000 },

  // 3. Dependency Injection
  { path: 'Spring Boot Course/3. Dependency Injection/01. What is Inversion of Control.mp4', size: 42000000 },
  { path: 'Spring Boot Course/3. Dependency Injection/02. Autowiring and Component Scan.mp4', size: 71000000 },
  { path: 'Spring Boot Course/3. Dependency Injection/03. Constructor Injection vs Field Injection.mp4', size: 60000000 },

  // 4. Database Integration with JPA
  { path: 'Spring Boot Course/4. Database Integration with JPA/01. Introducing Spring Data JPA.mp4', size: 49000000 },
  { path: 'Spring Boot Course/4. Database Integration with JPA/02. Defining JPA Entities and Relationships.mp4', size: 85000000 },
  { path: 'Spring Boot Course/4. Database Integration with JPA/03. Writing Derived Queries in Repositories.mp4', size: 77000000 },

  // 5. Course Wrap Up
  { path: 'Spring Boot Course/5. Course Wrap Up/01. Summary & Next Steps.mp4', size: 18000000 },
];

const SAMPLE_COURSE_2_FIXTURE: Array<{ path: string; size: number }> = [
  // Resources
  { path: 'Spring Boot REST & Security/0. Resources/1. API Specification Guidelines.pdf', size: 230000 },
  { path: 'Spring Boot REST & Security/0. Resources/2. Exercise - JWT Token Verification.pdf', size: 480000 },

  // Getting Started
  { path: 'Spring Boot REST & Security/Getting Started/01. Course Overview.mp4', size: 21000000 },
  { path: 'Spring Boot REST & Security/Introduction to Spring MVC/01. Architecture of Spring MVC.mp4', size: 55000000 },
  { path: 'Spring Boot REST & Security/Building RESTful APIs/01. Creating Resource Endpoints.mp4', size: 68000000 },
  { path: 'Spring Boot REST & Security/Building RESTful APIs/02. Handling DTOs and ModelMapper.mp4', size: 74000000 },
  { path: 'Spring Boot REST & Security/Validating API Requests/01. Bean Validation with Hibernate Validator.mp4', size: 61000000 },
  { path: 'Spring Boot REST & Security/Capstone Project: Building the Shopping Cart API/01. Cart Domain Logic.mp4', size: 92000000 },
  { path: 'Spring Boot REST & Security/Securing APIs with Spring Security/01. Security Filter Chain Configuration.mp4', size: 88000000 },
  { path: 'Spring Boot REST & Security/Securing APIs with Spring Security/02. JWT Authentication and Authorization.mp4', size: 96000000 },
  { path: 'Spring Boot REST & Security/Capstone Project: Building the Checkout and Order APIs/01. Order Processing Flow.mp4', size: 104000000 },
  { path: 'Spring Boot REST & Security/Payment Processing/01. Stripe Payment Gateway Integration.mp4', size: 82000000 },
  { path: 'Spring Boot REST & Security/Deployment/01. Dockerizing Spring Boot & Production Deploy.mp4', size: 79000000 },
  { path: 'Spring Boot REST & Security/Course Wrap Up/01. Congratulations & Farewell.mp4', size: 14000000 },
];

export const MoshCourseImportModal: React.FC<MoshCourseImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [step, setStep] = useState<'SELECT' | 'PREVIEW' | 'IMPORTING' | 'SUMMARY'>('SELECT');
  const [courseName, setCourseName] = useState<string>('Spring Boot Course');
  const [scanSummary, setScanSummary] = useState<MoshScanSummary | null>(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [selectedResourceIds, setSelectedResourceIds] = useState<Set<string>>(new Set());
  const [existingAction, setExistingAction] = useState<'SKIP' | 'UPDATE'>('UPDATE');
  const [importResult, setImportResult] = useState<MoshImportResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep('SELECT');
    setScanSummary(null);
    setSelectedVideoIds(new Set());
    setSelectedResourceIds(new Set());
    setImportResult(null);
    setStatusMessage('');
  };

  const handleCloseModal = () => {
    handleReset();
    onClose();
  };

  // 1. Process files list into ScanSummary
  const handleProcessRawFiles = async (
    rawFiles: Array<{ path: string; size?: number }>,
    customCourseName: string
  ) => {
    setStatusMessage('Scanning course hierarchy, video lessons, and exercise PDFs...');
    const [existingVideos, existingResources] = await Promise.all([
      moshRepo.getVideosByCourseName(customCourseName),
      moshRepo.getResourcesByCourseName(customCourseName),
    ]);

    const summary = processRawMoshFiles(rawFiles, existingVideos, existingResources, customCourseName);
    setScanSummary(summary);
    setCourseName(summary.courseName);

    // Default: select all discovered videos and resources
    setSelectedVideoIds(new Set(summary.allVideos.map((v) => v.id)));
    setSelectedResourceIds(new Set(summary.allResources.map((r) => r.id)));
    setStep('PREVIEW');
  };

  // 2. Folder upload via HTML input
  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setStatusMessage(`Scanning ${fileList.length} files from selected folder...`);
    const rawFiles: Array<{ path: string; size?: number }> = [];

    let detectedCourse = 'Spring Boot Course';
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relPath = file.webkitRelativePath || file.name;
      if (i === 0 && file.webkitRelativePath) {
        const parts = file.webkitRelativePath.split('/');
        if (parts.length > 1 && parts[0]) {
          detectedCourse = parts[0];
        }
      }
      rawFiles.push({ path: relPath, size: file.size });
    }

    await handleProcessRawFiles(rawFiles, detectedCourse);
  };

  // 3. Folder selection via native File System Access API
  const handleDirectoryPicker = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        setStatusMessage(`Scanning folder ${dirHandle.name}...`);
        const rawFiles: Array<{ path: string; size?: number }> = [];

        async function readDir(handle: any, currentPath: string) {
          for await (const entry of handle.values()) {
            const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
            if (entry.kind === 'file') {
              const file = await entry.getFile();
              rawFiles.push({ path: entryPath, size: file.size });
            } else if (entry.kind === 'directory') {
              if (entry.name === '.git' || entry.name === 'node_modules') continue;
              await readDir(entry, entryPath);
            }
          }
        }

        await readDir(dirHandle, '');
        await handleProcessRawFiles(rawFiles, dirHandle.name || 'Spring Boot Course');
      } else {
        fileInputRef.current?.click();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Directory picker error:', err);
        fileInputRef.current?.click();
      }
    }
  };

  // 4. Toggle selections
  const handleToggleVideo = (id: string) => {
    setSelectedVideoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleResource = (id: string) => {
    setSelectedResourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!scanSummary) return;
    setSelectedVideoIds(new Set(scanSummary.allVideos.map((v) => v.id)));
    setSelectedResourceIds(new Set(scanSummary.allResources.map((r) => r.id)));
  };

  const handleDeselectAll = () => {
    setSelectedVideoIds(new Set());
    setSelectedResourceIds(new Set());
  };

  // Execute Import
  const handleExecuteImport = async () => {
    if (!scanSummary) return;
    setStep('IMPORTING');
    setStatusMessage('Saving course structure, video lessons, and exercise PDFs...');

    const videosToImport = scanSummary.allVideos.filter((v) => selectedVideoIds.has(v.id));
    const resourcesToImport = scanSummary.allResources.filter((r) => selectedResourceIds.has(r.id));

    const result = await executeMoshCourseImport(videosToImport, resourcesToImport, {
      courseName,
      existingAction,
    });

    setImportResult(result);
    setStep('SUMMARY');
    onImportComplete();
  };

  const totalSelectedCount = selectedVideoIds.size + selectedResourceIds.size;

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
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Film size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Mosh Course Importer
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Scan local course folders, organize sections, video lessons, and exercise PDFs
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
          
          {/* STEP 1: SELECT COURSE FOLDER */}
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
                  Select Local Mosh Course Folder
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Select your local <strong>Spring Boot</strong> course folder. DEARSENSAI will scan and preserve sections, video lesson metadata (<code>.mp4</code>, <code>.webm</code>, <code>.mkv</code>), and classify <code>0. Resources</code> PDFs as <strong>Exercise/Practice PDFs</strong> completely offline.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {/* 1. Pick Local Folder */}
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
                      Select Mosh Course directory
                    </span>
                  </div>
                </button>

                {/* 2. Load Sample Course 1 */}
                <button
                  type="button"
                  onClick={() => handleProcessRawFiles(SAMPLE_COURSE_1_FIXTURE, 'Spring Boot Course')}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <BookOpen size={28} color="#F59E0B" />
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
                      Load Course 1 (Spring Boot)
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      5 Sections • 13 Videos • 5 Exercises
                    </span>
                  </div>
                </button>

                {/* 3. Load Sample Course 2 */}
                <button
                  type="button"
                  onClick={() => handleProcessRawFiles(SAMPLE_COURSE_2_FIXTURE, 'Spring Boot REST & Security')}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <BookOpen size={28} color="#10B981" />
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
                      Load Course 2 (REST & Security)
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      10 Sections • 12 Videos • 2 Exercises
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
                    {scanSummary.courseName}
                  </h4>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>● {scanSummary.totalSections} Sections</span>
                    <span style={{ color: '#F59E0B', fontWeight: 600 }}>● {scanSummary.totalVideos} Videos</span>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>● {scanSummary.totalResources} Exercise PDFs</span>
                    <span style={{ color: 'var(--text-secondary)' }}>● {totalSelectedCount} Selected</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    style={{ fontSize: '12px', padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontWeight: 600 }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    style={{ fontSize: '12px', padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Duplicate Action Picker if any existing */}
              {scanSummary.existingCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                  <span style={{ color: '#F59E0B', fontWeight: 600 }}>
                    {scanSummary.existingCount} items already exist in database:
                  </span>
                  <select
                    value={existingAction}
                    onChange={(e) => setExistingAction(e.target.value as 'SKIP' | 'UPDATE')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  >
                    <option value="UPDATE">Update Metadata</option>
                    <option value="SKIP">Skip Existing Items</option>
                  </select>
                </div>
              )}

              {/* COURSE TREE VIEW */}
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
                {scanSummary.sections.map((sec) => (
                  <div key={sec.sectionName} style={{ borderLeft: '2px solid var(--border-subtle)', paddingLeft: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {sec.sectionName.startsWith('0') || sec.sectionName.toLowerCase().includes('resource') ? (
                        <FileText size={14} color="#10B981" />
                      ) : (
                        <PlayCircle size={14} color="#F59E0B" />
                      )}
                      <span>{sec.sectionName}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>
                        ({sec.videos.length > 0 ? `${sec.videos.length} videos` : ''}{sec.resources.length > 0 ? `${sec.resources.length} PDFs` : ''})
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {/* Video Lessons */}
                      {sec.videos.map((vid) => {
                        const isSelected = selectedVideoIds.has(vid.id);
                        return (
                          <div
                            key={vid.id}
                            onClick={() => handleToggleVideo(vid.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '5px 8px',
                              borderRadius: 'var(--radius-sm)',
                              background: isSelected ? 'var(--bg-card)' : 'transparent',
                              border: isSelected ? '1px solid var(--border-medium)' : '1px solid transparent',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {isSelected ? (
                                <CheckSquare size={15} color="var(--accent-primary)" />
                              ) : (
                                <Square size={15} color="var(--text-muted)" />
                              )}
                              <span style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 400, color: 'var(--text-primary)' }}>
                                {vid.title}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                ({vid.originalFileName})
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
                                {vid.fileType}
                              </span>
                              {vid.status === 'EXISTING' && (
                                <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 4px', borderRadius: '3px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                                  EXISTING
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Resource PDFs */}
                      {sec.resources.map((res) => {
                        const isSelected = selectedResourceIds.has(res.id);
                        return (
                          <div
                            key={res.id}
                            onClick={() => handleToggleResource(res.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '5px 8px',
                              borderRadius: 'var(--radius-sm)',
                              background: isSelected ? 'var(--bg-card)' : 'transparent',
                              border: isSelected ? '1px solid var(--border-medium)' : '1px solid transparent',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {isSelected ? (
                                <CheckSquare size={15} color="#10B981" />
                              ) : (
                                <Square size={15} color="var(--text-muted)" />
                              )}
                              <span style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 400, color: 'var(--text-primary)' }}>
                                {res.title}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                ({res.originalFileName})
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
                                EXERCISE PDF
                              </span>
                              {res.status === 'EXISTING' && (
                                <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 4px', borderRadius: '3px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
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
                Importing Mosh Course Structure...
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
                    Mosh Course Imported Successfully!
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {importResult.courseTitle} structure, video lessons, and exercise PDFs are now browsable.
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#F59E0B', display: 'block' }}>
                    {importResult.importedVideos}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Videos Ingested</span>
                </div>

                <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#10B981', display: 'block' }}>
                    {importResult.importedResources}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Exercise PDFs</span>
                </div>

                <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-primary)', display: 'block' }}>
                    {importResult.updatedVideos + importResult.updatedResources}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Updated</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
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
                disabled={totalSelectedCount === 0}
                onClick={handleExecuteImport}
                style={{
                  padding: '8px 22px',
                  borderRadius: 'var(--radius-sm)',
                  background: totalSelectedCount > 0 ? 'var(--accent-primary)' : 'var(--bg-surface)',
                  color: totalSelectedCount > 0 ? '#FFF' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: totalSelectedCount > 0 ? '0 2px 8px var(--accent-glow)' : 'none',
                  cursor: totalSelectedCount > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                <span>Import Selected ({totalSelectedCount})</span>
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
              View in Courses
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
