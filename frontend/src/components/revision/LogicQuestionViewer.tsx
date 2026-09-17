import React from 'react';
import { RevisionItem } from '../../core/types';
import { Eye, Network, Sparkles, CheckCircle2 } from 'lucide-react';

interface LogicQuestionViewerProps {
  item: RevisionItem;
  revealed: boolean;
  onReveal: () => void;
}

export const LogicQuestionViewer: React.FC<LogicQuestionViewerProps> = ({
  item,
  revealed,
  onReveal,
}) => {
  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto">
      {/* Problem & Approach Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 20px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(236, 72, 153, 0.12)',
              color: 'var(--subject-dsa)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Network size={13} />
            Logic & Pattern Question
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Think logic, not memorization
          </span>
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '12px' }}>
          {item.title}
        </h3>

        <div style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          {item.frontContent}
        </div>

        {!revealed && (
          <div style={{ marginTop: '26px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
              What pointers, data structures, or invariants would you use?
            </p>
            <button
              onClick={onReveal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--accent-primary)',
                color: '#FFF',
                padding: '12px 28px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: '14px',
                boxShadow: '0 4px 14px var(--accent-glow)',
              }}
            >
              <Eye size={18} />
              <span>Reveal Optimal Logic</span>
              <kbd style={{
                fontSize: '10px',
                background: 'rgba(255,255,255,0.2)',
                padding: '2px 6px',
                borderRadius: '4px',
                marginLeft: '6px',
              }}>Space</kbd>
            </button>
          </div>
        )}
      </div>

      {/* Logic Breakdown */}
      {revealed && (
        <div
          className="animate-slide-up"
          style={{
            marginTop: '16px',
            background: 'var(--bg-surface)',
            border: '1px solid rgba(236, 72, 153, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <CheckCircle2 size={16} color="var(--rating-good)" />
            <span style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--rating-good)',
              fontWeight: 700,
            }}>
              Optimal Pattern & Logic
            </span>
          </div>

          <div style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
            {item.backContent}
          </div>

          {item.tip && (
            <div style={{
              marginTop: '16px',
              padding: '12px 14px',
              background: 'rgba(236, 72, 153, 0.08)',
              borderLeft: '3px solid var(--subject-dsa)',
              borderRadius: '4px',
              fontSize: '13px',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}>
              <Sparkles size={16} color="var(--subject-dsa)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Pattern Rule:</strong> {item.tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
