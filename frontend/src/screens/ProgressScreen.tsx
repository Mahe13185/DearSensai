import React, { useState, useEffect } from 'react';
import { Subject, Attempt, ReviewSchedule } from '../core/types';
import { db } from '../storage/db';
import { reviewRepo, subjectRepo } from '../storage/repositories';
import {
  TrendingUp,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface ProgressScreenProps {
  subjects: Subject[];
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ subjects }) => {
  const [stats, setStats] = useState<any>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [schedules, setSchedules] = useState<ReviewSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      setLoading(true);
      try {
        const s = await reviewRepo.getStats();
        const recentAttempts = await reviewRepo.getRecentAttempts(25);
        const allScheds = await db.reviewSchedules.toArray();

        setStats(s);
        setAttempts(recentAttempts);
        setSchedules(allScheds);
      } catch (err) {
        console.error('Failed to load progress stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, []);

  if (loading || !stats) {
    return (
      <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Calculating retention metrics...
      </div>
    );
  }

  // Calculate SRS maturity counts
  const newCount = schedules.filter((s) => s.state === 'NEW').length;
  const learningCount = schedules.filter((s) => s.state === 'LEARNING' || s.state === 'RELEARNING').length;
  const reviewCount = schedules.filter((s) => s.state === 'REVIEW' && s.intervalDays < 21).length;
  const masteredCount = schedules.filter((s) => s.state === 'REVIEW' && s.intervalDays >= 21).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. HEADER */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Retention & Memory Analytics
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Track active recall consistency, memory maturity stages, and accuracy over time.
        </p>
      </div>

      {/* 2. TOP LEVEL STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Daily Streak</span>
            <Flame size={18} color="#F59E0B" fill="#F59E0B" />
          </div>
          <strong style={{ fontSize: '24px', color: '#F59E0B', display: 'block' }}>{stats.streak} Days</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Consistent daily recall</span>
        </div>

        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Overall Accuracy</span>
            <CheckCircle2 size={18} color="#10B981" />
          </div>
          <strong style={{ fontSize: '24px', color: stats.accuracy >= 70 ? '#34D399' : '#FBBF24', display: 'block' }}>
            {stats.accuracy}%
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Across {stats.totalAttempts} total attempts</span>
        </div>

        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Due for Review</span>
            <Clock size={18} color="var(--accent-primary-light)" />
          </div>
          <strong style={{ fontSize: '24px', color: 'var(--accent-primary-light)', display: 'block' }}>
            {stats.dueCount}
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Scheduled for today</span>
        </div>

        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Knowledge Items</span>
            <Layers size={18} color="#EC4899" />
          </div>
          <strong style={{ fontSize: '24px', color: 'var(--text-primary)', display: 'block' }}>
            {stats.totalItems}
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>In your personal library</span>
        </div>
      </div>

      {/* 3. SPACED REPETITION MATURITY PIPELINE */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Memory Retention Pipeline
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Items graduate from New $\rightarrow$ Learning $\rightarrow$ Review $\rightarrow$ Mastered as your recall intervals expand.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', borderTop: '3px solid #94A3B8' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>1. Unseen</span>
            <strong style={{ fontSize: '18px', color: '#94A3B8' }}>{newCount}</strong>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', borderTop: '3px solid #F59E0B' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>2. Learning</span>
            <strong style={{ fontSize: '18px', color: '#FBBF24' }}>{learningCount}</strong>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', borderTop: '3px solid var(--accent-primary)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>3. Retaining</span>
            <strong style={{ fontSize: '18px', color: 'var(--accent-primary-light)' }}>{reviewCount}</strong>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', borderTop: '3px solid #10B981' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>4. Mastered</span>
            <strong style={{ fontSize: '18px', color: '#34D399' }}>{masteredCount}</strong>
          </div>
        </div>
      </div>

      {/* 4. RECENT ATTEMPTS TIMELINE */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Recent Recall Log
        </h3>

        {attempts.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            No attempts logged yet. Complete a revision session to view history.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
            {attempts.map((att) => {
              const ratingColor =
                att.rating === 'AGAIN'
                  ? 'var(--rating-again)'
                  : att.rating === 'HARD'
                  ? 'var(--rating-hard)'
                  : att.rating === 'GOOD'
                  ? 'var(--rating-good)'
                  : 'var(--rating-easy)';

              return (
                <div
                  key={att.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.06)',
                        color: ratingColor,
                        fontWeight: 700,
                        fontSize: '11px',
                      }}
                    >
                      {att.rating}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Spent {Math.round(att.timeSpentMs / 1000)}s
                    </span>
                  </div>

                  <span style={{ color: 'var(--text-muted)' }}>
                    {new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
