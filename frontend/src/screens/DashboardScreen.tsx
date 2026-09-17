import React from 'react';
import { Subject, Topic } from '../core/types';
import {
  Zap,
  Bus,
  Clock,
  Flame,
  AlertOctagon,
  ArrowRight,
  Target,
  Play,
  CheckCircle2,
} from 'lucide-react';

interface DashboardScreenProps {
  stats: {
    totalItems: number;
    dueCount: number;
    totalAttempts: number;
    accuracy: number;
    mistakesCount: number;
    streak: number;
  };
  subjects: Subject[];
  topics: Topic[];
  onStartSession: (mode: string, params?: { timeLimit?: number; topicId?: string; subjectId?: string }) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  stats,
  subjects,
  topics,
  onStartSession,
  onNavigateTab,
}) => {
  // Time-aware greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* 1. GREETING & STREAK HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {greeting}, Sensai
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Ready for your active recall practice?
          </p>
        </div>

        {/* Daily Streak Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            color: '#F59E0B',
            fontSize: '13px',
            fontWeight: 700,
          }}
          title="Daily Active Recall Streak"
        >
          <Flame size={16} fill="#F59E0B" />
          <span>{stats.streak} day{stats.streak > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* 2. PRIMARY REVISION HERO (The main action of the app) */}
      <div
        className="glass-card"
        style={{
          padding: '24px 20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 700,
                color: 'var(--accent-primary)',
              }}
            >
              Primary Action
            </span>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              Start Revision
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onStartSession(stats.dueCount > 0 ? 'DUE_TODAY' : 'BUS_10M')}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-primary)',
              color: '#FFF',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px var(--accent-glow)',
            }}
          >
            <Play size={16} fill="#FFF" />
            <span>{stats.dueCount > 0 ? `Revise ${stats.dueCount} Due` : 'Start Quick Session'}</span>
          </button>
        </div>

        {/* 1-Tap Sprint Mode Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          {/* 5 Min Sprint */}
          <button
            type="button"
            onClick={() => onStartSession('QUICK_5M', { timeLimit: 300 })}
            style={{
              padding: '12px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '4px',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} color="var(--accent-primary)" />
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>5 Min</strong>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rapid Sprint</span>
          </button>

          {/* 10 Min Bus Mode */}
          <button
            type="button"
            onClick={() => onStartSession('BUS_10M', { timeLimit: 600 })}
            style={{
              padding: '12px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--accent-primary)',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '4px',
              textAlign: 'left',
              width: '100%',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bus size={14} color="var(--accent-sensai)" />
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>10 Min</strong>
              <span style={{ fontSize: '9px', background: 'var(--accent-sensai)', color: '#FFF', padding: '1px 4px', borderRadius: '3px', fontWeight: 800 }}>BUS</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1-Hand Touch</span>
          </button>

          {/* 15 Min Focused */}
          <button
            type="button"
            onClick={() => onStartSession('BUS_15M', { timeLimit: 900 })}
            style={{
              padding: '12px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '4px',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="#F59E0B" />
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>15 Min</strong>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Focused Study</span>
          </button>

          {/* 30 Min Deep Study */}
          <button
            type="button"
            onClick={() => onStartSession('DEEP_30M', { timeLimit: 1800 })}
            style={{
              padding: '12px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '4px',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={14} color="#10B981" />
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>30 Min</strong>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deep Recall</span>
          </button>
        </div>
      </div>

      {/* 3. DUE ITEMS BANNER (If any due) */}
      {stats.dueCount > 0 && (
        <div
          style={{
            padding: '14px 18px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={18} color="var(--accent-primary)" />
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                {stats.dueCount} item{stats.dueCount > 1 ? 's' : ''} scheduled for today
              </strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>
                Spaced repetition memory review
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onStartSession('DUE_TODAY')}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Review Now</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* 4. WEAK TOPICS / MISTAKES (Targeted mastery) */}
      {stats.mistakesCount > 0 && (
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertOctagon size={16} color="var(--rating-again)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Weak Topics & Mistakes
              </h3>
            </div>

            <button
              type="button"
              onClick={() => onStartSession('WEAK_TOPICS')}
              style={{
                fontSize: '12px',
                color: 'var(--rating-again)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <span>Drill All ({stats.mistakesCount})</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topics.slice(0, 2).map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => onStartSession('WEAK_TOPICS', { topicId: topic.id })}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  fontSize: '13px',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{topic.title}</span>
                <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  Practice →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. SUBJECTS KNOWLEDGE BASE */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Subjects
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab('library')}
            style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}
          >
            <span>Library</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {subjects.map((sub) => {
            const subTopics = topics.filter((t) => t.subjectId === sub.id);
            return (
              <div
                key={sub.id}
                className="glass-card"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `3px solid ${sub.color || 'var(--accent-primary)'}`,
                }}
              >
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {sub.title}
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {subTopics.length} Topics
                  </span>
                </div>

                <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => onStartSession('MIXED', { subjectId: sub.id })}
                    style={{
                      flex: 1,
                      padding: '7px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '12px',
                    }}
                  >
                    Revise
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. SECONDARY STATS (Demoted / Compact at bottom) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '12px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          marginTop: '4px',
        }}
      >
        <span>
          Accuracy: <strong style={{ color: 'var(--text-primary)' }}>{stats.accuracy}%</strong>
        </span>
        <span>•</span>
        <span>
          Attempts: <strong style={{ color: 'var(--text-primary)' }}>{stats.totalAttempts}</strong>
        </span>
        <span>•</span>
        <span>
          Knowledge Base: <strong style={{ color: 'var(--text-primary)' }}>{stats.totalItems} items</strong>
        </span>
      </div>
    </div>
  );
};
