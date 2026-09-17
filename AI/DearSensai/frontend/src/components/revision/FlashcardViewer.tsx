import React from 'react';
import { RevisionItem } from '../../core/types';
import { Eye, Sparkles } from 'lucide-react';

interface FlashcardViewerProps {
  item: RevisionItem;
  revealed: boolean;
  onReveal: () => void;
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ item, revealed, onReveal }) => {
  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto">
      {/* Front Card */}
      <div 
        onClick={!revealed ? onReveal : undefined}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 20px',
          boxShadow: 'var(--shadow-card)',
          cursor: !revealed ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(99, 102, 241, 0.12)',
            color: 'var(--accent-primary)',
            fontWeight: 700,
          }}>
            Flashcard
          </span>
          {item.tags && item.tags.length > 0 && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              #{item.tags[0]}
            </span>
          )}
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '12px' }}>
          {item.title}
        </h3>

        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          {item.frontContent}
        </p>

        {!revealed && (
          <div style={{ marginTop: '26px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReveal();
              }}
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
              <span>Reveal Answer</span>
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

      {/* Revealed Answer Box */}
      {revealed && (
        <div
          className="animate-slide-up"
          style={{
            marginTop: '16px',
            background: 'var(--bg-surface)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--rating-good-bg)',
              color: 'var(--rating-good)',
              fontWeight: 700,
            }}>
              Answer & Key Takeaways
            </span>
          </div>

          <div style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
            {item.backContent}
          </div>

          {item.tip && (
            <div style={{
              marginTop: '16px',
              padding: '12px 14px',
              background: 'rgba(245, 158, 11, 0.08)',
              borderLeft: '3px solid #F59E0B',
              borderRadius: '4px',
              fontSize: '13px',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}>
              <Sparkles size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Sensai Tip:</strong> {item.tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
