import React, { useState, useEffect } from 'react';
import { Subject, Topic, RevisionItem, RevisionItemType, CodeRecallDifficulty } from '../core/types';
import { revisionItemRepo, subjectRepo, topicRepo } from '../storage/repositories';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Code,
  BrainCircuit,
  Network,
  HelpCircle,
  Sparkles,
  Layers,
  Power,
  X,
  BookPlus,
  FolderPlus,
  FolderCode,
  Film,
  BookOpen,
} from 'lucide-react';
import { KaizenDsaImportModal } from '../components/importer/KaizenDsaImportModal';
import { MoshCourseImportModal } from '../components/importer/MoshCourseImportModal';
import { MoshCourseBrowser } from '../components/mosh/MoshCourseBrowser';

interface LibraryScreenProps {
  subjects: Subject[];
  topics: Topic[];
  onStartSession: (mode: string, params?: { topicId?: string }) => void;
  onRefreshData?: () => void;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  subjects,
  topics,
  onStartSession,
  onRefreshData,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Create Subject Modal State
  const [showAddSubjectModal, setShowAddSubjectModal] = useState<boolean>(false);
  const [newSubjectName, setNewSubjectName] = useState<string>('');
  const [newSubjectDesc, setNewSubjectDesc] = useState<string>('');
  const [newSubjectColor, setNewSubjectColor] = useState<string>('var(--accent-primary)');
  const [subjectError, setSubjectError] = useState<string>('');

  // Create Topic Modal State
  const [showAddTopicModal, setShowAddTopicModal] = useState<boolean>(false);
  const [newTopicName, setNewTopicName] = useState<string>('');
  const [newTopicDesc, setNewTopicDesc] = useState<string>('');
  const [topicError, setTopicError] = useState<string>('');

  // KaizenDSA Importer Modal State
  const [showImportDsaModal, setShowImportDsaModal] = useState<boolean>(false);

  // Mosh Course Importer Modal State & Library View Tab
  const [showImportMoshModal, setShowImportMoshModal] = useState<boolean>(false);
  const [libraryTab, setLibraryTab] = useState<'KNOWLEDGE_BASE' | 'MOSH_COURSES'>('KNOWLEDGE_BASE');

