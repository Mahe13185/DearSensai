import React, { useEffect } from 'react';
import { Rating, ReviewSchedule } from '../../core/types';
import { getIntervalPreviews } from '../../core/scheduler/srs';
import { RotateCcw, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

interface RevisionControlsProps {
  schedule: ReviewSchedule;
  onRate: (rating: Rating) => void;
  disabled?: boolean;
}

export const RevisionControls: React.FC<RevisionControlsProps> = ({
  schedule,
  onRate,
  disabled = false,
}) => {
  const intervals = getIntervalPreviews(schedule);

  // Keyboard shortcut handler (1: Again, 2: Hard, 3: Good, 4: Easy)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '1') onRate('AGAIN');
      else if (e.key === '2') onRate('HARD');
      else if (e.key === '3') onRate('GOOD');
      else if (e.key === '4') onRate('EASY');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onRate]);

  return (
    <div
      className="w-full max-w-2xl mx-auto"
      style={{
        marginTop: '20px',
        padding: '12px 8px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-elevated)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', padding: '0 8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Rate your recall
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Keys 1 • 2 • 3 • 4
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {/* AGAIN */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRate('AGAIN')}
          style={{
            flexDirection: 'column',
            gap: '4px',
            padding: '14px 6px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--rating-again-bg)',
            border: '1px solid var(--rating-again-border)',
            color: 'var(--rating-again)',
            fontWeight: 700,
            fontSize: '14px',
            minHeight: '62px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RotateCcw size={14} />
            <span>Again</span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.85 }}>
            {intervals.AGAIN}
          </span>
        </button>

        {/* HARD */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRate('HARD')}
          style={{
            flexDirection: 'column',
            gap: '4px',
            padding: '14px 6px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--rating-hard-bg)',
            border: '1px solid var(--rating-hard-border)',
            color: 'var(--rating-hard)',
            fontWeight: 700,
            fontSize: '14px',
            minHeight: '62px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={14} />
            <span>Hard</span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.85 }}>
            {intervals.HARD}
          </span>
        </button>

        {/* GOOD */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRate('GOOD')}
          style={{
            flexDirection: 'column',
            gap: '4px',
            padding: '14px 6px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--rating-good-bg)',
            border: '1px solid var(--rating-good-border)',
            color: 'var(--rating-good)',
            fontWeight: 700,
            fontSize: '14px',
            minHeight: '62px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={14} />
            <span>Good</span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.85 }}>
            {intervals.GOOD}
          </span>
        </button>

        {/* EASY */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRate('EASY')}
          style={{
            flexDirection: 'column',
            gap: '4px',
            padding: '14px 6px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--rating-easy-bg)',
            border: '1px solid var(--rating-easy-border)',
            color: 'var(--rating-easy)',
            fontWeight: 700,
            fontSize: '14px',
            minHeight: '62px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={14} />
            <span>Easy</span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.85 }}>
            {intervals.EASY}
          </span>
        </button>
      </div>
    </div>
  );
};
