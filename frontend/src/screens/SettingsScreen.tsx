import React, { useState, useEffect } from 'react';
import { backupRepo } from '../storage/repositories';
import { seedDatabase } from '../storage/seed';
import { useNetworkStatus } from '../sync/useNetworkStatus';
import { useTheme, ThemeMode } from '../core/theme/ThemeContext';
import {
  Download,
  Upload,
  RotateCcw,
  Moon,
  Sun,
  Laptop,
  Server,
  Palette,
} from 'lucide-react';

interface SettingsScreenProps {
  onRefreshData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onRefreshData }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { isOnline, pendingSyncCount, triggerSync } = useNetworkStatus();
  const [storageEstimate, setStorageEstimate] = useState<string>('Estimating...');
  const [importStatus, setImportStatus] = useState<string>('');
  const [syncUrl, setSyncUrl] = useState<string>('http://localhost:8080/api/v1/sync');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((estimate) => {
        const usageMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2);
        setStorageEstimate(`${usageMB} MB used (Offline Persistent IndexedDB)`);
      });
    } else {
      setStorageEstimate('Persistent Local Storage Active');
    }
  }, []);

  const handleExportBackup = async () => {
    try {
      const json = await backupRepo.exportFullDataJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dearsensai_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await backupRepo.importDataJSON(content);
      if (res.success) {
        setImportStatus(`Successfully restored ${res.count} items!`);
        onRefreshData();
      } else {
        setImportStatus(`Import error: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetSampleData = async () => {
    if (confirm('Reset and reload initial DSA, Java, and Spring Boot sample data?')) {
      setIsResetting(true);
      await seedDatabase(true);
      setIsResetting(false);
      onRefreshData();
      alert('Sample knowledge base reloaded successfully!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Settings & Preferences
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Manage visual appearance, backups, offline persistence, and sync preferences.
        </p>
      </div>

      {/* 1. THEME PREFERENCE (Dark, Light, System) */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Palette size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Appearance Theme
          </h3>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Choose your preferred theme. Current active: <strong style={{ textTransform: 'capitalize' }}>{resolvedTheme}</strong>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            style={{
              padding: '14px 12px',
              borderRadius: 'var(--radius-md)',
              background: theme === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)',
              border: theme === 'dark' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              color: theme === 'dark' ? 'var(--accent-primary-light)' : 'var(--text-secondary)',
              flexDirection: 'column',
              gap: '6px',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            <Moon size={18} />
            <span>Dark</span>
          </button>

          {/* Light Mode */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            style={{
              padding: '14px 12px',
              borderRadius: 'var(--radius-md)',
              background: theme === 'light' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)',
              border: theme === 'light' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              color: theme === 'light' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              flexDirection: 'column',
              gap: '6px',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            <Sun size={18} />
            <span>Light</span>
          </button>

          {/* System Mode */}
          <button
            type="button"
            onClick={() => setTheme('system')}
            style={{
              padding: '14px 12px',
              borderRadius: 'var(--radius-md)',
              background: theme === 'system' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)',
              border: theme === 'system' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              color: theme === 'system' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              flexDirection: 'column',
              gap: '6px',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            <Laptop size={18} />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* 2. BACKUP & EXPORT (Data Portability Principle) */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Data Portability & JSON Backup
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          You own 100% of your data. Export your entire knowledge base, attempts history, and schedules anytime.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            type="button"
            onClick={handleExportBackup}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              color: '#FFF',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Download size={16} />
            <span>Export JSON Backup</span>
          </button>

          <label
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Upload size={16} />
            <span>Restore Backup File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {importStatus && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: importStatus.includes('error') ? '#FB7185' : '#34D399' }}>
            {importStatus}
          </div>
        )}
      </div>

      {/* 3. OFFLINE STORAGE DIAGNOSTICS */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Offline Persistence Diagnostics
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Storage Engine</span>
            <strong style={{ color: 'var(--text-primary)' }}>IndexedDB (Dexie.js)</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Storage Usage</span>
            <strong style={{ color: 'var(--text-primary)' }}>{storageEstimate}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Network State</span>
            <strong style={{ color: isOnline ? '#10B981' : '#F43F5E' }}>
              {isOnline ? 'Online (Local Ready)' : 'Offline (Local Active)'}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Pending Sync Outbox</span>
            <strong style={{ color: pendingSyncCount > 0 ? '#F59E0B' : 'var(--text-muted)' }}>
              {pendingSyncCount} mutations queued
            </strong>
          </div>
        </div>
      </div>

      {/* 4. SYNC CONFIGURATION */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Backend Sync Endpoint (Phase 2 Ready)
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Target Spring Boot REST API for mobile & laptop sync.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            value={syncUrl}
            onChange={(e) => setSyncUrl(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
            }}
          />

          <div style={{ marginTop: '4px' }}>
            <button
              type="button"
              onClick={triggerSync}
              disabled={!isOnline}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isOnline ? 1 : 0.5,
              }}
            >
              <Server size={14} />
              <span>Flush Sync Queue</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. RESET SAMPLE DATA */}
      <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--rating-again)', marginBottom: '6px' }}>
          Reset Sample Knowledge Base
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          Reloads the curated default dataset for DSA, Java, and Spring Boot.
        </p>

        <button
          type="button"
          onClick={handleResetSampleData}
          disabled={isResetting}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--rating-again-bg)',
            border: '1px solid var(--rating-again-border)',
            color: 'var(--rating-again)',
            fontWeight: 600,
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RotateCcw size={14} />
          <span>{isResetting ? 'Resetting...' : 'Reset to Default Starter Data'}</span>
        </button>
      </div>
    </div>
  );
};
