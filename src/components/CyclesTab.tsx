import React from 'react';
import { Cycle, Compound, LogEntry, BodyMetric } from '../types';
import { fmt, daysSince } from '../utils';
import { PHASE_OPTIONS, FREQ_OPTIONS } from '../types';
import Empty from './Empty';

interface CyclesTabProps {
  cycles: Cycle[];
  store: {
    compounds: Compound[];
    logs: LogEntry[];
    bodyMetrics: BodyMetric[];
  };
  onEditCycle: (cycle: Cycle) => void;
  onDeleteCycle: (id: string) => void;
}

const CyclesTab: React.FC<CyclesTabProps> = ({ cycles, store, onEditCycle, onDeleteCycle }) => {
  const sectionH = {
    fontSize: 10,
    color: 'var(--muted)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    marginBottom: 12,
    marginTop: 6,
  };

  const card = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
  };

  const dot = (color: string) => ({
    width: 10,
    height: 10,
    borderRadius: '50%' as const,
    background: color,
    flexShrink: 0,
    boxShadow: `0 0 8px ${color}`,
  });

  const tag = (color: string) => ({
    display: 'inline-block',
    padding: '2px 9px',
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    background: `${color}22`,
    color: color,
    border: `1px solid ${color}44`,
    whiteSpace: 'nowrap' as const,
  });

  const btn = {
    padding: '5px 10px',
    fontSize: 10,
    background: 'transparent',
    color: 'var(--muted)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    fontFamily: 'inherit',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    marginRight: 0,
  };

  const btnDanger = {
    background: 'none',
    border: 'none',
    color: 'rgba(255,80,80,0.5)',
    fontSize: 11,
    padding: '4px 6px',
    fontFamily: 'inherit',
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={sectionH}>Cycles ({cycles.length})</div>
        <button style={{ padding: '7px 11px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const, background: 'rgba(0, 212, 255, 0.12)', color: 'var(--accent)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600 }} onClick={() => onEditCycle({} as Cycle)}>+ Cycle</button>
      </div>
      {cycles.length === 0 && <Empty msg="No cycles yet — add a Cut, Grow, or Maintenance phase" />}
      {cycles.map((c) => {
        const start = new Date(c.startDate);
        const end = c.endDate ? new Date(c.endDate) : new Date();
        const weeks = Math.max(1, Math.round((end.getTime() - start.getTime()) / (86400000 * 7)));

        const inLogs = store.logs.filter(l => l.datetime >= c.startDate && (!c.endDate || l.datetime <= c.endDate + 'T23:59:59'));
        const totals: Record<string, number> = {};
        inLogs.forEach((l) => { totals[l.compoundName] = (totals[l.compoundName] || 0) + l.dose; });

        const bodyIn = store.bodyMetrics.filter(b => b.date >= c.startDate && (!c.endDate || b.date <= c.endDate));
        const wStart = bodyIn[bodyIn.length - 1]?.weight;
        const wEnd = bodyIn[0]?.weight;
        const bfStart = bodyIn[bodyIn.length - 1]?.bf;
        const bfEnd = bodyIn[0]?.bf;

        const col = (PHASE_OPTIONS.find((p) => p.value === c.phase) || {}).color || '#888';

        return (
          <div key={c.id} style={{ ...card, borderColor: `${col}33` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' as const, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={dot(col)} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{fmt(c.startDate)} → {c.endDate ? fmt(c.endDate) : 'ongoing'} · {weeks} weeks</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={tag(col)}>{(PHASE_OPTIONS.find((p) => p.value === c.phase) || {}).label || c.phase}</div>
                <button style={btn} onClick={() => onEditCycle(c)}>edit</button>
                <button style={btnDanger} onClick={() => { if (confirm('Delete this cycle?')) onDeleteCycle(c.id); }}>✕</button>
              </div>
            </div>
            {(wStart || bfStart) && <div style={{ display: 'flex', gap: 18, fontSize: 12, marginBottom: 8, flexWrap: 'wrap' as const }}>
              {wStart && wEnd && <span><span style={{ color: 'var(--muted)' }}>Weight:</span> <strong>{wStart.toFixed(1)}→{wEnd.toFixed(1)}kg</strong> <span style={{ color: wEnd - wStart > 0 ? '#7fff6b' : '#ff6b35' }}>{wEnd - wStart > 0 ? '+' : ''}{(wEnd - wStart).toFixed(1)}</span></span>}
              {bfStart && bfEnd && <span><span style={{ color: 'var(--muted)' }}>BF:</span> <strong>{(bfStart * 100).toFixed(1)}→{(bfEnd * 100).toFixed(1)}%</strong> <span style={{ color: bfEnd - bfStart < 0 ? '#7fff6b' : '#ff6b35' }}>{bfEnd - bfStart > 0 ? '+' : ''}+{((bfEnd - bfStart) * 100).toFixed(1)}</span></span>}
            </div>}
            {Object.keys(totals).length > 0 && <details style={{ fontSize: 11, color: 'var(--muted)' }}>
              <summary style={{ cursor: 'pointer' }}>Compound totals ({Object.keys(totals).length})</summary>
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6 }}>
                {Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([n, t]) => <div key={n} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Mono' }}><span>{n}:</span><strong style={{ color: 'var(--text)' }}>{Math.round(t)}{t > 10 ? '' : '.'}{store.compounds.find((x) => x.name === n)?.unit || 'mg'}</strong></div>)}
              </div>
            </details>}
            {c.notes && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8, fontStyle: 'italic' }}>{c.notes}</div>}
          </div>
        );
      })}
    </>
  );
};

export default CyclesTab;
