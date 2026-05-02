import React from 'react';

interface SyncBarProps {
  syncStatus: 'idle' | 'syncing' | 'ok' | 'error';
  syncMsg: string;
  isGhConfigured: boolean;
  onManualSync: () => void;
  onSettings: () => void;
}

const SyncBar: React.FC<SyncBarProps> = ({ syncStatus, syncMsg, isGhConfigured, onManualSync, onSettings }) => {
  const getStatusStyle = () => {
    switch (syncStatus) {
      case 'syncing':
        return {
          background: 'rgba(0, 212, 255, 0.07)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          color: 'var(--accent)',
        };
      case 'ok':
        return {
          background: 'rgba(127, 255, 107, 0.07)',
          border: '1px solid rgba(127, 255, 107, 0.25)',
          color: '#7fff6b',
        };
      case 'error':
        return {
          background: 'rgba(255, 107, 53, 0.07)',
          border: '1px solid rgba(255, 107, 53, 0.25)',
          color: '#ff6b35',
        };
      default:
        return {
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border)',
          color: 'var(--muted)',
        };
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing': return <span className="spin">⟳</span>;
      case 'ok': return <span>✓</span>;
      case 'error': return <span>✕</span>;
      default: return <span>○</span>;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 13px',
        borderRadius: 8,
        marginBottom: 14,
        fontSize: 11,
        ...getStatusStyle(),
      }}
    >
      {getStatusIcon()}
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {syncMsg || (isGhConfigured ? 'GitHub connected' : 'Local only — tap Connect to sync')}
      </span>
      <button
        onClick={onManualSync}
        style={{
          padding: '4px 10px',
          fontSize: 9,
          background: 'transparent',
          color: 'var(--text)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: 6,
          fontFamily: 'inherit',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {isGhConfigured ? '↺' : 'Connect'}
      </button>
      <button
        onClick={onSettings}
        style={{
          padding: '4px 8px',
          fontSize: 10,
          background: 'transparent',
          color: 'var(--muted)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          fontFamily: 'inherit',
          marginRight: 0,
        }}
      >
        ⚙
      </button>
    </div>
  );
};

export default SyncBar;
