import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SessionStats } from '../../core/types';
import { Trophy, CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, Clock } from 'lucide-react';

interface SessionSummaryModalProps {
  stats: SessionStats;
  onFinish: () => void;
  onDrillMistakes?: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  stats,
  onFinish,
  onDrillMistakes,
}) => {
  const durationSec = Math.max(1, Math.round(((stats.endTime || Date.now()) - stats.startTime) / 1000));
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  const timeFormatted = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  const total = stats.totalReviewed;
  const successful = stats.goodCount + stats.easyCount;
  const accuracyPct = total > 0 ? Math.round((successful / total) * 100) : 100;

  useEffect(() => {
    // Fire confetti on high recall
    if (accuracyPct >= 60) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366F1', '#EC4899', '#10B981', '#F59E0B'],
        });
      } catch (e) {
        // ignore if canvas not supported
      }
    }
  }, [accuracyPct]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-overlay)',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
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
          padding: '28px 24px',
          boxShadow: 'var(--shadow-elevated)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(244, 63, 94, 0.2) 100%)',
            border: '1px solid var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <Trophy size={32} color="#818CF8" />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Session Complete!
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Great effort! Active recall strengthens neural pathways.
        </p>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
          <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Reviewed</span>
            <strong style={{ fontSize: '20px', color: 'var(--text-primary)' }}>{total}</strong>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Accuracy</span>
            <strong style={{ fontSize: '20px', color: accuracyPct >= 70 ? '#34D399' : '#FBBF24' }}>
              {accuracyPct}%
            </strong>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Time</span>
            <strong style={{ fontSize: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
              <Clock size={13} color="var(--text-muted)" /> {timeFormatted}
            </strong>
          </div>
        </div>

        {/* Rating Breakdown Pill */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '12px', marginBottom: '24px' }}>
          <span style={{ color: 'var(--rating-again)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--rating-again)' }} />
            Again: {stats.againCount}
          </span>
          <span style={{ color: 'var(--rating-hard)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--rating-hard)' }} />
            Hard: {stats.hardCount}
          </span>
          <span style={{ color: 'var(--rating-good)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--rating-good)' }} />
            Good: {stats.goodCount}
          </span>
          <span style={{ color: 'var(--rating-easy)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--rating-easy)' }} />
            Easy: {stats.easyCount}
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {stats.againCount > 0 && onDrillMistakes && (
            <button
              onClick={onDrillMistakes}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid var(--rating-again-border)',
                color: 'var(--rating-again)',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <RotateCcw size={16} />
              <span>Drill {stats.againCount} Missed Item{stats.againCount > 1 ? 's' : ''} Now</span>
            </button>
          )}

          <button
            onClick={onFinish}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              color: '#FFF',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
            }}
          >
            <span>Back to Dashboard</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
