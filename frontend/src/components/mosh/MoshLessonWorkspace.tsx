import React, { useState, useEffect } from 'react';
import {
  MoshVideo,
  MoshLessonContent,
  RevisionItem,
  KnowledgeDraft,
  KnowledgeDraftType,
  CodeRecallDifficulty,
} from '../../core/types';
import { moshRepo, revisionItemRepo, knowledgeDraftRepo } from '../../storage/repositories';
import {
  ArrowLeft,
  Film,
  HardDrive,
  FileText,
  Save,
  Sparkles,
  Check,
  Brain,
  HelpCircle,
  BrainCircuit,
  Network,
  Code,
  AlertTriangle,
  Info,
  CheckCircle2,
  Folder,
  Edit3,
  X,
  CheckSquare,
  XCircle,
  Clock,
  Layers,
} from 'lucide-react';

interface MoshLessonWorkspaceProps {
  video: MoshVideo;
  onBack: () => void;
  onRefreshData?: () => void;
}

export const MoshLessonWorkspace: React.FC<MoshLessonWorkspaceProps> = ({
  video,
  onBack,
  onRefreshData,
}) => {
  const [content, setContent] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const [activeKnowledgeTab, setActiveKnowledgeTab] = useState<string>('CONCEPTS');
  const [drafts, setDrafts] = useState<KnowledgeDraft[]>([]);
  const [linkedRevisionItems, setLinkedRevisionItems] = useState<RevisionItem[]>([]);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Edit draft modal state
  const [editingDraft, setEditingDraft] = useState<KnowledgeDraft | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    question: string;
    answer: string;
    explanation: string;
    whyExplanation: string;
    codeSnippet: string;
    codeLanguage: string;
    difficulty: CodeRecallDifficulty;
  }>({
    title: '',
    question: '',
    answer: '',
    explanation: '',
    whyExplanation: '',
    codeSnippet: '',
    codeLanguage: 'java',
    difficulty: 'LEVEL_2',
  });

  const loadLinkedItems = async () => {
    try {
      const allItems = await revisionItemRepo.getAll();
      const linked = allItems.filter(
        (item) => item.sourceMetadata?.videoId === video.id
      );
      setLinkedRevisionItems(linked);
    } catch (err) {
      console.error('Failed to load linked revision items:', err);
    }
  };

  const loadDrafts = async () => {
    try {
      const videoDrafts = await knowledgeDraftRepo.getDraftsByVideo(video.id);
      setDrafts(videoDrafts);
    } catch (err) {
      console.error('Failed to load drafts:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const existing = await moshRepo.getLessonContent(video.id);
        if (existing) {
          setContent(existing.content || '');
          setNotes(existing.notes || '');
          setLastSavedTime(existing.updatedAt);
        }

        await Promise.all([loadLinkedItems(), loadDrafts()]);
      } catch (err) {
        console.error('Failed to load lesson workspace:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [video.id]);

  const handleSaveContent = async () => {
    setSaving(true);
    try {
      const now = Date.now();
      const lessonRecord: MoshLessonContent = {
        id: video.id,
        moshVideoId: video.id,
        courseId: video.courseId,
        courseName: video.courseName,
        sectionName: video.sectionName,
        lessonTitle: video.title,
        content: content.trim(),
        notes: notes.trim(),
        status: content.trim() ? 'STAGED' : 'RAW',
        createdAt: lastSavedTime || now,
        updatedAt: now,
      };

      await moshRepo.saveLessonContent(lessonRecord);
      setLastSavedTime(now);
      setSavedSuccess(true);
      if (onRefreshData) onRefreshData();

      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to save lesson content:', err);
      alert('Failed to save lesson content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Draft review actions
  const handleApproveDraft = async (draftId: string) => {
    try {
      const { revisionItem } = await knowledgeDraftRepo.approveDraft(draftId);
      setActionFeedback({
        type: 'success',
        message: `Approved: "${revisionItem.title}" is now an active Revision Item!`,
      });
      await Promise.all([loadDrafts(), loadLinkedItems()]);
      if (onRefreshData) onRefreshData();

      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error approving draft:', err);
      setActionFeedback({ type: 'error', message: err.message || 'Failed to approve draft' });
    }
  };

  const handleRejectDraft = async (draftId: string) => {
    try {
      await knowledgeDraftRepo.rejectDraft(draftId);
      setActionFeedback({
        type: 'info',
        message: 'Draft rejected. (Will not become a revision item)',
      });
      await loadDrafts();

      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      console.error('Error rejecting draft:', err);
      setActionFeedback({ type: 'error', message: err.message || 'Failed to reject draft' });
    }
  };

  const handleStartEditDraft = (draft: KnowledgeDraft) => {
    setEditingDraft(draft);
    setEditForm({
      title: draft.title || '',
      question: draft.question || '',
      answer: draft.answer || '',
      explanation: draft.explanation || '',
      whyExplanation: draft.whyExplanation || '',
      codeSnippet: draft.codeSnippet || '',
      codeLanguage: draft.codeLanguage || 'java',
      difficulty: draft.difficulty || 'LEVEL_2',
    });
  };

  const handleSaveEditDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDraft) return;

    try {
      const updatedDraft: KnowledgeDraft = {
        ...editingDraft,
        title: editForm.title.trim() || editingDraft.title,
        question: editForm.question.trim() || editingDraft.question,
        answer: editForm.answer.trim() || editingDraft.answer,
        explanation: editForm.explanation.trim() || undefined,
        whyExplanation: editForm.whyExplanation.trim() || undefined,
        codeSnippet: editForm.codeSnippet.trim() || undefined,
        codeLanguage: editForm.codeLanguage.trim() || undefined,
        difficulty: editForm.difficulty || editingDraft.difficulty,
        updatedAt: Date.now(),
      };

      await knowledgeDraftRepo.updateDraft(updatedDraft);
      setEditingDraft(null);
      setActionFeedback({ type: 'success', message: 'Draft changes saved.' });
      await loadDrafts();

      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      console.error('Error saving draft edit:', err);
      alert('Failed to save draft changes.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return 'Local Mac File';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const KNOWLEDGE_SECTIONS = [
    {
      id: 'CONCEPTS',
      label: 'Concepts',
      icon: <BrainCircuit size={16} color="var(--accent-primary)" />,
      badge: 'CONCEPT',
      matchType: (t: KnowledgeDraftType) => t === 'CONCEPT',
      description: 'Core architectural models, Inversion of Control, and framework abstractions.',
    },
    {
      id: 'RECALL',
      label: 'Recall Questions',
      icon: <Brain size={16} color="#3B82F6" />,
      badge: 'FLASHCARD',
      matchType: (t: KnowledgeDraftType) => t === 'FLASHCARD',
      description: 'High-yield active recall questions and precise definitions.',
    },
    {
      id: 'WHY',
      label: 'Why Questions',
      icon: <HelpCircle size={16} color="#F43F5E" />,
      badge: 'WHY',
      matchType: (t: KnowledgeDraftType) => t === 'WHY',
      description: 'Design decisions, why Spring Boot was created, and component trade-offs.',
    },
    {
      id: 'LOGIC',
      label: 'Logic Questions',
      icon: <Network size={16} color="#EC4899" />,
      badge: 'LOGIC',
      matchType: (t: KnowledgeDraftType) => t === 'LOGIC',
      description: 'Step-by-step execution flow, Bean lifecycles, and dependency resolution order.',
    },
    {
      id: 'CODE_RECALL',
      label: 'Code Recall',
      icon: <Code size={16} color="#F59E0B" />,
      badge: 'CODE_RECALL',
      matchType: (t: KnowledgeDraftType) => t === 'CODE_RECALL' || t === 'CODE_EXPLANATION',
      description: 'Annotation signatures (@Component, @Autowired), constructor injection patterns.',
    },
    {
      id: 'TIPS',
      label: 'Quick Tips',
      icon: <Sparkles size={16} color="#10B981" />,
      badge: 'TIP',
      matchType: (t: KnowledgeDraftType) => t === 'TIP',
      description: 'Best practices, IntelliJ shortcuts, and Spring Boot conventions.',
    },
    {
      id: 'MISTAKES',
      label: 'Mistake Review',
      icon: <AlertTriangle size={16} color="#EF4444" />,
      badge: 'MISTAKE',
      matchType: (t: KnowledgeDraftType) => t === 'MISTAKE',
      description: 'Common pitfalls, circular dependencies, and debugging traps.',
    },
  ];

  const getDraftCountForCategory = (sectionId: string) => {
    const section = KNOWLEDGE_SECTIONS.find((s) => s.id === sectionId);
    if (!section) return 0;
    return drafts.filter((d) => section.matchType(d.type)).length;
  };

  const currentSection = KNOWLEDGE_SECTIONS.find((s) => s.id === activeKnowledgeTab) || KNOWLEDGE_SECTIONS[0];
  const activeCategoryDrafts = drafts.filter((d) => currentSection.matchType(d.type));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. TOP NAVIGATION & BREADCRUMBS */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Course</span>
          </button>

          {/* Breadcrumb path */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{video.courseName}</span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-muted)' }}>{video.sectionName}</span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{video.title}</span>
          </div>
        </div>

        {/* Source Provenance Tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#F59E0B',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          <Film size={14} />
          <span>Source: MOSH • Local Mac Media</span>
        </div>
      </div>

      {/* ACTION NOTIFICATION FEEDBACK */}
      {actionFeedback && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            background:
              actionFeedback.type === 'success'
                ? 'rgba(16, 185, 129, 0.15)'
                : actionFeedback.type === 'error'
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(99, 102, 241, 0.15)',
            border: `1px solid ${
              actionFeedback.type === 'success'
                ? 'rgba(16, 185, 129, 0.3)'
                : actionFeedback.type === 'error'
                ? 'rgba(239, 68, 68, 0.3)'
                : 'rgba(99, 102, 241, 0.3)'
            }`,
            color:
              actionFeedback.type === 'success'
                ? '#10B981'
                : actionFeedback.type === 'error'
                ? '#EF4444'
                : 'var(--accent-primary)',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{actionFeedback.message}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            style={{ background: 'transparent', color: 'inherit', padding: '2px', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. LESSON METADATA CARD */}
      <div
        className="glass-card"
        style={{
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                {video.sectionName}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
                {video.fileType.toUpperCase()}
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {video.title}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <Folder size={13} color="var(--accent-primary)" />
              {video.relativePath}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <HardDrive size={13} color="#10B981" />
              {formatFileSize(video.fileSize)}
            </span>
          </div>
        </div>

        {/* Local Video Privacy Info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          <Info size={15} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Local Media Note:</strong> Video file <code>{video.originalFileName}</code> is stored locally on your Mac. Transcripts, staged drafts, and approved revision cards are persisted locally in IndexedDB.
          </span>
        </div>
      </div>

      {/* 3. LESSON CONTENT / TRANSCRIPT INPUT SECTION */}
      <div
        className="glass-card"
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Lesson Content & Transcript
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Paste lesson subtitles, transcript, or lecture notes to prepare for structured knowledge extraction.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {wordCount} words • {charCount} characters
            </span>

            {lastSavedTime && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '3px 8px', borderRadius: '4px' }}>
                Saved: {new Date(lastSavedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveContent}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-md)',
                background: savedSuccess ? '#10B981' : 'var(--accent-primary)',
                color: '#FFF',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px var(--accent-glow)',
                cursor: saving ? 'wait' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {savedSuccess ? (
                <>
                  <Check size={15} />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>{saving ? 'Saving...' : 'Save Content'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading lesson workspace...
          </div>
        ) : (
          <textarea
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Paste transcript or lesson notes here...\n\nExample:\nInversion of Control (IoC) is a software engineering principle in which the control of object creation and lifecycle management is transferred from the application code to an external container/framework (the Spring IoC Container). Instead of classes instantiating their own dependencies using 'new', dependencies are injected at runtime via constructors, setters, or fields.`}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '13px',
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        )}
      </div>

      {/* 4. KNOWLEDGE EXTRACTION PIPELINE (STAGING AREA) */}
      <div
        className="glass-card"
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BrainCircuit size={18} color="#F59E0B" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Extracted Knowledge Pipeline
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Review, edit, accept, or reject staged knowledge drafts before they enter your active revision rotation.
            </p>
          </div>

          {/* GENERATE KNOWLEDGE BUTTON (PREPARED FOR NEXT MILESTONE) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              disabled={!content.trim()}
              onClick={() => {
                alert('AI Knowledge Extraction Engine will be connected in the next milestone! Your lesson content is safely saved and ready for extraction.');
              }}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                background: content.trim() ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface)',
                border: content.trim() ? '1px solid #F59E0B' : '1px solid var(--border-subtle)',
                color: content.trim() ? '#F59E0B' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: content.trim() ? 'pointer' : 'not-allowed',
                opacity: content.trim() ? 1 : 0.6,
              }}
              title={content.trim() ? 'Click to see extraction pipeline details' : 'Paste and save lesson content first'}
            >
              <Sparkles size={15} />
              <span>Generate Knowledge</span>
              <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.2)', padding: '1px 5px', borderRadius: '3px' }}>
                Next Milestone
              </span>
            </button>
          </div>
        </div>

        {/* CATEGORY TABS WITH DRAFT COUNT BADGES */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {KNOWLEDGE_SECTIONS.map((sec) => {
            const count = getDraftCountForCategory(sec.id);
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveKnowledgeTab(sec.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: activeKnowledgeTab === sec.id ? 'var(--bg-surface)' : 'transparent',
                  border: activeKnowledgeTab === sec.id ? '1px solid var(--border-highlight)' : '1px solid transparent',
                  color: activeKnowledgeTab === sec.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: activeKnowledgeTab === sec.id ? 700 : 500,
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                {sec.icon}
                <span>{sec.label}</span>
                {count > 0 && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: activeKnowledgeTab === sec.id ? 'var(--accent-primary)' : 'rgba(99, 102, 241, 0.15)',
                      color: activeKnowledgeTab === sec.id ? '#FFF' : 'var(--accent-primary)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ACTIVE CATEGORY DRAFTS LIST OR EMPTY STATE */}
        {activeCategoryDrafts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeCategoryDrafts.map((draft) => (
              <div
                key={draft.id}
                style={{
                  padding: '16px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border:
                    draft.status === 'APPROVED'
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : draft.status === 'REJECTED'
                      ? '1px solid rgba(239, 68, 68, 0.2)'
                      : '1px solid var(--border-medium)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* Draft Card Header */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background:
                          draft.status === 'APPROVED'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : draft.status === 'REJECTED'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color:
                          draft.status === 'APPROVED'
                            ? '#10B981'
                            : draft.status === 'REJECTED'
                            ? '#EF4444'
                            : '#F59E0B',
                      }}
                    >
                      {draft.status}
                    </span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {draft.title}
                    </strong>
                  </div>

                  {/* Actions for DRAFT items */}
                  {draft.status === 'DRAFT' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleApproveDraft(draft.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: '#10B981',
                          color: '#FFF',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                        }}
                      >
                        <Check size={13} />
                        <span>Accept</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartEditDraft(draft)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-medium)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectDraft(draft.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#EF4444',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <X size={13} />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {draft.status === 'APPROVED' && (
                    <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                      ✓ Active in Revision Rotation
                    </span>
                  )}

                  {draft.status === 'REJECTED' && (
                    <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>
                      ✕ Excluded from Knowledge Base
                    </span>
                  )}
                </div>

                {/* Question / Prompt */}
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  <strong>Prompt:</strong> {draft.question}
                </div>

                {/* Answer */}
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>Answer:</strong>
                  {draft.answer}
                </div>

                {/* Optional Explanation */}
                {draft.explanation && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    <strong>Explanation:</strong> {draft.explanation}
                  </div>
                )}

                {/* Optional Why Explanation */}
                {draft.whyExplanation && (
                  <div style={{ fontSize: '12px', color: '#F43F5E', background: 'rgba(244, 63, 94, 0.05)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244, 63, 94, 0.15)' }}>
                    <strong>Why Rationale:</strong> {draft.whyExplanation}
                  </div>
                )}

                {/* Optional Code Snippet */}
                {draft.codeSnippet && (
                  <div style={{ background: '#1E1E1E', padding: '10px 12px', borderRadius: 'var(--radius-sm)', overflowX: 'auto' }}>
                    <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                      {draft.codeLanguage || 'Java'}
                    </div>
                    <pre style={{ margin: 0, fontSize: '12px', color: '#E5E7EB', fontFamily: 'var(--font-mono)' }}>
                      <code>{draft.codeSnippet}</code>
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div
            style={{
              padding: '24px 20px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-medium)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {currentSection.icon}
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                No {currentSection.label} Generated Yet
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '420px', marginTop: '4px' }}>
                {currentSection.description}
              </p>
            </div>

            <div
              style={{
                fontSize: '11px',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                marginTop: '4px',
                background: 'rgba(99, 102, 241, 0.08)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              Mapped Revision Item Type: <code>{currentSection.badge}</code>
            </div>
          </div>
        )}
      </div>

      {/* 5. LINKED APPROVED REVISION ITEMS */}
      {linkedRevisionItems.length > 0 && (
        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#10B981" />
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Approved Revision Items in Knowledge Base ({linkedRevisionItems.length})
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {linkedRevisionItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, display: 'block' }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {item.frontContent.substring(0, 80)}{item.frontContent.length > 80 ? '...' : ''}
                  </span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. EDIT DRAFT MODAL */}
      {editingDraft && (
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
          <div
            className="animate-scale-in"
            style={{
              width: '100%',
              maxWidth: '600px',
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
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={16} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Edit Knowledge Draft
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDraft(null)}
                style={{ color: 'var(--text-muted)', padding: '4px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSaveEditDraft}
              style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {/* Title */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Title / Label
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              {/* Question / Prompt */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Question / Recall Prompt
                </label>
                <textarea
                  rows={3}
                  value={editForm.question}
                  onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                  required
                />
              </div>

              {/* Answer */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Answer / Solution
                </label>
                <textarea
                  rows={3}
                  value={editForm.answer}
                  onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                  required
                />
              </div>

              {/* Explanation (Optional) */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Explanation (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editForm.explanation}
                  onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Why Explanation (Optional) */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Why Rationale / Architectural Decision (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editForm.whyExplanation}
                  onChange={(e) => setEditForm({ ...editForm, whyExplanation: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Code Snippet (Optional) */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Code Snippet (Optional)
                </label>
                <textarea
                  rows={3}
                  value={editForm.codeSnippet}
                  onChange={(e) => setEditForm({ ...editForm, codeSnippet: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#1E1E1E',
                    border: '1px solid var(--border-medium)',
                    color: '#E5E7EB',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingDraft(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-primary)',
                    color: '#FFF',
                    fontWeight: 600,
                    fontSize: '13px',
                    boxShadow: '0 2px 8px var(--accent-glow)',
                    cursor: 'pointer',
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
