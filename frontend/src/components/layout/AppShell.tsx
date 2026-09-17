import React, { useState } from 'react';
import {
  Home,
  Flame,
  Layers,
  BookOpen,
  AlertOctagon,
  Settings,
  Zap,
  Wifi,
  WifiOff,
  Code,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sun,
  Moon,
} from 'lucide-react';
import { useNetworkStatus } from '../../sync/useNetworkStatus';
import { useTheme } from '../../core/theme/ThemeContext';

export type NavTab = 'dashboard' | 'revision' | 'library' | 'code' | 'mistakes' | 'progress' | 'settings';

interface AppShellProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  streak: number;
  dueCount: number;
  mistakesCount: number;
  onQuickStart: (minutes: number) => void;
  onOpenAddItemModal?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onSelectTab,
  streak,
  dueCount,
  mistakesCount,
  onQuickStart,
  onOpenAddItemModal,
  children,
}) => {
  const { isOnline, pendingSyncCount } = useNetworkStatus();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: 'var(--bg-canvas)' }}>
      {/* DESKTOP SIDEBAR (Visible on >= 768px) */}
      <aside
        className="hide-mobile"
        style={{
          width: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
        }}
      >
        {/* Sidebar Header */}
        <div>
          <div
            style={{
              padding: '18px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            {!sidebarCollapsed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/icon.svg" alt="Sensai" style={{ width: '30px', height: '30px', borderRadius: '8px' }} />
                <div>
                  <h1 style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
                    DEARSENSAI
                  </h1>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Revision Companion
                  </span>
                </div>
              </div>
            ) : (
              <img src="/icon.svg" alt="Sensai" style={{ width: '26px', height: '26px', borderRadius: '6px' }} />
            )}

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                color: 'var(--text-muted)',
                padding: '4px',
                borderRadius: '6px',
              }}
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Quick 5m Action Button */}
          <div style={{ padding: '14px 12px 6px 12px' }}>
            <button
              onClick={() => onQuickStart(5)}
              style={{
                width: '100%',
                padding: sidebarCollapsed ? '10px 0' : '9px 12px',
                background: 'var(--accent-primary)',
                color: '#FFF',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px var(--accent-glow)',
              }}
              title="Start 5-min revision"
            >
              <Zap size={15} fill="#FFF" />
              {!sidebarCollapsed && <span>Quick 5m Revise</span>}
            </button>
          </div>

          {/* Nav Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '10px 8px' }}>
            <NavItem
              icon={<Home size={17} />}
              label="Dashboard"
              active={currentTab === 'dashboard'}
              collapsed={sidebarCollapsed}
              onClick={() => onSelectTab('dashboard')}
            />

            <NavItem
              icon={<Layers size={17} />}
              label="Review"
              badge={dueCount > 0 ? dueCount : undefined}
              badgeColor="var(--accent-primary)"
              active={currentTab === 'revision'}
              collapsed={sidebarCollapsed}
              onClick={() => onSelectTab('revision')}
            />

            <NavItem
              icon={<BookOpen size={17} />}
              label="Library"
              active={currentTab === 'library'}
              collapsed={sidebarCollapsed}
              onClick={() => onSelectTab('library')}
            />

            <NavItem
              icon={<Code size={17} />}
              label="Code Recall"
              active={currentTab === 'code'}
              collapsed={sidebarCollapsed}
              onClick={() => onSelectTab('code')}
            />

            <NavItem
              icon={<AlertOctagon size={17} />}
              label="Mistakes Vault"
              badge={mistakesCount > 0 ? mistakesCount : undefined}
              badgeColor="var(--rating-again)"
              active={currentTab === 'mistakes'}
              collapsed={sidebarCollapsed}
              onClick={() => onSelectTab('mistakes')}
            />

            <NavItem
              icon={<BarChart2 size={17} />}
              label="Progress"
              active={currentTab === 'progress'}
              collapsed={sidebarCollapsed}
              onClick={() => onSelectTab('progress')}
            />

            <NavItem
              icon={<Settings size={17} />}
              label="Settings"
              active={currentTab === 'settings'}
              collapsed={sidebarCollapsed}
              onClick={() => onSelectTab('settings')}
            />
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)' }}>
          {onOpenAddItemModal && !sidebarCollapsed && (
            <button
              onClick={onOpenAddItemModal}
              style={{
                width: '100%',
                padding: '7px 10px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                marginBottom: '10px',
              }}
            >
              <Plus size={13} />
              <span>Add Custom Item</span>
            </button>
          )}

          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {isOnline ? <Wifi size={12} color="#10B981" /> : <WifiOff size={12} color="#F43F5E" />}
                <span>{isOnline ? 'Online Ready' : 'Offline Mode'}</span>
              </div>
              {pendingSyncCount > 0 && (
                <span style={{ color: '#F59E0B' }}>{pendingSyncCount} queued</span>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>
        {/* TOP BAR */}
        <header
          style={{
            height: 'var(--header-height)',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
          }}
        >
          {/* Mobile Brand / Page Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="show-mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/icon.svg" alt="Sensai" style={{ width: '24px', height: '24px', borderRadius: '6px' }} />
              <span style={{ fontFamily: 'var(--font-brand)', fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                DEARSENSAI
              </span>
            </div>

            <div className="hide-mobile" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                {currentTab}
              </span>
            </div>
          </div>

          {/* Right Top Status (Streak, Theme Toggle, Network, Quick Start) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Daily Streak */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: '#F59E0B',
                fontSize: '12px',
                fontWeight: 700,
              }}
              title="Daily Streak"
            >
              <Flame size={13} fill="#F59E0B" />
              <span>{streak}d</span>
            </div>

            {/* Quick Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                padding: '6px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
              title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {resolvedTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Network Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-full)',
                background: isOnline ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                color: isOnline ? '#10B981' : '#F43F5E',
                fontSize: '11px',
                fontWeight: 600,
              }}
              title={isOnline ? 'Online (Ready)' : 'Offline (Local Storage Active)'}
            >
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span className="hide-mobile">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Quick 5m Button (Mobile Top) */}
            <div className="show-mobile-only">
              <button
                onClick={() => onQuickStart(5)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-primary)',
                  color: '#FFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Zap size={12} fill="#FFF" />
                <span>5m</span>
              </button>
            </div>
          </div>
        </header>

        {/* MAIN VIEW CONTENT AREA */}
        <main
          style={{
            flex: 1,
            padding: '16px',
            maxWidth: '1100px',
            width: '100%',
            margin: '0 auto',
          }}
          className="safe-bottom"
        >
          {children}
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR (Visible on < 768px) */}
        <nav
          className="show-mobile-only"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 'var(--bottom-nav-height)',
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 50,
            paddingBottom: 'env(safe-area-inset-bottom, 8px)',
          }}
        >
          <MobileNavButton
            icon={<Home size={19} />}
            label="Home"
            active={currentTab === 'dashboard'}
            onClick={() => onSelectTab('dashboard')}
          />

          <MobileNavButton
            icon={<Layers size={19} />}
            label="Review"
            badge={dueCount > 0 ? dueCount : undefined}
            badgeColor="var(--accent-primary)"
            active={currentTab === 'revision'}
            onClick={() => onSelectTab('revision')}
          />

          <MobileNavButton
            icon={<BookOpen size={19} />}
            label="Library"
            active={currentTab === 'library'}
            onClick={() => onSelectTab('library')}
          />

          <MobileNavButton
            icon={<AlertOctagon size={19} />}
            label="Mistakes"
            badge={mistakesCount > 0 ? mistakesCount : undefined}
            badgeColor="var(--rating-again)"
            active={currentTab === 'mistakes'}
            onClick={() => onSelectTab('mistakes')}
          />

          <MobileNavButton
            icon={<Settings size={19} />}
            label="Settings"
            active={currentTab === 'settings'}
            onClick={() => onSelectTab('settings')}
          />
        </nav>
      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeColor?: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  badge,
  badgeColor = 'var(--accent-primary)',
  active,
  collapsed,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'space-between',
      width: '100%',
      padding: '9px 12px',
      borderRadius: 'var(--radius-md)',
      backgroundColor: active ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
      fontWeight: active ? 700 : 500,
      fontSize: '13px',
    }}
    title={collapsed ? label : undefined}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
      {icon}
      {!collapsed && <span>{label}</span>}
    </div>

    {!collapsed && badge !== undefined && (
      <span
        style={{
          padding: '1px 6px',
          borderRadius: 'var(--radius-full)',
          background: badgeColor,
          color: '#FFF',
          fontSize: '10px',
          fontWeight: 800,
        }}
      >
        {badge}
      </span>
    )}
  </button>
);

interface MobileNavButtonProps {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeColor?: string;
  active: boolean;
  onClick: () => void;
}

const MobileNavButton: React.FC<MobileNavButtonProps> = ({
  icon,
  label,
  badge,
  badgeColor = 'var(--accent-primary)',
  active,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      flexDirection: 'column',
      gap: '3px',
      padding: '6px 10px',
      color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
      position: 'relative',
      minWidth: '52px',
    }}
  >
    <div style={{ position: 'relative' }}>
      {icon}
      {badge !== undefined && (
        <span
          style={{
            position: 'absolute',
            top: '-3px',
            right: '-7px',
            minWidth: '15px',
            height: '15px',
            borderRadius: 'var(--radius-full)',
            background: badgeColor,
            color: '#FFF',
            fontSize: '9px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 2px',
          }}
        >
          {badge}
        </span>
      )}
    </div>
    <span style={{ fontSize: '10px', fontWeight: active ? 700 : 500 }}>{label}</span>
  </button>
);
