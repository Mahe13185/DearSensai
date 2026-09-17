import React from 'react';
import { RevisionItem } from '../../core/types';
import { BrainCircuit, Eye, HelpCircle, Lightbulb } from 'lucide-react';

interface ConceptQuestionViewerProps {
  item: RevisionItem;
  revealed: boolean;
  onReveal: () => void;
}

export const ConceptQuestionViewer: React.FC<ConceptQuestionViewerProps> = ({
  item,
  revealed,
  onReveal,
}) => {
  const isWhy = item.type === 'WHY';

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto">
      {/* Question Card */}
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
              background: isWhy ? 'rgba(244, 63, 94, 0.12)' : 'rgba(99, 102, 241, 0.12)',
              color: isWhy ? 'var(--accent-sensai)' : 'var(--accent-primary)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            {isWhy ? <HelpCircle size={13} /> : <BrainCircuit size={13} />}
            {isWhy ? 'Why Question' : 'Concept Question'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Think first & recall
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
              Formulate your explanation mentally before revealing
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
              <span>Reveal Explanation</span>
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

      {/* Explanation Reveal */}
      {revealed && (
        <div
          className="animate-slide-up"
          style={{
            marginTop: '16px',
            background: 'var(--bg-surface)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--accent-primary)',
              fontWeight: 700,
            }}>
              Conceptual Explanation
            </span>
          </div>

          <div style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
            {item.backContent}
          </div>

          {item.explanation && (
            <div style={{
              marginTop: '16px',
              padding: '12px 14px',
              background: 'rgba(99, 102, 241, 0.08)',
              borderLeft: '3px solid var(--accent-primary)',
              borderRadius: '4px',
              fontSize: '13px',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}>
              <Lightbulb size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Deep Invariant:</strong> {item.explanation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
