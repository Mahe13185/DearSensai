import { MoshCourse, MoshVideo, MoshResource } from '../types';
import { moshRepo } from '../../storage/repositories';
import { ScannedMoshVideo, ScannedMoshResource } from './moshCourseScanner';

export interface MoshImportOptions {
  courseName: string;
  existingAction: 'SKIP' | 'UPDATE';
}

export interface MoshImportResult {
  success: boolean;
  courseTitle: string;
  courseId: string;
  importedVideos: number;
  updatedVideos: number;
  skippedVideos: number;
  importedResources: number;
  updatedResources: number;
  skippedResources: number;
  errors: string[];
}

/**
 * Execute the import of selected Mosh videos and resource PDFs into Dexie metadata tables.
 */
export async function executeMoshCourseImport(
  selectedVideos: ScannedMoshVideo[],
  selectedResources: ScannedMoshResource[],
  options: MoshImportOptions
): Promise<MoshImportResult> {
  const courseTitle = options.courseName.trim() || 'Mosh Spring Boot Course';
  const courseId = `course_mosh_${courseTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const errors: string[] = [];

  let importedVideos = 0;
  let updatedVideos = 0;
  let skippedVideos = 0;
  let importedResources = 0;
  let updatedResources = 0;
  let skippedResources = 0;

  try {
    // 1. Gather all sections
    const sectionSet = new Set<string>();
    selectedVideos.forEach((v) => sectionSet.add(v.sectionName));
    selectedResources.forEach((r) => sectionSet.add(r.sectionName));
    const sectionNames = Array.from(sectionSet);

    // 2. Fetch or create Course record
    const existingCourse = await moshRepo.getCourseById(courseId);
    const now = Date.now();

    const courseRecord: MoshCourse = {
      id: courseId,
      title: courseTitle,
      folderName: courseTitle,
      sectionNames,
      totalVideos: selectedVideos.length,
      totalResources: selectedResources.length,
      importedAt: existingCourse ? existingCourse.importedAt : now,
      updatedAt: now,
    };
    await moshRepo.saveCourse(courseRecord);

    // 3. Process Videos (Metadata only, no video binaries)
    for (const video of selectedVideos) {
      try {
        if (video.status === 'EXISTING') {
          if (options.existingAction === 'SKIP') {
            skippedVideos++;
            continue;
          }

          if (video.existingRecord) {
            await moshRepo.updateVideo({
              ...video.existingRecord,
              courseName: courseTitle,
              sectionName: video.sectionName,
              title: video.title,
              fileSize: video.fileSize,
              fileType: video.fileType,
              updatedAt: now,
            });
            updatedVideos++;
          }
        } else {
          // NEW VIDEO
          const videoRecord: MoshVideo = {
            id: video.id || `mosh_vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            sourceType: 'MOSH',
            courseName: courseTitle,
            courseId,
            sectionName: video.sectionName,
            title: video.title,
            originalFileName: video.originalFileName,
            relativePath: video.relativePath,
            fileType: video.fileType,
            fileSize: video.fileSize,
            importedAt: now,
            updatedAt: now,
            enabled: true,
          };
          await moshRepo.saveVideo(videoRecord);
          importedVideos++;
        }
      } catch (vErr: any) {
        errors.push(`Error importing video ${video.originalFileName}: ${vErr.message}`);
      }
    }

    // 4. Process Resource PDFs (Classified strictly as EXERCISE)
    for (const res of selectedResources) {
      try {
        if (res.status === 'EXISTING') {
          if (options.existingAction === 'SKIP') {
            skippedResources++;
            continue;
          }

          if (res.existingRecord) {
            await moshRepo.updateResource({
              ...res.existingRecord,
              courseName: courseTitle,
              sectionName: res.sectionName,
              title: res.title,
              fileSize: res.fileSize,
              updatedAt: now,
            });
            updatedResources++;
          }
        } else {
          // NEW RESOURCE PDF
          const resourceRecord: MoshResource = {
            id: res.id || `mosh_res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            sourceType: 'MOSH',
            courseName: courseTitle,
            courseId,
            sectionName: res.sectionName,
            resourceType: 'EXERCISE',
            title: res.title,
            originalFileName: res.originalFileName,
            relativePath: res.relativePath,
            fileSize: res.fileSize,
            importedAt: now,
            updatedAt: now,
          };
          await moshRepo.saveResource(resourceRecord);
          importedResources++;
        }
      } catch (rErr: any) {
        errors.push(`Error importing resource ${res.originalFileName}: ${rErr.message}`);
      }
    }

    return {
      success: errors.length === 0,
      courseTitle,
      courseId,
      importedVideos,
      updatedVideos,
      skippedVideos,
      importedResources,
      updatedResources,
      skippedResources,
      errors,
    };
  } catch (err: any) {
    return {
      success: false,
      courseTitle,
      courseId,
      importedVideos,
      updatedVideos,
      skippedVideos,
      importedResources,
      updatedResources,
      skippedResources,
      errors: [err.message || 'Failed to import Mosh course'],
    };
  }
}
