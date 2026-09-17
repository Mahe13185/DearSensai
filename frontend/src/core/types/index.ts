export type SubjectId = string;
export type TopicId = string;
export type SubtopicId = string;
export type RevisionItemId = string;

export interface Subject {
  id: SubjectId;
  title: string;
  icon?: string;
  description: string;
  color?: string;
  orderIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface Topic {
  id: TopicId;
  subjectId: SubjectId;
  title: string;
  description: string;
  icon?: string;
  orderIndex: number;
  totalItems?: number;
  masteredCount?: number;
  updatedAt: number;
}

export interface Subtopic {
  id: SubtopicId;
  topicId: TopicId;
  title: string;
  description?: string;
  orderIndex: number;
  updatedAt: number;
}

export type RevisionItemType =
  | 'FLASHCARD'
  | 'CONCEPT'
  | 'LOGIC'
  | 'WHY'
  | 'CODE_RECALL'
  | 'CODE_EXPLANATION'
  | 'TIP';

export type CodeRecallDifficulty = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';

export interface CodeBlank {
  id: string;
  target: string;
  hint?: string;
  options?: string[]; // Choice options for quick mobile tap
}

export interface SourceMetadata {
  sourceType: 'KAIZEN_DSA' | 'PERSONAL_CODE' | 'MOSH' | 'MANUAL';
  sourceRepo?: string;
  filePath?: string;
  problemId?: string;
  courseId?: string;
  videoId?: string;
  resourceId?: string;
}

export interface CodingProblem {
  id: string;
  sourceType: 'KAIZEN_DSA' | 'PERSONAL_CODE';
  sourceRepo: string;
  filePath: string;
  normalizedPath: string;
  title: string;
  language: 'java' | 'python' | 'cpp' | 'javascript' | 'typescript' | 'other';
  sourceCode: string;
  subjectId: SubjectId;
  topicId: TopicId;
  importedAt: number;
  updatedAt: number;
}

export interface MoshCourse {
  id: string;
  title: string;
  folderName: string;
  sectionNames: string[];
  totalVideos: number;
  totalResources: number;
  importedAt: number;
  updatedAt: number;
}

export interface MoshVideo {
  id: string;
  sourceType: 'MOSH';
  courseName: string;
  courseId: string;
  sectionName: string;
  title: string; // Cleaned display title without number prefixes
  originalFileName: string; // e.g. "12. Introduction to Dependency Injection.mp4"
  relativePath: string; // e.g. "3. Dependency Injection/12. Introduction to Dependency Injection.mp4"
  fileType: 'mp4' | 'webm' | 'mkv' | 'mov' | 'other';
  fileSize: number;
  duration?: number;
  importedAt: number;
  updatedAt: number;
  enabled: boolean;
}

export interface MoshResource {
  id: string;
  sourceType: 'MOSH';
  courseName: string;
  courseId: string;
  sectionName: string;
  resourceType: 'EXERCISE';
  title: string;
  originalFileName: string;
  relativePath: string;
  fileSize: number;
  importedAt: number;
  updatedAt: number;
}

export interface MoshLessonContent {
  id: string; // moshVideoId or composite id
  moshVideoId: string;
  courseId: string;
  courseName: string;
  sectionName: string;
  lessonTitle: string;
  content: string; // Transcript or lecture notes
  notes?: string;
  status: 'RAW' | 'STAGED' | 'EXTRACTED';
  createdAt: number;
  updatedAt: number;
}

export type KnowledgeDraftType =
  | 'CONCEPT'
  | 'FLASHCARD'
  | 'WHY'
  | 'LOGIC'
  | 'CODE_RECALL'
  | 'CODE_EXPLANATION'
  | 'TIP'
  | 'MISTAKE';

export type KnowledgeDraftStatus = 'DRAFT' | 'APPROVED' | 'REJECTED';

export interface KnowledgeDraft {
  id: string; // unique draft identifier
  moshVideoId: string;
  courseId: string;
  courseName: string;
  sectionName: string;
  lessonTitle: string;
  type: KnowledgeDraftType;
  title: string;
  question: string; // prompt / question
  answer: string; // concise answer
  explanation?: string;
  whyExplanation?: string;
  codeSnippet?: string;
  codeLanguage?: string;
  difficulty?: CodeRecallDifficulty;
  sourceMetadata: SourceMetadata;
  status: KnowledgeDraftStatus;
  approvedItemId?: string; // id of created RevisionItem when approved
  createdAt: number;
  updatedAt: number;
}

export interface KnowledgeExtractionResult {
  lessonId: string;
  courseId: string;
  courseName: string;
  sectionName: string;
  lessonTitle: string;
  drafts: KnowledgeDraft[];
  extractedAt: number;
}

export interface RevisionItem {
  id: RevisionItemId;
  topicId: TopicId;
  subtopicId?: SubtopicId;
  type: RevisionItemType;
  title: string;
  frontContent: string;
  backContent: string;
  
