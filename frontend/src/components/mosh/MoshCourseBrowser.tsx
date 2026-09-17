import React, { useState, useEffect } from 'react';
import { MoshCourse, MoshVideo, MoshResource } from '../../core/types';
import { moshRepo } from '../../storage/repositories';
import { Film, PlayCircle, FileText, ChevronDown, ChevronRight, Layers, Clock, HardDrive, Info, Trash2, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { MoshLessonWorkspace } from './MoshLessonWorkspace';

interface MoshCourseBrowserProps {
  onOpenImportModal: () => void;
  onRefreshData?: () => void;
}

export const MoshCourseBrowser: React.FC<MoshCourseBrowserProps> = ({
  onOpenImportModal,
  onRefreshData,
}) => {
  const [courses, setCourses] = useState<MoshCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLessonVideo, setSelectedLessonVideo] = useState<MoshVideo | null>(null);
  const [videos, setVideos] = useState<MoshVideo[]>([]);
  const [resources, setResources] = useState<MoshResource[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const all = await moshRepo.getCourses();
      setCourses(all);
      if (all.length > 0) {
        if (!selectedCourseId || !all.some((c) => c.id === selectedCourseId)) {
          setSelectedCourseId(all[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load Mosh courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Load videos and resources for selected course
  useEffect(() => {
    const loadCourseContent = async () => {
      if (!selectedCourseId) {
        setVideos([]);
        setResources([]);
        return;
      }
      try {
        const [vids, res] = await Promise.all([
          moshRepo.getVideosByCourse(selectedCourseId),
          moshRepo.getResourcesByCourse(selectedCourseId),
        ]);
        setVideos(vids);
        setResources(res);
      } catch (err) {
        console.error('Failed to load course content:', err);
      }
    };

    loadCourseContent();
  }, [selectedCourseId]);

  const activeCourse = courses.find((c) => c.id === selectedCourseId);

  const toggleSectionCollapse = (sectionName: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm('Remove this course metadata and video index from DEARSENSAI?')) {
      await moshRepo.deleteCourse(courseId);
      await loadCourses();
      if (onRefreshData) onRefreshData();
    }
  };

  // Group videos and resources by section
  const sectionMap: Record<string, { videos: MoshVideo[]; resources: MoshResource[] }> = {};

  // First seed with course section names if available
  if (activeCourse?.sectionNames) {
    activeCourse.sectionNames.forEach((name) => {
      sectionMap[name] = { videos: [], resources: [] };
    });
  }

  videos.forEach((v) => {
    if (!sectionMap[v.sectionName]) sectionMap[v.sectionName] = { videos: [], resources: [] };
    sectionMap[v.sectionName].videos.push(v);
  });

  resources.forEach((r) => {
    if (!sectionMap[r.sectionName]) sectionMap[r.sectionName] = { videos: [], resources: [] };
    sectionMap[r.sectionName].resources.push(r);
  });

  // Sort sections: 0. Resources first, then alphanumeric
  const sortedSectionNames = Object.keys(sectionMap).sort((a, b) => {
    if (a.startsWith('0') || a.toLowerCase().includes('resource')) return -1;
    if (b.startsWith('0') || b.toLowerCase().includes('resource')) return 1;
    return a.localeCompare(b, undefined, { numeric: true });
  });

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  // If a lesson is selected, show the MoshLessonWorkspace
  if (selectedLessonVideo) {
    return (
      <MoshLessonWorkspace
        video={selectedLessonVideo}
        onBack={() => setSelectedLessonVideo(null)}
        onRefreshData={onRefreshData}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Film size={20} color="#F59E0B" />
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Mosh Video Courses
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Organized course sections, video lesson indexes, and practice exercise PDFs
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenImportModal}
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
          <Film size={15} />
          <span>+ Import Mosh Course</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading courses...
        </div>
      ) : courses.length === 0 ? (
        /* Empty State */
        <div
          style={{
            padding: '40px 24px',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Film size={36} color="var(--text-muted)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            No Mosh Courses Imported Yet
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '460px' }}>
            Import your local Spring Boot course directories to index video lessons and exercise PDFs completely offline.
          </p>
          <button
            type="button"
            onClick={onOpenImportModal}
            style={{
              marginTop: '8px',
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              color: '#FFF',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Import Course Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Course Tabs (Separate course display) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
            {courses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => setSelectedCourseId(course.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: selectedCourseId === course.id ? 'var(--bg-card)' : 'var(--bg-surface)',
                  border: selectedCourseId === course.id ? '1px solid var(--border-highlight)' : '1px solid var(--border-subtle)',
                  color: selectedCourseId === course.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: selectedCourseId === course.id ? 700 : 500,
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <BookOpen size={14} color={selectedCourseId === course.id ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                <span>{course.title}</span>
                <span style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                  {course.totalVideos} videos
                </span>
              </button>
            ))}
          </div>

          {/* Active Course Overview Card */}
          {activeCourse && (
            <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {activeCourse.title}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Layers size={13} color="var(--accent-primary)" />
                    {sortedSectionNames.length} Sections
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <PlayCircle size={13} color="#F59E0B" />
                    {videos.length} Video Lessons
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileText size={13} color="#10B981" />
                    {resources.length} Practice PDFs
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleDeleteCourse(activeCourse.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Remove course from local index"
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          )}

          {/* Browser PWA Privacy Notice */}
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(99, 102, 241, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            <Info size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Local-First Metadata:</strong> Course hierarchy and video metadata are indexed locally. Video binaries remain securely on your Mac.
            </span>
          </div>

          {/* SECTIONS ACCORDION LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedSectionNames.map((sectionName) => {
              const sec = sectionMap[sectionName];
              const isCollapsed = !!collapsedSections[sectionName];
              const isResourceSection = sectionName.startsWith('0') || sectionName.toLowerCase().includes('resource');

              return (
                <div
                  key={sectionName}
                  className="glass-card"
                  style={{
                    padding: '0',
                    overflow: 'hidden',
                  }}
                >
                  {/* Section Accordion Header */}
                  <div
                    onClick={() => toggleSectionCollapse(sectionName)}
                    style={{
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-surface)',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isCollapsed ? <ChevronRight size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                      {isResourceSection ? <FileText size={16} color="#10B981" /> : <PlayCircle size={16} color="#F59E0B" />}
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {sectionName}
                      </span>
                    </div>

                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {sec.videos.length > 0 ? `${sec.videos.length} videos` : ''}
                      {sec.videos.length > 0 && sec.resources.length > 0 ? ' • ' : ''}
                      {sec.resources.length > 0 ? `${sec.resources.length} exercise PDFs` : ''}
                    </span>
                  </div>

                  {/* Section Content */}
                  {!isCollapsed && (
                    <div style={{ padding: '8px 18px 14px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {/* Video Lessons */}
                      {sec.videos.map((video, idx) => (
                        <div
                          key={video.id}
                          onClick={() => setSelectedLessonVideo(video)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                            e.currentTarget.style.background = 'var(--bg-surface)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            e.currentTarget.style.background = 'var(--bg-card)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: '18px' }}>
                              {idx + 1}.
                            </span>
                            <PlayCircle size={14} color="#F59E0B" />
                            <div>
                              <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
                                {video.title}
                              </strong>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                {video.originalFileName}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {video.fileSize > 0 && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {formatFileSize(video.fileSize)}
                              </span>
                            )}
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
                              {video.fileType}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLessonVideo(video);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(99, 102, 241, 0.12)',
                                border: '1px solid rgba(99, 102, 241, 0.25)',
                                color: 'var(--accent-primary)',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              <Sparkles size={11} />
                              <span>Workspace</span>
                              <ChevronRight size={11} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Resource PDFs */}
                      {sec.resources.map((res, idx) => (
                        <div
                          key={res.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: '18px' }}>
                              {idx + 1}.
                            </span>
                            <FileText size={14} color="#10B981" />
                            <div>
                              <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
                                {res.title}
                              </strong>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                {res.originalFileName}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {res.fileSize > 0 && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {formatFileSize(res.fileSize)}
                              </span>
                            )}
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
                              EXERCISE PDF
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
