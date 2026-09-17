declare const process: any;

import { KnowledgeDraft, RevisionItem } from '../core/types';
import { db } from '../storage/db';
import { knowledgeDraftRepo, revisionItemRepo, moshRepo, backupRepo } from '../storage/repositories';

async function runDraftContractVerification() {
  console.log('=== VERIFYING KNOWLEDGE EXTRACTION CONTRACT & DRAFT LIFECYCLE ===\n');
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
    const testVideoId = 'mosh_vid_test_ioc_101';
    const testCourseId = 'course_spring_boot_mastering';

    // 1. Create a simulated KnowledgeDraft
    const draftConcept: KnowledgeDraft = {
      id: `draft_concept_${Date.now()}`,
      moshVideoId: testVideoId,
      courseId: testCourseId,
      courseName: 'Spring Boot Mastering the Fundamentals',
      sectionName: '3. Dependency Injection',
      lessonTitle: '01. What is Inversion of Control',
      type: 'CONCEPT',
      title: 'Inversion of Control (IoC)',
      question: 'What is Inversion of Control in Spring?',
      answer: 'IoC is an architectural design principle where the control of object creation and lifecycle is inverted from the application code to an external container/framework.',
      explanation: 'Instead of classes instantiating dependencies with new, the container injects them at runtime.',
      sourceMetadata: {
        sourceType: 'MOSH',
        courseId: testCourseId,
        videoId: testVideoId,
        filePath: '3. Dependency Injection/01. What is Inversion of Control.mp4',
      },
      status: 'DRAFT',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const draftRecall: KnowledgeDraft = {
      id: `draft_recall_${Date.now()}`,
      moshVideoId: testVideoId,
      courseId: testCourseId,
      courseName: 'Spring Boot Mastering the Fundamentals',
      sectionName: '3. Dependency Injection',
      lessonTitle: '01. What is Inversion of Control',
      type: 'FLASHCARD',
      title: 'Spring Bean Definition',
      question: 'What is a Spring Bean?',
      answer: 'An object that is instantiated, assembled, and managed by the Spring IoC container.',
      sourceMetadata: {
        sourceType: 'MOSH',
        courseId: testCourseId,
        videoId: testVideoId,
      },
      status: 'DRAFT',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const draftMistake: KnowledgeDraft = {
      id: `draft_mistake_${Date.now()}`,
      moshVideoId: testVideoId,
      courseId: testCourseId,
      courseName: 'Spring Boot Mastering the Fundamentals',
      sectionName: '3. Dependency Injection',
      lessonTitle: '01. What is Inversion of Control',
      type: 'MISTAKE',
      title: 'Field Injection Trap',
      question: 'Why should Field Injection with @Autowired on private fields be avoided?',
      answer: 'Field injection hides dependencies, prevents immutability (cannot make fields final), and makes unit testing difficult without reflection.',
      sourceMetadata: {
        sourceType: 'MOSH',
        courseId: testCourseId,
        videoId: testVideoId,
      },
      status: 'DRAFT',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Save drafts
    await knowledgeDraftRepo.saveDrafts([draftConcept, draftRecall, draftMistake]);
    console.log('1. Saved 3 KnowledgeDraft items to IndexedDB.');

    // Query drafts
    const loadedDrafts = await knowledgeDraftRepo.getDraftsByVideo(testVideoId);
    assert(loadedDrafts.length === 3, 'Retrieved all 3 drafts for test lesson');

    // 2. Test Editing Draft
    const toEdit = loadedDrafts.find((d) => d.id === draftConcept.id)!;
    toEdit.title = 'Inversion of Control (IoC Core Principle)';
    toEdit.answer = 'Updated answer: IoC delegates component lifecycle to Spring IoC container.';
    await knowledgeDraftRepo.updateDraft(toEdit);

    const updated = await knowledgeDraftRepo.getDraftById(draftConcept.id);
    assert(
      updated?.title === 'Inversion of Control (IoC Core Principle)',
      'Draft edit persisted in IndexedDB'
    );
    assert(
      updated?.status === 'DRAFT',
      'Edited draft remains in DRAFT status'
    );

    // 3. Test Rejection Lifecycle
    await knowledgeDraftRepo.rejectDraft(draftRecall.id);
    const rejected = await knowledgeDraftRepo.getDraftById(draftRecall.id);
    assert(rejected?.status === 'REJECTED', 'Rejection sets draft status to REJECTED');

    // Verify rejection created NO RevisionItem
    const allItemsAfterReject = await revisionItemRepo.getAll();
    const leakedReject = allItemsAfterReject.find((i) => i.title === 'Spring Bean Definition');
    assert(!leakedReject, 'Rejected draft was NOT added to Revision Items');

    // 4. Test Approval Lifecycle
    const approvalResult = await knowledgeDraftRepo.approveDraft(draftConcept.id);
    assert(approvalResult.draft.status === 'APPROVED', 'Approval sets draft status to APPROVED');
    assert(Boolean(approvalResult.draft.approvedItemId), 'Approved draft records approvedItemId');
    assert(Boolean(approvalResult.revisionItem.id), 'Approval creates active RevisionItem');
    assert(
      approvalResult.revisionItem.sourceMetadata?.sourceType === 'MOSH',
      'Created RevisionItem has sourceType = MOSH'
    );
    assert(
      approvalResult.revisionItem.sourceMetadata?.courseId === testCourseId,
      'Created RevisionItem preserves exact courseId provenance'
    );
    assert(
      approvalResult.revisionItem.sourceMetadata?.videoId === testVideoId,
      'Created RevisionItem preserves exact videoId provenance'
    );

    // Verify RevisionItem exists in active revision repo
    const activeItem = await revisionItemRepo.getById(approvalResult.revisionItem.id);
    assert(Boolean(activeItem), 'Approved item is queryable in revisionItemRepo');

    // 5. Test JSON Backup includes drafts
    const backupJson = await backupRepo.exportFullDataJSON();
    const parsedBackup = JSON.parse(backupJson);
    assert(
      Array.isArray(parsedBackup.data.knowledgeDrafts) &&
        parsedBackup.data.knowledgeDrafts.length >= 3,
      'JSON Backup export includes knowledgeDrafts array'
    );

    // 6. Cleanup
    await knowledgeDraftRepo.deleteDraft(draftConcept.id);
    await knowledgeDraftRepo.deleteDraft(draftRecall.id);
    await knowledgeDraftRepo.deleteDraft(draftMistake.id);
    if (approvalResult.revisionItem.id) {
      await revisionItemRepo.delete(approvalResult.revisionItem.id);
    }

    console.log(`\n========================================`);
    console.log(`Summary: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runDraftContractVerification();
