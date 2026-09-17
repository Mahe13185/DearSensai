import { MoshCourse, MoshVideo, MoshResource } from '../types';

export interface ScannedMoshVideo {
  id: string; // unique hash/key
  courseName: string;
  sectionName: string;
  title: string; // cleaned display title
  originalFileName: string;
  relativePath: string;
  fileType: 'mp4' | 'webm' | 'mkv' | 'mov' | 'other';
  fileSize: number;
  status: 'NEW' | 'EXISTING';
  existingRecord?: MoshVideo;
}

export interface ScannedMoshResource {
  id: string;
  courseName: string;
  sectionName: string;
  resourceType: 'EXERCISE';
  title: string;
  originalFileName: string;
  relativePath: string;
  fileSize: number;
  status: 'NEW' | 'EXISTING';
  existingRecord?: MoshResource;
}

export interface MoshSectionSummary {
  sectionName: string;
  orderIndex: number;
  videos: ScannedMoshVideo[];
  resources: ScannedMoshResource[];
}

export interface MoshScanSummary {
  courseName: string;
  totalSections: number;
  totalVideos: number;
  totalResources: number;
  newCount: number;
  existingCount: number;
  sections: MoshSectionSummary[];
  allVideos: ScannedMoshVideo[];
  allResources: ScannedMoshResource[];
}

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mkv', 'mov']);

/**
 * Remove numbering prefixes ONLY from displayed titles.
 * e.g. "12. Introduction to Dependency Injection.mp4" -> "Introduction to Dependency Injection"
 * "01 - Getting Started.mp4" -> "Getting Started"
 * "1. Welcome.mp4" -> "Welcome"
 */
export function cleanDisplayTitle(fileName: string): string {
  // Strip extension
  let base = fileName.replace(/\.[^/.]+$/, '');

  // Strip leading numbering: e.g. "12. ", "12 - ", "12_ ", "01. ", "1. ", "01-", "1 "
  base = base.replace(/^\d+[\s._-]+/, '');

  // Clean trailing/leading spaces
  return base.trim() || fileName;
}

/**
 * Detect video format
 */
export function detectVideoFormat(fileName: string): 'mp4' | 'webm' | 'mkv' | 'mov' | 'other' {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (ext === 'mp4' || ext === 'webm' || ext === 'mkv' || ext === 'mov') {
    return ext;
  }
  return 'other';
}

/**
 * Check if a folder path segment represents the Resources/Exercises folder
 */
export function isResourcesFolder(segment: string): boolean {
  const lower = segment.toLowerCase().trim();
  return lower.includes('resource') || lower === '0. resources' || lower === 'resources';
}

/**
 * Scan raw file paths and content/metadata into a structured MoshScanSummary
 */
