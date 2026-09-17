import React from 'react';
import { RevisionItem } from '../../core/types';
import { Sparkles, ArrowRight } from 'lucide-react';

interface TipViewerProps {
  item: RevisionItem;
  revealed: boolean;
  onReveal: () => void;
}

export const TipViewer: React.FC<TipViewerProps> = ({ item, revealed, onReveal }) => {
  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto">
      <div
        style={{
          background: 'linear-gradient(145deg, #1A1C29 0%, #12141F 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 24px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#FBBF24',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Sparkles size={13} />
            Sensai Quick Tip
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            High-leverage rule
          </span>
        </div>

        <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          {item.title}
        </h3>

        <div style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
          {item.frontContent}
        </div>

        {revealed && (
          <div
            className="animate-slide-up"
            style={{
              marginTop: '16px',
              padding: '16px',
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#FEF3C7',
              fontSize: '15px',
              lineHeight: 1.6,
            }}
          >
            {item.backContent || item.tip}
          </div>
        )}

        {!revealed && (
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={onReveal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#F59E0B',
                color: '#090B10',
                padding: '12px 28px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              <span>View Rule Application</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
