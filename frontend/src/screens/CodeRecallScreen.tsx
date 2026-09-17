import React, { useState, useEffect } from 'react';
import { RevisionItem } from '../core/types';
import { revisionItemRepo } from '../storage/repositories';
import { Code, Play, CheckCircle, Sparkles, Layers, Terminal } from 'lucide-react';

interface CodeRecallScreenProps {
  onStartSession: (mode: string, params?: { topicId?: string }) => void;
}

export const CodeRecallScreen: React.FC<CodeRecallScreenProps> = ({ onStartSession }) => {
  const [codeItems, setCodeItems] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCodeItems = async () => {
      setLoading(true);
      try {
        const all = await revisionItemRepo.getAll();
        const codeOnly = all.filter(
          (item) => item.type === 'CODE_RECALL' || item.type === 'CODE_EXPLANATION' || !!item.codeSnippet
        );
        setCodeItems(codeOnly);
      } catch (err) {
        console.error('Failed to load code items:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCodeItems();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Terminal size={20} color="#F59E0B" />
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Code Recall Workbench
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Strengthen muscle memory for DSA patterns, syntax tokens, and core function skeletons.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onStartSession('CODE_MODE')}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            color: '#090B10',
            fontWeight: 700,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
          }}
        >
          <Play size={15} fill="#090B10" />
          <span>Practice Code Recall</span>
        </button>
      </div>

      {/* Difficulty Levels Explainer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div className="glass-card" style={{ padding: '14px', borderLeft: '3px solid #10B981' }}>
          <strong style={{ fontSize: '13px', color: '#34D399', display: 'block', marginBottom: '2px' }}>Level 1: Token Blanks</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Small 1–2 missing condition tokens (Ideal for Bus Mode).</span>
        </div>
        <div className="glass-card" style={{ padding: '14px', borderLeft: '3px solid #38BDF8' }}>
          <strong style={{ fontSize: '13px', color: '#38BDF8', display: 'block', marginBottom: '2px' }}>Level 2: Multi-line Blanks</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Loop bodies and recursive step completions.</span>
        </div>
        <div className="glass-card" style={{ padding: '14px', borderLeft: '3px solid #F59E0B' }}>
          <strong style={{ fontSize: '13px', color: '#FBBF24', display: 'block', marginBottom: '2px' }}>Level 3: Function Skeleton</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Method signature provided, fill entire internal logic.</span>
        </div>
      </div>

      {/* Code Items Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Available Code Patterns ({codeItems.length})
        </h3>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading code items...</div>
        ) : codeItems.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
            No code recall snippets found. Add one from the Library tab!
          </div>
        ) : (
          codeItems.map((item) => (
            <div
              key={item.id}
              className="glass-card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#FBBF24',
                      fontWeight: 700,
                    }}
                  >
                    {item.codeLanguage?.toUpperCase() || 'JAVA'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {item.codeBlanks ? `${item.codeBlanks.length} Blanks` : 'Code Logic'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onStartSession('CODE_MODE')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid #F59E0B',
                    color: '#FBBF24',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Play size={12} fill="#FBBF24" /> Practice
                </button>
              </div>

              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {item.title}
              </h4>

              {item.codeSnippet && (
                <div
                  style={{
                    background: '#090B10',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#94A3B8',
                    maxHeight: '110px',
                    overflow: 'hidden',
                  }}
                >
                  <pre style={{ margin: 0 }}>{item.codeSnippet}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
