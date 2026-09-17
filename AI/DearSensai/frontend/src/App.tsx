import React, { useState, useEffect, useCallback } from 'react';
import { Subject, Topic, SessionConfig } from './core/types';
import { seedDatabase } from './storage/seed';
import { subjectRepo, topicRepo, reviewRepo } from './storage/repositories';
import { AppShell, NavTab } from './components/layout/AppShell';
import { DashboardScreen } from './screens/DashboardScreen';
import { RevisionSessionScreen } from './screens/RevisionSessionScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { CodeRecallScreen } from './screens/CodeRecallScreen';
import { MistakesScreen } from './screens/MistakesScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ThemeProvider } from './core/theme/ThemeContext';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [activeSessionConfig, setActiveSessionConfig] = useState<SessionConfig | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    dueCount: 0,
    totalAttempts: 0,
    accuracy: 100,
    mistakesCount: 0,
    streak: 1,
  });
  const [isInitializing, setIsInitializing] = useState(true);

  // Load knowledge base data
  const loadData = useCallback(async () => {
    try {
      await seedDatabase();
      const [subs, tops, st] = await Promise.all([
        subjectRepo.getAll(),
        topicRepo.getAll(),
        reviewRepo.getStats(),
      ]);
      setSubjects(subs);
      setTopics(tops);
      setStats(st);
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Start Revision Session handler
  const handleStartSession = (
    mode: string,
    params?: { timeLimit?: number; topicId?: string; subjectId?: string }
  ) => {
    setActiveSessionConfig({
      mode: mode as any,
      timeLimitSeconds: params?.timeLimit,
      topicId: params?.topicId,
      subjectId: params?.subjectId,
    });
  };

  const handleQuickStart = (minutes: number) => {
    const mode = minutes === 5 ? 'QUICK_5M' : minutes === 10 ? 'BUS_10M' : 'BUS_15M';
    handleStartSession(mode, { timeLimit: minutes * 60 });
  };

  const handleExitSession = () => {
    setActiveSessionConfig(null);
    loadData();
  };

  const handleRestartMistakes = (mistakeIds: string[]) => {
    setActiveSessionConfig({
      mode: 'WEAK_TOPICS',
      limit: mistakeIds.length,
    });
  };

  if (isInitializing) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-canvas)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <img
          src="/icon.svg"
          alt="DearSensai"
          style={{ width: '60px', height: '60px', borderRadius: '16px', animation: 'pulseGlow 2s infinite' }}
        />
        <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
          DEARSENSAI
        </h2>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Initializing Local Recall Engine...
        </span>
      </div>
    );
  }

  // If in an active session, render fullscreen session runner
  if (activeSessionConfig) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-canvas)', padding: '16px' }}>
        <RevisionSessionScreen
          config={activeSessionConfig}
          onExit={handleExitSession}
          onRestartMistakes={handleRestartMistakes}
        />
      </div>
    );
  }

  return (
    <AppShell
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      streak={stats.streak}
      dueCount={stats.dueCount}
      mistakesCount={stats.mistakesCount}
      onQuickStart={handleQuickStart}
    >
      {currentTab === 'dashboard' && (
        <DashboardScreen
          stats={stats}
          subjects={subjects}
          topics={topics}
          onStartSession={handleStartSession}
          onNavigateTab={setCurrentTab}
        />
      )}

      {currentTab === 'revision' && (
        <DashboardScreen
          stats={stats}
          subjects={subjects}
          topics={topics}
          onStartSession={handleStartSession}
          onNavigateTab={setCurrentTab}
        />
      )}

      {currentTab === 'library' && (
        <LibraryScreen
          subjects={subjects}
          topics={topics}
          onStartSession={handleStartSession}
          onRefreshData={loadData}
        />
      )}

      {currentTab === 'code' && (
        <CodeRecallScreen
          onStartSession={handleStartSession}
        />
      )}

      {currentTab === 'mistakes' && (
        <MistakesScreen
          onStartSession={handleStartSession}
          onRefreshData={loadData}
        />
      )}

      {currentTab === 'progress' && (
        <ProgressScreen
          subjects={subjects}
        />
      )}

      {currentTab === 'settings' && (
        <SettingsScreen
          onRefreshData={loadData}
        />
      )}
    </AppShell>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

export default App;