export function processRawMoshFiles(
  rawFiles: Array<{ path: string; size?: number }>,
  existingVideos: MoshVideo[],
  existingResources: MoshResource[],
  defaultCourseName: string = 'Spring Boot Course'
): MoshScanSummary {
  const existingVideoMap = new Map<string, MoshVideo>();
  existingVideos.forEach((v) => {
    const key = `${v.courseName}::${v.relativePath.replace(/\\/g, '/').toLowerCase()}`;
    existingVideoMap.set(key, v);
  });

  const existingResourceMap = new Map<string, MoshResource>();
  existingResources.forEach((r) => {
    const key = `${r.courseName}::${r.relativePath.replace(/\\/g, '/').toLowerCase()}`;
    existingResourceMap.set(key, r);
  });

  // Determine course name if files share a top-level directory
  let detectedCourseName = defaultCourseName;
  const validFiles = rawFiles.filter((f) => {
    const norm = f.path.replace(/\\/g, '/').replace(/^\/+/, '');
    const parts = norm.split('/');
    const name = parts[parts.length - 1];
    if (name.startsWith('.') || name.toLowerCase() === 'thumbs.db') return false;
    const ext = (name.split('.').pop() || '').toLowerCase();
    return VIDEO_EXTENSIONS.has(ext) || ext === 'pdf';
  });

  if (validFiles.length > 0) {
    const firstParts = validFiles[0].path.replace(/\\/g, '/').replace(/^\/+/, '').split('/');
    if (firstParts.length >= 3) {
      // e.g. "Spring Boot Course/1. Introduction/01. Welcome.mp4"
      detectedCourseName = firstParts[0].trim();
    }
  }

  const allVideos: ScannedMoshVideo[] = [];
  const allResources: ScannedMoshResource[] = [];
  const sectionsMap = new Map<string, MoshSectionSummary>();
  let newCount = 0;
  let existingCount = 0;

  for (const raw of validFiles) {
    const normalizedPath = raw.path.replace(/\\/g, '/').replace(/^\/+/, '');
    const parts = normalizedPath.split('/');
    const fileName = parts[parts.length - 1];
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    const fileSize = raw.size || 0;

    let sectionName = 'General';
    let courseName = detectedCourseName;

    if (parts.length >= 3) {
      courseName = parts[0].trim();
      sectionName = parts[1].trim();
    } else if (parts.length === 2) {
      sectionName = parts[0].trim();
    }

    const isVideo = VIDEO_EXTENSIONS.has(ext);
    const isPdf = ext === 'pdf';

    const lookupKey = `${courseName}::${normalizedPath.toLowerCase()}`;

    if (isVideo) {
      const existingRecord = existingVideoMap.get(lookupKey);
      const isExisting = !!existingRecord;
      if (isExisting) existingCount++;
      else newCount++;

      const title = cleanDisplayTitle(fileName);
      const video: ScannedMoshVideo = {
        id: `mosh_vid_${normalizedPath.replace(/[^a-zA-Z0-9]/g, '_')}`,
        courseName,
        sectionName,
        title,
        originalFileName: fileName,
        relativePath: normalizedPath,
        fileType: detectVideoFormat(fileName),
        fileSize,
        status: isExisting ? 'EXISTING' : 'NEW',
        existingRecord,
      };

      allVideos.push(video);

      if (!sectionsMap.has(sectionName)) {
        sectionsMap.set(sectionName, {
          sectionName,
          orderIndex: sectionsMap.size + 1,
          videos: [],
          resources: [],
        });
      }
      sectionsMap.get(sectionName)!.videos.push(video);
    } else if (isPdf) {
      // PDF File: Classify as EXERCISE
      const existingRecord = existingResourceMap.get(lookupKey);
      const isExisting = !!existingRecord;
      if (isExisting) existingCount++;
      else newCount++;

      const title = cleanDisplayTitle(fileName);
      const resource: ScannedMoshResource = {
        id: `mosh_res_${normalizedPath.replace(/[^a-zA-Z0-9]/g, '_')}`,
        courseName,
        sectionName: isResourcesFolder(sectionName) ? '0. Resources' : sectionName,
        resourceType: 'EXERCISE',
        title,
        originalFileName: fileName,
        relativePath: normalizedPath,
        fileSize,
        status: isExisting ? 'EXISTING' : 'NEW',
        existingRecord,
      };

      allResources.push(resource);

      const targetSection = isResourcesFolder(sectionName) ? '0. Resources' : sectionName;
      if (!sectionsMap.has(targetSection)) {
        sectionsMap.set(targetSection, {
          sectionName: targetSection,
          orderIndex: targetSection.startsWith('0') ? 0 : sectionsMap.size + 1,
          videos: [],
          resources: [],
        });
      }
      sectionsMap.get(targetSection)!.resources.push(resource);
    }
  }

  // Sort sections: 0. Resources first, then numbered/alphabetical sections
  const sections = Array.from(sectionsMap.values()).sort((a, b) => {
    if (a.sectionName.startsWith('0') || isResourcesFolder(a.sectionName)) return -1;
    if (b.sectionName.startsWith('0') || isResourcesFolder(b.sectionName)) return 1;
    return a.sectionName.localeCompare(b.sectionName, undefined, { numeric: true });
  });

  return {
    courseName: detectedCourseName,
    totalSections: sections.length,
    totalVideos: allVideos.length,
    totalResources: allResources.length,
    newCount,
    existingCount,
    sections,
    allVideos,
    allResources,
  };
}
