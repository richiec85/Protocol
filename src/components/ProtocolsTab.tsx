import React from 'react';
import { Compound } from '../types';
import { TYPE_OPTIONS, FREQ_OPTIONS, SEEDED_COMPOUNDS } from '../types';

interface ProtocolsTabProps {
  compounds: Compound[];
  onDeleteCompound: (id: string) => void;
  onAddMissingSeeded: () => void;
  onImportHistorical: () => void;
}

const ProtocolsTab: React.FC<ProtocolsTabProps> = ({ compounds, onDeleteCompound, onAddMissingSeeded, onImportHistorical }) => {
  const sectionH = { fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: 12, marginTop: 6 };
  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 14 };
  const dot = (color: string) => ({ width: 10, height: 10, borderRadius: '50%' as const, background: color, flexShrink: 0, boxShadow: `0 0 8px ${color}` });
  const tag = (color: string) => ({ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, background: `${color}22`, color: color, border: `1px solid ${color}44`, whiteSpace: 'nowrap' as const });
  const btn = { padding: '7px 11px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const, background: 'rgba(0, 212, 255, 0.12)', color: 'var(--accent)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600 };
  const btnCancel = { padding: '7px 11px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const, background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'inherit', marginRight: 0 };
  const btnDanger = { background: 'none', border: 'none', color: 'rgba(255,80,80,0.5)', fontSize: 11, padding: '4px 8px', fontFamily: 'inherit' };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' as const, gap: 6 }}>
        <div style={sectionH}>Compounds ({compounds.length})</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={btnCancel} onClick={onAddMissingSeeded}>Add Standard List</button>
          <button style={btn} onClick={() => {}}>+ Compound</button>
        </div>
      </div>
      {compounds.map((c) => (
        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' as const }}>
          <div style={dot(c.color)} />
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{c.defaultDose} {c.unit} · {(FREQ_OPTIONS.find((f) => f.value === c.frequency) || {}).label}</div>
          </div>
          <div style={tag(c.color)}>{(TYPE_OPTIONS.find((t) => t.value === c.type) || {}).label}</div>
          <button style={btnDanger} onClick={() => { if (confirm(`Delete ${c.name} and all its logs?`)) onDeleteCompound(c.id); }}>✕</button>
        </div>
      ))}
      <div style={{ ...card, marginTop: 24, background: 'transparent', borderColor: 'rgba(199, 125, 255, 0.2)' }}>
        <div style={sectionH}>One-time Historical Import</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 10 }}>Imports your <code>Cycle 2025 2026.xlsx</code> data: 3 cycles, ~1,090 dose entries, 23 body weigh-ins and 20 blood panels. Requires <code>seed-data.json</code> in the same folder. Safe to run multiple times — duplicates are skipped.</div>
        <button style={btn} onClick={onImportHistorical}>Import Historical Data</button>
      </div>
    </>
  );
};

export default ProtocolsTab;
