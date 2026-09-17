import Dexie, { Table } from 'dexie';
import {
  Subject,
  Topic,
  Subtopic,
  RevisionItem,
  CodingProblem,
  MoshCourse,
  MoshVideo,
  MoshResource,
  ReviewSchedule,
  Attempt,
  MistakeLog,
  SessionLog,
  SyncEvent,
} from '../core/types';

export class DearSensaiDatabase extends Dexie {
  subjects!: Table<Subject, string>;
  topics!: Table<Topic, string>;
  subtopics!: Table<Subtopic, string>;
  revisionItems!: Table<RevisionItem, string>;
  codingProblems!: Table<CodingProblem, string>;
  moshCourses!: Table<MoshCourse, string>;
  moshVideos!: Table<MoshVideo, string>;
  moshResources!: Table<MoshResource, string>;
  reviewSchedules!: Table<ReviewSchedule, string>;
  attempts!: Table<Attempt, string>;
  mistakes!: Table<MistakeLog, string>;
  sessionLogs!: Table<SessionLog, string>;
  syncQueue!: Table<SyncEvent, string>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('DearSensaiDB');

    this.version(1).stores({
      subjects: 'id, title, orderIndex, updatedAt',
      topics: 'id, subjectId, title, orderIndex, updatedAt',
      subtopics: 'id, topicId, orderIndex, updatedAt',
      revisionItems: 'id, topicId, subtopicId, type, difficulty, isWeak, isEnabled, updatedAt',
      codingProblems: 'id, sourceType, sourceRepo, filePath, normalizedPath, topicId, subjectId, updatedAt',
      moshCourses: 'id, title, folderName, updatedAt',
      moshVideos: 'id, courseId, courseName, sectionName, relativePath, updatedAt',
      moshResources: 'id, courseId, courseName, resourceType, relativePath, updatedAt',
      reviewSchedules: 'id, revisionItemId, state, nextReviewDate, updatedAt',
      attempts: 'id, revisionItemId, sessionId, rating, timestamp',
      mistakes: 'id, revisionItemId, topicId, subjectId, resolved, lastFailedAt',
      sessionLogs: 'id, mode, startTime, endTime',
      syncQueue: 'id, entityType, entityId, action, synced, clientTimestamp',
      settings: 'key',
    });
  }
}

export const db = new DearSensaiDatabase();
