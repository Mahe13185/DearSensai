import React, { useState, useEffect } from 'react';
import { MistakeLog, RevisionItem } from '../core/types';
import { reviewRepo, revisionItemRepo } from '../storage/repositories';
import {
  AlertOctagon,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  Play,
  ArrowRight,
} from 'lucide-react';

interface MistakesScreenProps {
  onStartSession: (mode: string) => void;
  onRefreshData?: () => void;
}

export const MistakesScreen: React.FC<MistakesScreenProps> = ({
  onStartSession,
  onRefreshData,
}) => {
  const [mistakes, setMistakes] = useState<Array<{ log: MistakeLog; item?: RevisionItem }>>([]);
  const [loading, setLoading] = useState(true);

  const loadMistakes = async () => {
    setLoading(true);
    try {
      const logs = await reviewRepo.getMistakes();
      const combined = await Promise.all(
        logs.map(async (log) => {
          const item = await revisionItemRepo.getById(log.revisionItemId);
          return { log, item };
        })
      );
      setMistakes(combined);
    } catch (err) {
      console.error('Failed to load mistakes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMistakes();
  }, []);

  const handleResolve = async (logId: string) => {
    await reviewRepo.resolveMistake(logId);
    setMistakes((prev) => prev.filter((m) => m.log.id !== logId));
    if (onRefreshData) onRefreshData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <AlertOctagon size={22} color="var(--rating-again)" />
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Mistakes Vault
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Every weak answer or confusion is logged here for targeted mastery.
          </p>
        </div>

        {mistakes.length > 0 && (
          <button
            type="button"
            onClick={() => onStartSession('WEAK_TOPICS')}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--rating-again)',
              color: '#FFF',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px var(--rating-again-border)',
            }}
          >
            <RotateCcw size={15} />
            <span>Drill All Mistakes ({mistakes.length})</span>
          </button>
        )}
      </div>

      {/* Mistakes List */}
      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading mistakes vault...
        </div>
      ) : mistakes.length === 0 ? (
        <div
          className="glass-card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} color="#34D399" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Vault is Clean!
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px' }}>
            When you struggle or click "Again" during a revision session, items automatically get recorded here so you can eliminate blind spots.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mistakes.map(({ log, item }) => (
            <div
              key={log.id}
              className="glass-card"
              style={{
                padding: '18px 20px',
                borderLeft: '4px solid var(--rating-again)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'var(--rating-again-bg)',
                      border: '1px solid var(--rating-again-border)',
                      color: 'var(--rating-again)',
                      fontWeight: 700,
                    }}
                  >
                    Failed {log.failCount}x
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Last missed {new Date(log.lastFailedAt).toLocaleDateString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleResolve(log.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34D399',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Mark as mastered & remove from mistakes vault"
                >
                  <CheckCircle2 size={13} />
                  <span>Mark Mastered</span>
                </button>
              </div>

              {item && (
                <>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item.frontContent}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
