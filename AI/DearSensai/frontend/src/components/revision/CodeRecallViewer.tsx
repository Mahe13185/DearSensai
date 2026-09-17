import React, { useState } from 'react';
import { RevisionItem } from '../../core/types';
import { Code, Eye, Sparkles, Check, X, RotateCcw } from 'lucide-react';

interface CodeRecallViewerProps {
  item: RevisionItem;
  revealed: boolean;
  onReveal: () => void;
}

export const CodeRecallViewer: React.FC<CodeRecallViewerProps> = ({
  item,
  revealed,
  onReveal,
}) => {
  const blanks = item.codeBlanks || [];
  // User selected answers per blank ID
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [activeBlankId, setActiveBlankId] = useState<string | null>(
    blanks.length > 0 ? blanks[0].id : null
  );

  const handleSelectOption = (blankId: string, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [blankId]: option }));
    
    // Auto advance to next unanswered blank
    const currentIndex = blanks.findIndex((b) => b.id === blankId);
    if (currentIndex < blanks.length - 1) {
      setActiveBlankId(blanks[currentIndex + 1].id);
    }
  };

  const handleResetBlanks = () => {
    setSelectedAnswers({});
    if (blanks.length > 0) setActiveBlankId(blanks[0].id);
  };

  // Render code snippet with blank replacements
  const renderCodeWithBlanks = () => {
    if (!item.codeSnippet) return null;

    let code = item.codeSnippet;
    const parts: React.ReactNode[] = [];

    // Split code snippet by ___BLANK_X___ tokens
    const regex = /___([A-Za-z0-9_]+)___/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(code)) !== null) {
      const matchIndex = match.index;
      const blankKey = match[1]; // e.g. BLANK_1
      const blankConfig = blanks.find((b) => b.id === blankKey);

      // Push code text before blank
      if (matchIndex > lastIndex) {
        parts.push(
          <span key={`text_${lastIndex}`} style={{ color: 'var(--code-text)' }}>
            {code.substring(lastIndex, matchIndex)}
          </span>
        );
      }

      const selected = selectedAnswers[blankKey];
      const isTarget = blankConfig?.target;
      const isCorrect = selected && isTarget && selected.trim() === isTarget.trim();
      const isWrong = selected && isTarget && selected.trim() !== isTarget.trim();
      const isActive = activeBlankId === blankKey && !revealed;

      parts.push(
        <button
          key={`blank_${blankKey}`}
          type="button"
          onClick={() => {
            if (!revealed) setActiveBlankId(blankKey);
          }}
          className={`code-blank ${revealed ? 'filled' : ''} ${isActive ? 'active-blank' : ''}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            margin: '0 4px',
            padding: '2px 8px',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            background: revealed
              ? 'rgba(16, 185, 129, 0.2)'
              : selected
              ? isCorrect
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(244, 63, 94, 0.2)'
              : isActive
              ? 'rgba(99, 102, 241, 0.3)'
              : 'rgba(99, 102, 241, 0.1)',
            color: revealed
              ? '#34D399'
              : selected
              ? isCorrect
                ? '#34D399'
                : '#FB7185'
              : 'var(--accent-primary-light)',
            border: revealed
              ? '1px solid #10B981'
              : selected
              ? isCorrect
                ? '1px solid #10B981'
                : '1px solid #F43F5E'
              : isActive
              ? '1px solid var(--accent-primary)'
              : '1px dashed var(--border-medium)',
            cursor: !revealed ? 'pointer' : 'default',
          }}
        >
          {revealed ? (
            isTarget || '________'
          ) : selected ? (
            <>
              <span>{selected}</span>
              {isCorrect && <Check size={12} color="#10B981" />}
              {isWrong && <X size={12} color="#F43F5E" />}
            </>
          ) : (
            <span>{blankConfig?.hint ? `[${blankConfig.hint}]` : '________'}</span>
          )}
        </button>
      );

      lastIndex = matchIndex + match[0].length;
    }

    // Push remaining code text
    if (lastIndex < code.length) {
      parts.push(
        <span key={`text_${lastIndex}`} style={{ color: 'var(--code-text)' }}>
          {code.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  const activeBlank = blanks.find((b) => b.id === activeBlankId);

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto">
      {/* Question / Prompt Header */}
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
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#D97706',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Code size={13} />
            Code Recall {item.difficulty ? `• ${item.difficulty.replace('_', ' ')}` : ''}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Fill missing pieces
          </span>
        </div>

        <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {item.title}
        </h3>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          {item.frontContent}
        </p>

        {/* Code Block */}
        <div
          style={{
            background: 'var(--code-bg)',
            border: '1px solid var(--code-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            overflowX: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            lineHeight: 1.6,
          }}
        >
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {renderCodeWithBlanks()}
          </pre>
        </div>

        {/* Option Picker for Active Blank (Fast 1-tap mobile recall) */}
        {!revealed && activeBlank && activeBlank.options && activeBlank.options.length > 0 && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Choose token for: <strong style={{ color: 'var(--accent-primary)' }}>{activeBlank.hint || activeBlank.id}</strong>
              </span>
              {Object.keys(selectedAnswers).length > 0 && (
                <button
                  type="button"
                  onClick={handleResetBlanks}
                  style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <RotateCcw size={11} /> Reset
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {activeBlank.options.map((opt) => {
                const isSelected = selectedAnswers[activeBlank.id] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelectOption(activeBlank.id, opt)}
                    style={{
                      padding: '8px 12px',
                      background: isSelected ? 'var(--accent-primary)' : 'var(--bg-card)',
                      border: isSelected ? '1px solid var(--accent-primary-light)' : '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      color: isSelected ? '#FFF' : 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      textAlign: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!revealed && (
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
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
              <span>Reveal Solution</span>
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

      {/* Explanation & Full Solution */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
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
              Code Explanation
            </span>
          </div>

          <div style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
            {item.backContent}
          </div>

          {item.explanation && (
            <div style={{
              marginTop: '14px',
              padding: '12px 14px',
              background: 'rgba(99, 102, 241, 0.08)',
              borderLeft: '3px solid var(--accent-primary)',
              borderRadius: '4px',
              fontSize: '13px',
              color: 'var(--text-primary)',
            }}>
              {item.explanation}
            </div>
          )}

          {item.tip && (
            <div style={{
              marginTop: '12px',
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
              <span><strong>Recall Tip:</strong> {item.tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