  // New Item Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newItemTopicId, setNewItemTopicId] = useState<string>('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState<RevisionItemType>('FLASHCARD');
  const [newItemFront, setNewItemFront] = useState('');
  const [newItemBack, setNewItemBack] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemDifficulty, setNewItemDifficulty] = useState<CodeRecallDifficulty>('LEVEL_1');
  const [newItemTip, setNewItemTip] = useState('');
  const [newItemTags, setNewItemTags] = useState('');

  // Edit Item Modal State
  const [editingItem, setEditingItem] = useState<RevisionItem | null>(null);
  const [editTopicId, setEditTopicId] = useState<string>('');
  const [editTitle, setEditTitle] = useState<string>('');
  const [editType, setEditType] = useState<RevisionItemType>('FLASHCARD');
  const [editFront, setEditFront] = useState<string>('');
  const [editBack, setEditBack] = useState<string>('');
  const [editCode, setEditCode] = useState<string>('');
  const [editDifficulty, setEditDifficulty] = useState<CodeRecallDifficulty>('LEVEL_1');
  const [editTip, setEditTip] = useState<string>('');
  const [editTags, setEditTags] = useState<string>('');
  const [editIsEnabled, setEditIsEnabled] = useState<boolean>(true);

  // Synchronize selected subject if current selection is invalid
  useEffect(() => {
    if (subjects.length > 0 && (!selectedSubjectId || !subjects.some((s) => s.id === selectedSubjectId))) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // Load items from local IndexedDB
  const loadItems = async () => {
    if (searchQuery.trim()) {
      const results = await revisionItemRepo.search(searchQuery);
      setItems(results);
    } else if (selectedTopicId) {
      const results = await revisionItemRepo.getByTopic(selectedTopicId);
      setItems(results);
    } else if (selectedSubjectId) {
      const subTopics = topics.filter((t) => t.subjectId === selectedSubjectId);
      const subTopicIds = new Set(subTopics.map((t) => t.id));
      const all = await revisionItemRepo.getAll();
      const filtered = all.filter((i) => subTopicIds.has(i.topicId));
      setItems(filtered);
    } else {
      const all = await revisionItemRepo.getAll();
      setItems(all);
    }
  };

  useEffect(() => {
    loadItems();
  }, [selectedSubjectId, selectedTopicId, searchQuery, topics]);

  const filteredItems = items.filter((item) => {
    if (selectedTypeFilter === 'ALL') return true;
    return item.type === selectedTypeFilter;
  });

  // ==========================================
  // CREATE SUBJECT HANDLER
  // ==========================================
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newSubjectName.trim();
    if (!trimmedName) {
      setSubjectError('Subject name is required.');
      return;
    }

    const duplicate = subjects.some(
      (s) => s.title.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      setSubjectError('A subject with this name already exists.');
      return;
    }

    const created = await subjectRepo.create({
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: trimmedName,
      description: newSubjectDesc.trim(),
      color: newSubjectColor || 'var(--accent-primary)',
      orderIndex: subjects.length + 1,
    });

    setNewSubjectName('');
    setNewSubjectDesc('');
    setSubjectError('');
    setShowAddSubjectModal(false);

    setSelectedSubjectId(created.id);
    setSelectedTopicId('');

    if (onRefreshData) onRefreshData();
  };

  // ==========================================
  // CREATE TOPIC HANDLER
  // ==========================================
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newTopicName.trim();
    if (!trimmedName) {
      setTopicError('Topic name is required.');
      return;
    }

    if (!selectedSubjectId) {
      setTopicError('Please select a subject first.');
      return;
    }

    const activeTopics = topics.filter((t) => t.subjectId === selectedSubjectId);
    const duplicate = activeTopics.some(
      (t) => t.title.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      setTopicError('A topic with this name already exists in this subject.');
      return;
    }

    const created = await topicRepo.create({
      id: `top_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      subjectId: selectedSubjectId,
      title: trimmedName,
      description: newTopicDesc.trim(),
      orderIndex: activeTopics.length + 1,
    });

    setNewTopicName('');
    setNewTopicDesc('');
    setTopicError('');
    setShowAddTopicModal(false);

    setSelectedTopicId(created.id);

    if (onRefreshData) onRefreshData();
  };

  // ==========================================
  // EDIT REVISION ITEM HANDLERS
  // ==========================================
  const handleOpenEditModal = (item: RevisionItem) => {
    setEditingItem(item);
    setEditTopicId(item.topicId);
    setEditTitle(item.title);
    setEditType(item.type);
    setEditFront(item.frontContent);
    setEditBack(item.backContent);
    setEditCode(item.codeSnippet || '');
    setEditDifficulty(item.difficulty || 'LEVEL_1');
    setEditTip(item.tip || '');
    setEditTags(item.tags ? item.tags.join(', ') : '');
    setEditIsEnabled(item.isEnabled !== false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editTitle.trim() || !editFront.trim() || !editBack.trim()) return;

    const parsedTags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const updated: RevisionItem = {
      ...editingItem,
      topicId: editTopicId || editingItem.topicId,
      type: editType,
      title: editTitle.trim(),
      frontContent: editFront.trim(),
      backContent: editBack.trim(),
      codeSnippet: editCode.trim() || undefined,
      difficulty: editType === 'CODE_RECALL' || editType === 'CODE_EXPLANATION' ? editDifficulty : undefined,
      tip: editTip.trim() || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
      isEnabled: editIsEnabled,
      updatedAt: Date.now(),
    };

    await revisionItemRepo.update(updated);
    setEditingItem(null);
    await loadItems();
    if (onRefreshData) onRefreshData();
  };

  // ==========================================
  // TOGGLE ENABLE/DISABLE HANDLER
  // ==========================================
  const handleToggleEnabled = async (item: RevisionItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !(item.isEnabled !== false);
    await revisionItemRepo.toggleEnabled(item.id, newStatus);
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isEnabled: newStatus } : i))
    );
    if (onRefreshData) onRefreshData();
  };

  // ==========================================
  // CREATE REVISION ITEM HANDLER
  // ==========================================
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !newItemFront.trim() || !newItemBack.trim()) return;

    const topicIdToUse =
      newItemTopicId ||
      selectedTopicId ||
      (topics.find((t) => t.subjectId === selectedSubjectId)?.id || topics[0]?.id);

    if (!topicIdToUse) return;

    const parsedTags = newItemTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    await revisionItemRepo.create({
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      topicId: topicIdToUse,
      type: newItemType,
      title: newItemTitle.trim(),
      frontContent: newItemFront.trim(),
      backContent: newItemBack.trim(),
      codeSnippet: newItemCode.trim() || undefined,
      difficulty: newItemType === 'CODE_RECALL' || newItemType === 'CODE_EXPLANATION' ? newItemDifficulty : undefined,
      tip: newItemTip.trim() || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
      isEnabled: true,
    });

    setNewItemTitle('');
    setNewItemFront('');
    setNewItemBack('');
    setNewItemCode('');
    setNewItemTip('');
    setNewItemTags('');
    setShowAddModal(false);

    await loadItems();
    if (onRefreshData) onRefreshData();
  };

  // ==========================================
  // DELETE REVISION ITEM HANDLER
  // ==========================================
  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this revision item?')) {
      await revisionItemRepo.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (onRefreshData) onRefreshData();
    }
  };

  const activeSubjectTopics = topics.filter((t) => t.subjectId === selectedSubjectId);
  const currentSelectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  const getItemTypeIcon = (type: RevisionItemType) => {
    switch (type) {
      case 'CODE_RECALL':
      case 'CODE_EXPLANATION':
        return <Code size={14} color="#F59E0B" />;
      case 'LOGIC':
        return <Network size={14} color="#EC4899" />;
      case 'WHY':
        return <HelpCircle size={14} color="#F43F5E" />;
      case 'CONCEPT':
        return <BrainCircuit size={14} color="var(--accent-primary)" />;
      case 'TIP':
        return <Sparkles size={14} color="#F59E0B" />;
      default:
        return <Layers size={14} color="var(--accent-primary)" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* 1. TOP HEADER & NEW ITEM ACTION */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Knowledge Base Library
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Manage subjects, topics, and personal active recall items
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowImportDsaModal(true)}
            style={{
              padding: '9px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              color: 'var(--accent-primary)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Import personal coding solutions from local KaizenDSA repository"
          >
            <FolderCode size={15} />
            <span>+ Import DSA</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImportMoshModal(true)}
            style={{
              padding: '9px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              color: '#F59E0B',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Import Mosh video lessons and practice exercise PDFs from local course folder"
          >
            <Film size={15} />
            <span>+ Import Mosh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setNewItemTopicId(selectedTopicId || activeSubjectTopics[0]?.id || topics[0]?.id || '');
              setShowAddModal(true);
            }}
            style={{
              padding: '9px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              color: '#FFF',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px var(--accent-glow)',
            }}
          >
            <Plus size={15} />
            <span>New Revision Item</span>
          </button>
        </div>
      </div>

      {/* VIEW SELECTOR: KNOWLEDGE BASE vs MOSH COURSES */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
        <button
          type="button"
          onClick={() => setLibraryTab('KNOWLEDGE_BASE')}
          style={{
            padding: '7px 16px',
            borderRadius: 'var(--radius-md)',
            background: libraryTab === 'KNOWLEDGE_BASE' ? 'var(--accent-primary)' : 'var(--bg-surface)',
            border: libraryTab === 'KNOWLEDGE_BASE' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
            color: libraryTab === 'KNOWLEDGE_BASE' ? '#FFF' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Layers size={14} />
          <span>Knowledge Base (Subjects & Topics)</span>
        </button>

        <button
          type="button"
          onClick={() => setLibraryTab('MOSH_COURSES')}
          style={{
            padding: '7px 16px',
            borderRadius: 'var(--radius-md)',
            background: libraryTab === 'MOSH_COURSES' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface)',
            border: libraryTab === 'MOSH_COURSES' ? '1px solid #F59E0B' : '1px solid var(--border-subtle)',
            color: libraryTab === 'MOSH_COURSES' ? '#F59E0B' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Film size={14} />
          <span>Mosh Video Courses</span>
        </button>
      </div>

      {/* TAB 2: MOSH COURSES VIEW */}
      {libraryTab === 'MOSH_COURSES' && (
        <MoshCourseBrowser
          onOpenImportModal={() => setShowImportMoshModal(true)}
          onRefreshData={onRefreshData}
        />
      )}

      {/* TAB 1: KNOWLEDGE BASE VIEW */}
      {libraryTab === 'KNOWLEDGE_BASE' && (
        <>
          {/* SEARCH BAR & TYPE FILTER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '9px 14px',
          }}
        >
          <Search size={17} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search questions, answers, code snippets, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '13px',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ fontSize: '12px', color: 'var(--text-muted)' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'FLASHCARD', label: 'Flashcards' },
            { id: 'CODE_RECALL', label: 'Code Recall' },
            { id: 'LOGIC', label: 'Logic Questions' },
            { id: 'CONCEPT', label: 'Concepts' },
            { id: 'WHY', label: 'Why Questions' },
            { id: 'TIP', label: 'Tips' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTypeFilter(tab.id)}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                background: selectedTypeFilter === tab.id ? 'var(--accent-primary)' : 'var(--bg-surface)',
                border: selectedTypeFilter === tab.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                color: selectedTypeFilter === tab.id ? '#FFF' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. SUBJECT & TOPIC SELECTOR TABS */}
      {!searchQuery && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Subjects Row with "+ Subject" Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
            {subjects.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  setSelectedSubjectId(sub.id);
                  setSelectedTopicId('');
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: selectedSubjectId === sub.id ? 'var(--bg-card)' : 'var(--bg-surface)',
                  border: selectedSubjectId === sub.id ? '1px solid var(--border-highlight)' : '1px solid var(--border-subtle)',
                  color: selectedSubjectId === sub.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: selectedSubjectId === sub.id ? 700 : 500,
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: sub.color || 'var(--accent-primary)' }} />
                <span>{sub.title}</span>
              </button>
            ))}

            {/* "+ Subject" Trigger Button */}
            <button
              type="button"
              onClick={() => {
                setSubjectError('');
                setShowAddSubjectModal(true);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px dashed var(--border-medium)',
                color: 'var(--accent-primary)',
                fontSize: '12px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Create new Subject"
            >
              <BookPlus size={14} />
              <span>+ Subject</span>
            </button>
          </div>

          {/* Topics Row for selected Subject with "+ Topic" Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <button
              type="button"
              onClick={() => setSelectedTopicId('')}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                background: selectedTopicId === '' ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                border: selectedTopicId === '' ? '1px solid var(--accent-primary)' : '1px solid transparent',
                color: selectedTopicId === '' ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              All Topics ({items.length})
            </button>

            {activeSubjectTopics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => setSelectedTopicId(topic.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: selectedTopicId === topic.id ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  border: selectedTopicId === topic.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  color: selectedTopicId === topic.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {topic.title}
              </button>
            ))}

            {/* "+ Topic" Trigger Button */}
            {selectedSubjectId && (
              <button
                type="button"
                onClick={() => {
                  setTopicError('');
                  setShowAddTopicModal(true);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: '1px dashed var(--border-medium)',
                  color: 'var(--accent-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title={`Create new Topic under ${currentSelectedSubject?.title || 'Subject'}`}
              >
                <FolderPlus size={13} />
                <span>+ Topic</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. ITEMS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredItems.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            No revision items found. Click "New Revision Item" above to add one.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isEnabled = item.isEnabled !== false;
            return (
              <div
                key={item.id}
                className="glass-card"
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  opacity: isEnabled ? 1 : 0.6,
                  borderLeft: isEnabled ? '3px solid var(--border-subtle)' : '3px solid #64748B',
                }}
              >
                {/* Item Card Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getItemTypeIcon(item.type)}
                    <span
                      style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {item.type.replace('_', ' ')}
                    </span>
                    {item.difficulty && (
                      <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        {item.difficulty.replace('_', ' ')}
                      </span>
                    )}
                    {item.sourceMetadata?.sourceType === 'KAIZEN_DSA' && (
                      <span
                        style={{
                          fontSize: '10px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          color: '#F59E0B',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <FolderCode size={10} />
                        KAIZEN DSA
                      </span>
                    )}
                    {!isEnabled && (
                      <span style={{ fontSize: '10px', background: 'rgba(100, 116, 139, 0.15)', color: '#94A3B8', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        PAUSED / DISABLED
                      </span>
                    )}
                  </div>

                  {/* Actions: Enable/Disable, Edit, Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Enable / Disable Toggle */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleEnabled(item, e)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: isEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.15)',
                        border: isEnabled ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                        color: isEnabled ? 'var(--rating-good)' : '#94A3B8',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title={isEnabled ? 'Active in revision sessions (Click to disable)' : 'Disabled from revision sessions (Click to enable)'}
                    >
                      <Power size={12} />
                      <span>{isEnabled ? 'Active' : 'Disabled'}</span>
                    </button>

                    {/* Edit Action */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Edit revision item"
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>

                    {/* Delete Action */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      style={{
                        padding: '4px 6px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)',
                      }}
                      title="Delete revision item"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.title}
                </h4>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, maxHeight: '42px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.frontContent}
                </p>

                {item.tags && item.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                    {item.tags.map((t) => (
                      <span key={t} style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      </>
      )}

      {/* ========================================================================= */}
      {/* 4. CREATE SUBJECT MODAL */}
      {/* ========================================================================= */}
      {showAddSubjectModal && (
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
              maxWidth: '480px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookPlus size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Create New Subject
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(false)}
                style={{ color: 'var(--text-muted)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {subjectError && (
                <div style={{ padding: '8px 12px', background: 'var(--rating-again-bg)', border: '1px solid var(--rating-again-border)', color: 'var(--rating-again)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                  {subjectError}
                </div>
              )}

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Design, SQL, Computer Networks"
                  value={newSubjectName}
                  onChange={(e) => {
                    setNewSubjectName(e.target.value);
                    setSubjectError('');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Short overview of what this subject covers..."
                  value={newSubjectDesc}
                  onChange={(e) => setNewSubjectDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Accent Color
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Indigo', color: 'var(--accent-primary)' },
                    { label: 'Magenta', color: 'var(--subject-dsa)' },
                    { label: 'Amber', color: 'var(--subject-java)' },
                    { label: 'Emerald', color: 'var(--subject-spring)' },
                    { label: 'Cyan', color: '#06B6D4' },
                    { label: 'Purple', color: '#8B5CF6' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setNewSubjectColor(c.color)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: c.color,
                        border: newSubjectColor === c.color ? '2px solid #FFF' : '1px solid transparent',
                        boxShadow: newSubjectColor === c.color ? '0 0 8px rgba(255,255,255,0.4)' : 'none',
                        cursor: 'pointer',
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
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
                  }}
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CREATE TOPIC MODAL */}
      {/* ========================================================================= */}
      {showAddTopicModal && (
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
              maxWidth: '480px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderPlus size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Create New Topic
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTopicModal(false)}
                style={{ color: 'var(--text-muted)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTopic} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {topicError && (
                <div style={{ padding: '8px 12px', background: 'var(--rating-again-bg)', border: '1px solid var(--rating-again-border)', color: 'var(--rating-again)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                  {topicError}
                </div>
              )}

              {/* Subject Indicator */}
              <div style={{ padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Belongs to Subject: <strong style={{ color: 'var(--text-primary)' }}>{currentSelectedSubject?.title || 'Selected Subject'}</strong>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Topic Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sliding Window, Indexing & B-Trees, Microservices"
                  value={newTopicName}
                  onChange={(e) => {
                    setNewTopicName(e.target.value);
                    setTopicError('');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Key concepts or patterns in this topic..."
                  value={newTopicDesc}
                  onChange={(e) => setNewTopicDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddTopicModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
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
                  }}
                >
                  Create Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. EDIT REVISION ITEM MODAL */}
      {/* ========================================================================= */}
      {editingItem && (
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
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Edit Revision Item
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{ color: 'var(--text-muted)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Topic Selector */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Topic Assignment *
                </label>
                <select
                  value={editTopicId}
                  onChange={(e) => setEditTopicId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '13px',
                  }}
                >
                  {topics.map((t) => {
                    const sub = subjects.find((s) => s.id === t.subjectId);
                    return (
                      <option key={t.id} value={t.id}>
                        {sub ? `${sub.title} → ` : ''}{t.title}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Item Type Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Revision Type *
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as RevisionItemType)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontSize: '13px',
                    }}
                  >
                    <option value="FLASHCARD">Flashcard</option>
                    <option value="CONCEPT">Concept Question</option>
                    <option value="LOGIC">Logic Question</option>
                    <option value="WHY">Why Question</option>
                    <option value="CODE_RECALL">Code Recall</option>
                    <option value="CODE_EXPLANATION">Code Explanation</option>
                    <option value="TIP">Sensai Tip</option>
                  </select>
                </div>

                {(editType === 'CODE_RECALL' || editType === 'CODE_EXPLANATION') && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Difficulty Level
                    </label>
                    <select
                      value={editDifficulty}
                      onChange={(e) => setEditDifficulty(e.target.value as CodeRecallDifficulty)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontSize: '13px',
                      }}
                    >
                      <option value="LEVEL_1">Level 1: Token Blanks</option>
                      <option value="LEVEL_2">Level 2: Multi-line Blanks</option>
                      <option value="LEVEL_3">Level 3: Function Skeleton</option>
                      <option value="LEVEL_4">Level 4: Scratch Code</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Title / Concept Summary *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Question / Front */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Front Content / Question Prompt *
                </label>
                <textarea
                  required
                  rows={3}
                  value={editFront}
                  onChange={(e) => setEditFront(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Answer / Back */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Back Content / Answer & Explanation *
                </label>
                <textarea
                  required
                  rows={4}
                  value={editBack}
                  onChange={(e) => setEditBack(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Code Snippet (if code item) */}
              {(editType === 'CODE_RECALL' || editType === 'CODE_EXPLANATION' || editCode) && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Code Snippet (with ___BLANK_1___ tokens for blanks)
                  </label>
                  <textarea
                    rows={4}
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--code-bg)',
                      border: '1px solid var(--code-border)',
                      color: 'var(--code-text)',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                    }}
                  />
                </div>
              )}

              {/* Sensai Tip */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Sensai Tip / Rule of Thumb (Optional)
                </label>
                <input
                  type="text"
                  value={editTip}
                  onChange={(e) => setEditTip(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Tags */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arrays, Two Pointer, In-Place"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Enable / Disable State Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <input
                  type="checkbox"
                  id="editIsEnabled"
                  checked={editIsEnabled}
                  onChange={(e) => setEditIsEnabled(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
                <label htmlFor="editIsEnabled" style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>
                  Item is Active (Include in revision sessions)
                </label>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
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
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CREATE NEW REVISION ITEM MODAL */}
      {/* ========================================================================= */}
      {showAddModal && (
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
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Add Personal Revision Item
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ color: 'var(--text-muted)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Topic Selector */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Topic Assignment *
                </label>
                <select
                  value={newItemTopicId}
                  onChange={(e) => setNewItemTopicId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '13px',
                  }}
                >
                  {topics.map((t) => {
                    const sub = subjects.find((s) => s.id === t.subjectId);
                    return (
                      <option key={t.id} value={t.id}>
                        {sub ? `${sub.title} → ` : ''}{t.title}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Item Type & Difficulty */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Revision Type *
                  </label>
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value as RevisionItemType)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontSize: '13px',
                    }}
                  >
                    <option value="FLASHCARD">Flashcard</option>
                    <option value="CONCEPT">Concept Question</option>
                    <option value="LOGIC">Logic Question</option>
                    <option value="WHY">Why Question</option>
                    <option value="CODE_RECALL">Code Recall</option>
                    <option value="CODE_EXPLANATION">Code Explanation</option>
                    <option value="TIP">Sensai Tip</option>
                  </select>
                </div>

                {(newItemType === 'CODE_RECALL' || newItemType === 'CODE_EXPLANATION') && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Difficulty Level
                    </label>
                    <select
                      value={newItemDifficulty}
                      onChange={(e) => setNewItemDifficulty(e.target.value as CodeRecallDifficulty)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontSize: '13px',
                      }}
                    >
                      <option value="LEVEL_1">Level 1: Token Blanks</option>
                      <option value="LEVEL_2">Level 2: Multi-line Blanks</option>
                      <option value="LEVEL_3">Level 3: Function Skeleton</option>
                      <option value="LEVEL_4">Level 4: Scratch Code</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Title / Concept Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. In-Place Duplicate Removal"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Front */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Front Prompt / Question *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="What is the logic or question prompt?"
                  value={newItemFront}
                  onChange={(e) => setNewItemFront(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Back */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Back Solution / Answer & Explanation *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="The optimal answer, reasoning, or solution..."
                  value={newItemBack}
                  onChange={(e) => setNewItemBack(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Code Snippet */}
              {(newItemType === 'CODE_RECALL' || newItemType === 'CODE_EXPLANATION') && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Code Snippet (with ___BLANK_1___ tokens for blanks)
                  </label>
                  <textarea
                    rows={4}
                    placeholder={`public int binarySearch(...) {\n    int mid = ___BLANK_1___;\n}`}
                    value={newItemCode}
                    onChange={(e) => setNewItemCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--code-bg)',
                      border: '1px solid var(--code-border)',
                      color: 'var(--code-text)',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                    }}
                  />
                </div>
              )}

              {/* Tip */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Sensai Tip / Rule of Thumb (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. In sorted arrays, two-pointer gives O(n) time and O(1) space."
                  value={newItemTip}
                  onChange={(e) => setNewItemTip(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Tags */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arrays, Two Pointer, In-Place"
                  value={newItemTags}
                  onChange={(e) => setNewItemTags(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
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
                  }}
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. KAIZENDSA REPOSITORY IMPORTER MODAL */}
      {/* ========================================================================= */}
      <KaizenDsaImportModal
        isOpen={showImportDsaModal}
        onClose={() => setShowImportDsaModal(false)}
        onImportComplete={() => {
          loadItems();
          if (onRefreshData) onRefreshData();
        }}
      />

      {/* ========================================================================= */}
      {/* 9. MOSH COURSE IMPORTER MODAL */}
      {/* ========================================================================= */}
      <MoshCourseImportModal
        isOpen={showImportMoshModal}
        onClose={() => setShowImportMoshModal(false)}
        onImportComplete={() => {
          if (onRefreshData) onRefreshData();
        }}
      />
    </div>
  );
};
