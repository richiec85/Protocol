import React from 'react';
import { LogEntry, Compound } from '../types';
import { fmt, fmtShort, fmtT, daysSince } from '../utils';
import Empty from './Empty';

interface LogTabProps {
  logs: LogEntry[];
  compounds: Compound[];
  onDeleteLog: (id: string) => void;
}

const LogTab: React.FC<LogTabProps> = ({ logs, compounds, onDeleteLog }) => {
  const sectionH = {
    fontSize: 10,
    color: 'var(--muted)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    marginBottom: 12,
    marginTop: 6,
  };

  const dot = (color: string) => ({
    width: 10,
    height: 10,
    borderRadius: '50%' as const,
    background: color,
    flexShrink: 0,
    boxShadow: `0 0 8px ${color}`,
    marginTop: 4,
  });

  const card = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
  };

  return (
    <>
      <div style={sectionH}>Injection History ({logs.length})</div>
      {logs.length === 0 && <Empty msg="No doses yet — tap + to log one" />}
      {logs.slice(0, 150).map((l) => (
        <div key={l.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={dot(l.color)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{l.compoundName}</div>
            <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 1 }}>{l.dose} {l.unit}</div>
            {l.site && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{l.site}</div>}
            {l.notes && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1, fontStyle: 'italic' }}>{l.notes}</div>}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtShort(l.datetime)}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{fmtT(l.datetime)}</div>
            <button style={{ background: 'none', border: 'none', color: 'rgba(255,80,80,0.5)', fontSize: 12, padding: 0, fontFamily: 'inherit', marginTop: 4 }} onClick={() => onDeleteLog(l.id)}>remove</button>
          </div>
        </div>
      ))}
      {logs.length > 150 && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '16px 0', fontSize: 11 }}>Showing newest 150 · {logs.length - 150} more in storage</div>}
    </>
  );
};

export default LogTab;
