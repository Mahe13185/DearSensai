import { db } from '../db';
import {
  Subject,
  Topic,
  RevisionItem,
  CodingProblem,
  MoshCourse,
  MoshVideo,
  MoshResource,
  ReviewSchedule,
  Attempt,
  MistakeLog,
  SessionLog,
  Rating,
  SessionConfig,
  SyncEvent,
} from '../../core/types';
import { calculateNextSchedule, createInitialSchedule } from '../../core/scheduler/srs';

// --- OUTBOX QUEUE HELPER ---
async function queueSyncEvent(
  entityType: SyncEvent['entityType'],
  entityId: string,
  action: SyncEvent['action'],
  payload: any
) {
  const event: SyncEvent = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    entityType,
    entityId,
    action,
    payload,
    clientTimestamp: Date.now(),
    synced: false,
  };
  await db.syncQueue.put(event);
}

// --- SUBJECT REPOSITORY ---
export const subjectRepo = {
  async getAll(): Promise<Subject[]> {
    return await db.subjects.orderBy('orderIndex').toArray();
  },

  async getById(id: string): Promise<Subject | undefined> {
    return await db.subjects.get(id);
  },

  async create(subject: Omit<Subject, 'createdAt' | 'updatedAt'>): Promise<Subject> {
    const fullSubject: Subject = {
      ...subject,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.subjects.put(fullSubject);
    await queueSyncEvent('SUBJECT', fullSubject.id, 'CREATE', fullSubject);
    return fullSubject;
  },

  async update(subject: Subject): Promise<void> {
    const updated = { ...subject, updatedAt: Date.now() };
    await db.subjects.put(updated);
    await queueSyncEvent('SUBJECT', updated.id, 'UPDATE', updated);
  },

  async delete(subjectId: string): Promise<void> {
    // Delete all topics and items under this subject
    const topics = await db.topics.where('subjectId').equals(subjectId).toArray();
    for (const topic of topics) {
      await topicRepo.delete(topic.id);
    }
    await db.subjects.delete(subjectId);
    await queueSyncEvent('SUBJECT', subjectId, 'DELETE', { id: subjectId });
  },
};

// --- TOPIC REPOSITORY ---
export const topicRepo = {
  async getBySubject(subjectId: string): Promise<Topic[]> {
    return await db.topics.where('subjectId').equals(subjectId).sortBy('orderIndex');
  },

  async getAll(): Promise<Topic[]> {
    return await db.topics.orderBy('orderIndex').toArray();
  },

  async getById(id: string): Promise<Topic | undefined> {
    return await db.topics.get(id);
  },

  async create(topic: Omit<Topic, 'updatedAt'>): Promise<Topic> {
    const fullTopic: Topic = {
      ...topic,
      updatedAt: Date.now(),
    };
    await db.topics.put(fullTopic);
    await queueSyncEvent('TOPIC', fullTopic.id, 'CREATE', fullTopic);
    return fullTopic;
  },

  async update(topic: Topic): Promise<void> {
    const updated = { ...topic, updatedAt: Date.now() };
    await db.topics.put(updated);
    await queueSyncEvent('TOPIC', updated.id, 'UPDATE', updated);
  },

  async delete(topicId: string): Promise<void> {
    // Delete all items under this topic
    const items = await db.revisionItems.where('topicId').equals(topicId).toArray();
    for (const item of items) {
      await revisionItemRepo.delete(item.id);
    }
    await db.topics.delete(topicId);
    await queueSyncEvent('TOPIC', topicId, 'DELETE', { id: topicId });
  },
};

// --- REVISION ITEM REPOSITORY ---
export const revisionItemRepo = {
  async getAll(): Promise<RevisionItem[]> {
    return await db.revisionItems.toArray();
  },

  async getAllActive(): Promise<RevisionItem[]> {
    return await db.revisionItems.filter((item) => item.isEnabled !== false).toArray();
  },

  async getByTopic(topicId: string): Promise<RevisionItem[]> {
    return await db.revisionItems.where('topicId').equals(topicId).toArray();
  },

  async getById(id: string): Promise<RevisionItem | undefined> {
    return await db.revisionItems.get(id);
  },

  async search(query: string): Promise<RevisionItem[]> {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return await db.revisionItems
      .filter(
        (item) =>
          Boolean(
            item.title.toLowerCase().includes(q) ||
            item.frontContent.toLowerCase().includes(q) ||
            item.backContent.toLowerCase().includes(q) ||
            (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
          )
      )
      .toArray();
  },

  async create(item: Omit<RevisionItem, 'createdAt' | 'updatedAt'>): Promise<RevisionItem> {
    const fullItem: RevisionItem = {
      ...item,
      isEnabled: item.isEnabled !== false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.revisionItems.put(fullItem);
    
    // Auto-create initial schedule
    const initialSchedule = createInitialSchedule(fullItem.id);
    await db.reviewSchedules.put(initialSchedule);

    await queueSyncEvent('REVISION_ITEM', fullItem.id, 'CREATE', fullItem);
    await queueSyncEvent('SCHEDULE', initialSchedule.id, 'CREATE', initialSchedule);
    return fullItem;
  },

  async update(item: RevisionItem): Promise<void> {
    const updated: RevisionItem = {
      ...item,
      isEnabled: item.isEnabled !== false,
      updatedAt: Date.now(),
    };
    await db.revisionItems.put(updated);
    await queueSyncEvent('REVISION_ITEM', updated.id, 'UPDATE', updated);
  },

  async toggleEnabled(id: string, isEnabled: boolean): Promise<void> {
    const item = await db.revisionItems.get(id);
    if (item) {
      item.isEnabled = isEnabled;
      item.updatedAt = Date.now();
      await db.revisionItems.put(item);
      await queueSyncEvent('REVISION_ITEM', item.id, 'UPDATE', item);
    }
  },

  async delete(id: string): Promise<void> {
    await db.revisionItems.delete(id);
    await db.reviewSchedules.delete(id);
    await db.mistakes.where('revisionItemId').equals(id).delete();
    await queueSyncEvent('REVISION_ITEM', id, 'DELETE', { id });
  },

  // --- DETERMINISTIC REVISION ITEM SELECTOR ---
  // Prioritizes: 1. Due items, 2. Weak items, 3. New items, 4. Other items
  async selectRevisionItems(config: SessionConfig): Promise<RevisionItem[]> {
    const now = Date.now();
    let pool = await db.revisionItems.filter((i) => i.isEnabled !== false).toArray();

    // Filter by topic if specified
    if (config.topicId) {
      pool = pool.filter((i) => i.topicId === config.topicId);
    } else if (config.subjectId) {
      const subjectTopics = await db.topics.where('subjectId').equals(config.subjectId).toArray();
      const topicIds = new Set(subjectTopics.map((t) => t.id));
      pool = pool.filter((i) => topicIds.has(i.topicId));
    }

    // Filter by code mode if specified
    if (config.mode === 'CODE_MODE') {
      pool = pool.filter((i) => i.type === 'CODE_RECALL' || i.type === 'CODE_EXPLANATION' || Boolean(i.codeSnippet));
    }

    if (pool.length === 0) return [];

    const itemMap = new Map(pool.map((i) => [i.id, i]));
    const itemIds = pool.map((i) => i.id);

    // 1. Fetch schedules for candidate items
    const schedules = await db.reviewSchedules.where('id').anyOf(itemIds).toArray();
    const schedMap = new Map(schedules.map((s) => [s.revisionItemId, s]));

    // 2. Fetch unresolved mistakes
    const activeMistakes = await db.mistakes
      .where('resolved')
      .equals(0 as any)
      .toArray();
    const mistakeItemIds = new Set(activeMistakes.map((m) => m.revisionItemId));

    // Categorize
    const dueItems: RevisionItem[] = [];
    const weakItems: RevisionItem[] = [];
    const newItems: RevisionItem[] = [];
    const otherItems: RevisionItem[] = [];

    for (const item of pool) {
      const sched = schedMap.get(item.id);
      const isDue = sched && sched.nextReviewDate <= now;
      const isWeak = mistakeItemIds.has(item.id) || Boolean(item.isWeak) || (sched && sched.lapses > 0);
      const isNew = !sched || sched.reps === 0 || sched.state === 'NEW';

      if (isDue) {
        dueItems.push(item);
      } else if (isWeak) {
        weakItems.push(item);
      } else if (isNew) {
        newItems.push(item);
      } else {
        otherItems.push(item);
      }
    }

    // Determine target count
    let targetLimit = config.limit;
    if (!targetLimit) {
      switch (config.mode) {
        case 'QUICK_5M':
          targetLimit = 6;
          break;
        case 'BUS_10M':
          targetLimit = 10;
          break;
        case 'BUS_15M':
          targetLimit = 15;
          break;
        case 'DEEP_30M':
          targetLimit = 25;
          break;
        case 'WEAK_TOPICS':
          targetLimit = 20;
          break;
        case 'DUE_TODAY':
          targetLimit = 30;
          break;
        default:
          targetLimit = 15;
      }
    }

    if (config.mode === 'WEAK_TOPICS') {
      const result = [...weakItems, ...dueItems, ...otherItems];
      return result.slice(0, targetLimit);
    }

    if (config.mode === 'DUE_TODAY') {
      const result = [...dueItems, ...weakItems, ...newItems, ...otherItems];
      return result.slice(0, targetLimit);
    }

    // Combined prioritized order: Due -> Weak -> New -> Other
    const combined = [...dueItems, ...weakItems, ...newItems, ...otherItems];
    // Deduplicate preserving order
    const seen = new Set<string>();
    const deduplicated: RevisionItem[] = [];
    for (const item of combined) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        deduplicated.push(item);
      }
    }

    return deduplicated.slice(0, targetLimit);
  },
};

export const reviewRepo = {
  async getSchedule(revisionItemId: string): Promise<ReviewSchedule> {
    let schedule = await db.reviewSchedules.get(revisionItemId);
    if (!schedule) {
      schedule = createInitialSchedule(revisionItemId);
      await db.reviewSchedules.put(schedule);
    }
    return schedule;
  },

  async saveSchedule(schedule: ReviewSchedule): Promise<void> {
    await db.reviewSchedules.put(schedule);
    await queueSyncEvent('SCHEDULE', schedule.id, 'CREATE', schedule);
  },

  async recordAttempt(
    revisionItemId: string,
    rating: Rating,
    timeSpentMs: number,
    sessionId?: string
  ): Promise<{ schedule: ReviewSchedule; isLapse: boolean }> {
    const currentSchedule = await this.getSchedule(revisionItemId);
    const { schedule: nextSchedule, isLapse } = calculateNextSchedule(currentSchedule, rating);

    // Save schedule update
    await db.reviewSchedules.put(nextSchedule);
    await queueSyncEvent('SCHEDULE', nextSchedule.id, 'UPDATE', nextSchedule);

    // Save attempt log
    const attempt: Attempt = {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sessionId,
      revisionItemId,
      rating,
      timeSpentMs,
      isCorrect: rating !== 'AGAIN',
      timestamp: Date.now(),
    };
    await db.attempts.put(attempt);
    await queueSyncEvent('ATTEMPT', attempt.id, 'CREATE', attempt);

    // If item was failed/hard, record or update mistakes vault
    if (rating === 'AGAIN' || rating === 'HARD') {
      const item = await db.revisionItems.get(revisionItemId);
      if (item) {
        const topic = await db.topics.get(item.topicId);
        const existingMistake = await db.mistakes
          .where('revisionItemId')
          .equals(revisionItemId)
          .first();

        if (existingMistake) {
          existingMistake.failCount += 1;
          existingMistake.lastFailedAt = Date.now();
          existingMistake.resolved = false;
          await db.mistakes.put(existingMistake);
          await queueSyncEvent('MISTAKE', existingMistake.id, 'UPDATE', existingMistake);
        } else {
          const mistake: MistakeLog = {
            id: `mst_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            revisionItemId,
            topicId: item.topicId,
            subjectId: topic?.subjectId || 'sub_dsa',
            failCount: 1,
            lastFailedAt: Date.now(),
            resolved: false,
          };
          await db.mistakes.put(mistake);
          await queueSyncEvent('MISTAKE', mistake.id, 'CREATE', mistake);
        }
      }
    }

    return { schedule: nextSchedule, isLapse };
  },

  async logSession(log: SessionLog): Promise<void> {
    await db.sessionLogs.put(log);
  },

  async getRecentSessionLogs(limit: number = 20): Promise<SessionLog[]> {
    return await db.sessionLogs.orderBy('startTime').reverse().limit(limit).toArray();
  },

  async getRecentAttempts(limit: number = 100): Promise<Attempt[]> {
    return await db.attempts.orderBy('timestamp').reverse().limit(limit).toArray();
  },

  async getMistakes(): Promise<MistakeLog[]> {
    return await db.mistakes.where('resolved').equals(0 as any).reverse().sortBy('lastFailedAt');
  },

  async resolveMistake(id: string): Promise<void> {
    const mistake = await db.mistakes.get(id);
    if (mistake) {
      mistake.resolved = true;
      await db.mistakes.put(mistake);
      await queueSyncEvent('MISTAKE', mistake.id, 'UPDATE', mistake);
    }
  },

  async getStats() {
    const totalItems = await db.revisionItems.filter((i) => i.isEnabled !== false).count();
    const now = Date.now();
    const dueCount = await db.reviewSchedules
      .where('nextReviewDate')
      .belowOrEqual(now)
      .count();
    
    const attempts = await db.attempts.toArray();
    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter((a) => a.isCorrect).length;
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100;

    // Today's attempts
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayReviewedCount = attempts.filter((a) => a.timestamp >= startOfToday.getTime()).length;

    const mistakesCount = await db.mistakes
      .where('resolved')
      .equals(0 as any)
      .count();

    // Calculate streak
    const attemptsByDay = new Set(
      attempts.map((a) => new Date(a.timestamp).toISOString().split('T')[0])
    );
    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (attemptsByDay.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (streak === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterdayStr = checkDate.toISOString().split('T')[0];
          if (attemptsByDay.has(yesterdayStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    return {
      totalItems,
      dueCount,
      todayReviewedCount,
      totalAttempts,
      accuracy,
      mistakesCount,
      streak: Math.max(1, streak),
    };
  },
};

// --- CODING PROBLEMS (KAIZEN DSA) REPOSITORY ---
export const codingProblemRepo = {
  async getAll(): Promise<CodingProblem[]> {
    return await db.codingProblems.toArray();
  },

  async getById(id: string): Promise<CodingProblem | undefined> {
    return await db.codingProblems.get(id);
  },

  async getByFilePath(filePath: string): Promise<CodingProblem | undefined> {
    return await db.codingProblems.where('filePath').equals(filePath).first();
  },

  async getByTopic(topicId: string): Promise<CodingProblem[]> {
    return await db.codingProblems.where('topicId').equals(topicId).toArray();
  },

  async create(problem: Omit<CodingProblem, 'importedAt' | 'updatedAt'>): Promise<CodingProblem> {
    const fullProblem: CodingProblem = {
      ...problem,
      importedAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.codingProblems.put(fullProblem);
    await queueSyncEvent('CODING_PROBLEM', fullProblem.id, 'CREATE', fullProblem);
    return fullProblem;
  },

  async update(problem: CodingProblem): Promise<void> {
    const updated = { ...problem, updatedAt: Date.now() };
    await db.codingProblems.put(updated);
    await queueSyncEvent('CODING_PROBLEM', updated.id, 'UPDATE', updated);
  },

  async delete(id: string): Promise<void> {
    await db.codingProblems.delete(id);
    await queueSyncEvent('CODING_PROBLEM', id, 'DELETE', { id });
  },

  async bulkPut(problems: CodingProblem[]): Promise<void> {
    await db.codingProblems.bulkPut(problems);
  },
};

// --- MOSH COURSES REPOSITORY ---
export const moshRepo = {
  async getCourses(): Promise<MoshCourse[]> {
    return await db.moshCourses.orderBy('updatedAt').reverse().toArray();
  },

  async getCourseById(id: string): Promise<MoshCourse | undefined> {
    return await db.moshCourses.get(id);
  },

  async getCourseByTitle(title: string): Promise<MoshCourse | undefined> {
    return await db.moshCourses.where('title').equals(title).first();
  },

  async saveCourse(course: MoshCourse): Promise<void> {
    await db.moshCourses.put(course);
    await queueSyncEvent('MOSH_COURSE', course.id, 'CREATE', course);
  },

  async getVideosByCourse(courseId: string): Promise<MoshVideo[]> {
    return await db.moshVideos.where('courseId').equals(courseId).toArray();
  },

  async getVideosByCourseName(courseName: string): Promise<MoshVideo[]> {
    return await db.moshVideos.where('courseName').equals(courseName).toArray();
  },

  async saveVideo(video: MoshVideo): Promise<void> {
    await db.moshVideos.put(video);
    await queueSyncEvent('MOSH_VIDEO', video.id, 'CREATE', video);
  },

  async updateVideo(video: MoshVideo): Promise<void> {
    const updated = { ...video, updatedAt: Date.now() };
    await db.moshVideos.put(updated);
    await queueSyncEvent('MOSH_VIDEO', updated.id, 'UPDATE', updated);
  },

  async getResourcesByCourse(courseId: string): Promise<MoshResource[]> {
    return await db.moshResources.where('courseId').equals(courseId).toArray();
  },

  async getResourcesByCourseName(courseName: string): Promise<MoshResource[]> {
    return await db.moshResources.where('courseName').equals(courseName).toArray();
  },

  async saveResource(resource: MoshResource): Promise<void> {
    await db.moshResources.put(resource);
    await queueSyncEvent('MOSH_RESOURCE', resource.id, 'CREATE', resource);
  },

  async updateResource(resource: MoshResource): Promise<void> {
    const updated = { ...resource, updatedAt: Date.now() };
    await db.moshResources.put(updated);
    await queueSyncEvent('MOSH_RESOURCE', updated.id, 'UPDATE', updated);
  },

  async deleteCourse(courseId: string): Promise<void> {
    await db.moshVideos.where('courseId').equals(courseId).delete();
    await db.moshResources.where('courseId').equals(courseId).delete();
    await db.moshCourses.delete(courseId);
    await queueSyncEvent('MOSH_COURSE', courseId, 'DELETE', { id: courseId });
  },
};

// --- DATA BACKUP & PORTABILITY REPOSITORY ---
export const backupRepo = {
  async exportFullDataJSON(): Promise<string> {
    const subjects = await db.subjects.toArray();
    const topics = await db.topics.toArray();
    const subtopics = await db.subtopics.toArray();
    const revisionItems = await db.revisionItems.toArray();
    const codingProblems = await db.codingProblems.toArray();
    const moshCourses = await db.moshCourses.toArray();
    const moshVideos = await db.moshVideos.toArray();
    const moshResources = await db.moshResources.toArray();
    const reviewSchedules = await db.reviewSchedules.toArray();
    const attempts = await db.attempts.toArray();
    const mistakes = await db.mistakes.toArray();
    const sessionLogs = await db.sessionLogs.toArray();

    const backup = {
      app: 'DEARSENSAI',
      version: '1.3.0',
      exportedAt: new Date().toISOString(),
      metadata: {
        totalSubjects: subjects.length,
        totalTopics: topics.length,
        totalItems: revisionItems.length,
        totalCodingProblems: codingProblems.length,
        totalMoshCourses: moshCourses.length,
        totalMoshVideos: moshVideos.length,
        totalMoshResources: moshResources.length,
        totalAttempts: attempts.length,
      },
      data: {
        subjects,
        topics,
        subtopics,
        revisionItems,
        codingProblems,
        moshCourses,
        moshVideos,
        moshResources,
        reviewSchedules,
        attempts,
        mistakes,
        sessionLogs,
      },
    };

    return JSON.stringify(backup, null, 2);
  },

  async importDataJSON(jsonString: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data) {
        return { success: false, count: 0, error: 'Invalid DearSensai backup format' };
      }

      const { data } = parsed;
      if (data.subjects) await db.subjects.bulkPut(data.subjects);
      if (data.topics) await db.topics.bulkPut(data.topics);
      if (data.subtopics) await db.subtopics.bulkPut(data.subtopics);
      if (data.revisionItems) await db.revisionItems.bulkPut(data.revisionItems);
      if (data.codingProblems) await db.codingProblems.bulkPut(data.codingProblems);
      if (data.moshCourses) await db.moshCourses.bulkPut(data.moshCourses);
      if (data.moshVideos) await db.moshVideos.bulkPut(data.moshVideos);
      if (data.moshResources) await db.moshResources.bulkPut(data.moshResources);
      if (data.reviewSchedules) await db.reviewSchedules.bulkPut(data.reviewSchedules);
      if (data.attempts) await db.attempts.bulkPut(data.attempts);
      if (data.mistakes) await db.mistakes.bulkPut(data.mistakes);
      if (data.sessionLogs) await db.sessionLogs.bulkPut(data.sessionLogs);

      const totalItems = (data.revisionItems || []).length;
      return { success: true, count: totalItems };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message || 'Failed to parse JSON' };
    }
  },
};