  // Code-specific fields
  codeSnippet?: string;
  codeLanguage?: string;
  codeBlanks?: CodeBlank[];
  difficulty?: CodeRecallDifficulty;
  
  // Source provenance
  sourceMetadata?: SourceMetadata;

  // Extra pedagogical fields
  explanation?: string;
  whyExplanation?: string;
  tip?: string;
  tags?: string[];
  isWeak?: boolean;
  isEnabled?: boolean; // If false, item is disabled/paused and excluded from revision sessions
  
  createdAt: number;
  updatedAt: number;
}

export type Rating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export type ScheduleState = 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';

export interface ReviewSchedule {
  id: string; // matches revisionItemId
  revisionItemId: RevisionItemId;
  state: ScheduleState;
  reps: number;
  lapses: number;
  intervalDays: number;
  easeFactor: number; // 1.3 to 3.0 (default 2.5)
  nextReviewDate: number; // epoch ms
  lastReviewDate?: number; // epoch ms
  updatedAt: number;
}

export interface Attempt {
  id: string;
  sessionId?: string;
  revisionItemId: RevisionItemId;
  rating: Rating;
  timeSpentMs: number;
  isCorrect: boolean;
  timestamp: number;
}

export interface MistakeLog {
  id: string;
  revisionItemId: RevisionItemId;
  topicId: TopicId;
  subjectId: SubjectId;
  userConfusionNotes?: string;
  failCount: number;
  lastFailedAt: number;
  resolved: boolean;
}

export type SessionMode =
  | 'QUICK_5M'
  | 'BUS_10M'
  | 'BUS_15M'
  | 'DEEP_30M'
  | 'WEAK_TOPICS'
  | 'DUE_TODAY'
  | 'RANDOM'
  | 'CODE_MODE'
  | 'MIXED'
  | 'INTERVIEW_MODE';

export interface SessionConfig {
  sessionId?: string;
  mode: SessionMode;
  subjectId?: SubjectId;
  topicId?: TopicId;
  limit?: number;
  timeLimitSeconds?: number;
}

export interface SessionStats {
  sessionId?: string;
  totalReviewed: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
  startTime: number;
  endTime?: number;
  mistakesAdded: number;
}

export interface SessionLog {
  id: string;
  mode: SessionMode;
  startTime: number;
  endTime: number;
  totalReviewed: number;
  accuracy: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
}

export interface SyncEvent {
  id: string;
  entityType: 'SUBJECT' | 'TOPIC' | 'SUBTOPIC' | 'REVISION_ITEM' | 'ATTEMPT' | 'SCHEDULE' | 'MISTAKE' | 'CODING_PROBLEM' | 'MOSH_COURSE' | 'MOSH_VIDEO' | 'MOSH_RESOURCE' | 'MOSH_LESSON_CONTENT' | 'KNOWLEDGE_DRAFT';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  clientTimestamp: number;
  synced: boolean;
}
