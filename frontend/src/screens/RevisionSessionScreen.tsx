import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RevisionItem,
  ReviewSchedule,
  Rating,
  SessionConfig,
  SessionStats,
  SessionLog,
} from '../core/types';
import { revisionItemRepo, reviewRepo } from '../storage/repositories';
import { FlashcardViewer } from '../components/revision/FlashcardViewer';
import { ConceptQuestionViewer } from '../components/revision/ConceptQuestionViewer';
import { LogicQuestionViewer } from '../components/revision/LogicQuestionViewer';
import { CodeRecallViewer } from '../components/revision/CodeRecallViewer';
import { TipViewer } from '../components/revision/TipViewer';
import { RevisionControls } from '../components/revision/RevisionControls';
import { SessionSummaryModal } from '../components/revision/SessionSummaryModal';
import { X, Clock, AlertCircle } from 'lucide-react';

interface RevisionSessionScreenProps {
  config: SessionConfig;
  onExit: () => void;
  onRestartMistakes?: (mistakeIds: string[]) => void;
}

export const RevisionSessionScreen: React.FC<RevisionSessionScreenProps> = ({
  config,
  onExit,
  onRestartMistakes,
}) => {
  const [sessionId] = useState<string>(
    () => config.sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  );
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentSchedule, setCurrentSchedule] = useState<ReviewSchedule | null>(null);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);

  // Time tracking
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const cardStartTimeRef = useRef<number>(Date.now());
  const missedItemIdsRef = useRef<string[]>([]);
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Session Statistics
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    sessionId,
    totalReviewed: 0,
    againCount: 0,
    hardCount: 0,
    goodCount: 0,
    easyCount: 0,
    startTime: Date.now(),
    mistakesAdded: 0,
  });

  // Load items using deterministic prioritized selector
  useEffect(() => {
    const loadSessionItems = async () => {
      setLoading(true);
      try {
        const selected = await revisionItemRepo.selectRevisionItems(config);
        setItems(selected);

        if (selected.length > 0) {
          const sched = await reviewRepo.getSchedule(selected[0].id);
          setCurrentSchedule(sched);
        }
      } catch (err) {
        console.error('Failed to select revision items:', err);
      } finally {
        setLoading(false);
        cardStartTimeRef.current = Date.now();
        sessionStartTimeRef.current = Date.now();
      }
    };

    loadSessionItems();
  }, [config]);

  // Session stopwatch
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Spacebar handler to reveal answer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ' || e.code === 'Space') {
        if (!revealed) {
          e.preventDefault();
          setRevealed(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [revealed]);

  const currentItem = items[currentIndex];

  // Handle rating & persistence
  const handleRate = useCallback(
    async (rating: Rating) => {
      if (!currentItem) return;

      const timeSpent = Date.now() - cardStartTimeRef.current;
      const { isLapse } = await reviewRepo.recordAttempt(
        currentItem.id,
        rating,
        timeSpent,
        sessionId
      );

      if (rating === 'AGAIN') {
        missedItemIdsRef.current.push(currentItem.id);
      }

      const updatedAgain = sessionStats.againCount + (rating === 'AGAIN' ? 1 : 0);
      const updatedHard = sessionStats.hardCount + (rating === 'HARD' ? 1 : 0);
      const updatedGood = sessionStats.goodCount + (rating === 'GOOD' ? 1 : 0);
      const updatedEasy = sessionStats.easyCount + (rating === 'EASY' ? 1 : 0);
      const updatedTotal = sessionStats.totalReviewed + 1;

      // Update session statistics
      setSessionStats((prev) => ({
        ...prev,
        totalReviewed: updatedTotal,
        againCount: updatedAgain,
        hardCount: updatedHard,
        goodCount: updatedGood,
        easyCount: updatedEasy,
        mistakesAdded: prev.mistakesAdded + (isLapse ? 1 : 0),
      }));

      // Advance to next item or finish
      if (currentIndex < items.length - 1) {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setRevealed(false);
        cardStartTimeRef.current = Date.now();

        const nextItemSched = await reviewRepo.getSchedule(items[nextIdx].id);
        setCurrentSchedule(nextItemSched);
      } else {
        // Complete session
        const now = Date.now();
        setSessionStats((prev) => ({ ...prev, endTime: now }));

        // Log session summary to storage
        const successfulCount = updatedGood + updatedEasy;
        const accuracy = updatedTotal > 0 ? Math.round((successfulCount / updatedTotal) * 100) : 100;
        const sessionLog: SessionLog = {
          id: sessionId,
          mode: config.mode,
          startTime: sessionStartTimeRef.current,
          endTime: now,
          totalReviewed: updatedTotal,
          accuracy,
          againCount: updatedAgain,
          hardCount: updatedHard,
          goodCount: updatedGood,
          easyCount: updatedEasy,
        };
        await reviewRepo.logSession(sessionLog);

        setSessionCompleted(true);
      }
    },
    [currentItem, currentIndex, items, sessionId, sessionStats, config.mode]
  );

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid var(--border-medium)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Preparing Revision Session...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', maxWidth: '400px', margin: '40px auto' }} className="glass-card">
        <AlertCircle size={40} color="var(--accent-primary)" style={{ margin: '0 auto 16px auto' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No Active Items Found</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          No revision items match the selected criteria or all items are currently disabled.
        </p>
        <button
          onClick={onExit}
          style={{
            padding: '10px 20px',
            background: 'var(--accent-primary)',
            color: '#FFF',
            borderRadius: 'var(--radius-full)',
            fontWeight: 600,
            fontSize: '13px',
          }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const progressPct = Math.round(((currentIndex + 1) / items.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* SESSION TOP BAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          padding: '0 4px',
        }}
      >
        {/* Progress & Item Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {currentIndex + 1} <span style={{ color: 'var(--text-muted)' }}>/ {items.length}</span>
          </span>
          <div
            style={{
              width: '120px',
              height: '6px',
              background: 'var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: 'var(--accent-primary)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>

        {/* Stopwatch & Quit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <Clock size={14} />
            <span>{formatTimer(secondsElapsed)}</span>
          </div>

          <button
            onClick={onExit}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-surface)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
            }}
            title="Exit revision session"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ACTIVE CARD RENDERER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {currentItem.type === 'FLASHCARD' && (
          <FlashcardViewer
            item={currentItem}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
          />
        )}

        {(currentItem.type === 'CONCEPT' || currentItem.type === 'WHY') && (
          <ConceptQuestionViewer
            item={currentItem}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
          />
        )}

        {currentItem.type === 'LOGIC' && (
          <LogicQuestionViewer
            item={currentItem}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
          />
        )}

        {(currentItem.type === 'CODE_RECALL' || currentItem.type === 'CODE_EXPLANATION') && (
          <CodeRecallViewer
            item={currentItem}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
          />
        )}

        {currentItem.type === 'TIP' && (
          <TipViewer
            item={currentItem}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
          />
        )}
      </div>

      {/* RATING CONTROLS */}
      {revealed && currentSchedule && (
        <RevisionControls
          schedule={currentSchedule}
          onRate={handleRate}
        />
      )}

      {/* SESSION SUMMARY MODAL ON FINISH */}
      {sessionCompleted && (
        <SessionSummaryModal
          stats={sessionStats}
          onFinish={onExit}
          onDrillMistakes={
            missedItemIdsRef.current.length > 0 && onRestartMistakes
              ? () => onRestartMistakes(missedItemIdsRef.current)
              : undefined
          }
        />
      )}
    </div>
  );
};
