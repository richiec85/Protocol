import React from 'react';
import { BodyMetric, BloodPanel, MacroEntry, Activity, StravaConfig } from '../types';
import { fmt } from '../utils';
import { NHS_RANGES, BLOOD_KEYS, BP_TARGET, BP_HIGH } from '../types';
import Empty from './Empty';
import LineChart from './LineChart';

interface HealthTabProps {
  store: {
    bodyMetrics: BodyMetric[];
    bloods: BloodPanel[];
    macros: MacroEntry[];
    activities: Activity[];
  };
  subtab: 'body' | 'bloods' | 'bp' | 'macros' | 'training';
  setSubtab: (subtab: 'body' | 'bloods' | 'bp' | 'macros' | 'training') => void;
  onOpenModal: (type: string, props?: any) => void;
  stravaConfig: StravaConfig;
  onSyncStrava: () => void;
  onSyncStravaFull: () => void;
  onImportMfpCsv: (file: File) => void;
}

const HealthTab: React.FC<HealthTabProps> = ({ store, subtab, setSubtab, onOpenModal, stravaConfig, onSyncStrava, onSyncStravaFull, onImportMfpCsv }) => {
  const subnav = { display: 'flex', gap: 4, marginBottom: 18, flexWrap: 'wrap' as const };
  const subnavBtn = (a: boolean) => ({
    padding: '6px 12px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const,
    background: a ? 'rgba(127, 255, 107, 0.12)' : 'transparent', color: a ? '#7fff6b' : 'var(--muted)',
    border: a ? '1px solid rgba(127, 255, 107, 0.3)' : '1px solid var(--border)', borderRadius: 6, fontFamily: 'inherit', fontWeight: 600,
  });
  const sectionH = { fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: 12, marginTop: 6 };
  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 14 };
  const btn = { padding: '8px 14px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const, background: 'rgba(0, 212, 255, 0.12)', color: 'var(--accent)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700 };
  const btnDanger = { background: 'none', border: 'none', color: 'rgba(255,80,80,0.5)', fontSize: 12, padding: 0, fontFamily: 'inherit' };

  return (
    <>
      <div style={subnav}>
        {[['body', 'Weight & BF'], ['bloods', 'Bloods'], ['bp', 'Blood Pressure'], ['macros', 'Macros'], ['training', 'Training']].map(([k, l]) => (
          <button key={k} style={subnavBtn(subtab === k)} onClick={() => setSubtab(k as any)}>{l}</button>
        ))}
      </div>
      {subtab === 'body' && <BodySection store={store} onOpenModal={onOpenModal} />}
      {subtab === 'bloods' && <BloodsSection store={store} onOpenModal={onOpenModal} />}
      {subtab === 'bp' && <BPSection store={store} onOpenModal={onOpenModal} />}
      {subtab === 'macros' && <MacrosSection store={store} onOpenModal={onOpenModal} onImportMfpCsv={onImportMfpCsv} />}
      {subtab === 'training' && <TrainingSection store={store} stravaConfig={stravaConfig} onSyncStrava={onSyncStrava} onSyncStravaFull={onSyncStravaFull} onOpenModal={onOpenModal} />}
    </>
  );
};

const BodySection: React.FC<{ store: { bodyMetrics: BodyMetric[] }; onOpenModal: (type: string) => void }> = ({ store, onOpenModal }) => {
  const data = [...store.bodyMetrics].sort((a, b) => a.date.localeCompare(b.date));
  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 14 };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>Weight & Body Fat</div>
        <button style={{ padding: '7px 11px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const, background: 'rgba(0, 212, 255, 0.12)', color: 'var(--accent)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600 }} onClick={() => onOpenModal('body')}>+ Entry</button>
      </div>
      {data.length === 0 && <Empty msg="Log your first weigh-in" />}
      {data.length > 0 && <div style={card}><LineChart data={data.map((d) => ({ ...d, x: d.date, bfPct: d.bf ? d.bf * 100 : null }))} series={[{ key: 'weight', color: '#00d4ff', label: 'Weight (kg)' }, { key: 'bfPct', color: '#ffd166', label: 'BF %' }]} formatX={(d: Date) => d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })} /></div>}
      {data.slice().reverse().slice(0, 30).map((b) => (
        <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <div><div style={{ fontSize: 12, color: 'var(--text)' }}>{fmt(b.date)}</div>{b.notes && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1, fontStyle: 'italic' }}>{b.notes}</div>}</div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {b.weight && <span style={{ fontSize: 14, fontWeight: 700 }}>{b.weight.toFixed(1)}<span style={{ fontSize: 10, opacity: 0.5 }}>kg</span></span>}
            {b.bf && <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent5)' }}>{(b.bf * 100).toFixed(1)}<span style={{ fontSize: 10, opacity: 0.5 }}>%</span></span>}
            <button style={{ background: 'none', border: 'none', color: 'rgba(255,80,80,0.5)', fontSize: 12, padding: 0, fontFamily: 'inherit' }}>✕</button>
          </div>
        </div>
      ))}
    </>
  );
};

const BloodsSection: React.FC<{ store: { bloods: BloodPanel[] }; onOpenModal: (type: string) => void }> = ({ store, onOpenModal }) => {
  const sorted = [...store.bloods].sort((a, b) => a.date.localeCompare(b.date));
  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 14 };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>Blood Panels ({store.bloods.length})</div>
        <button style={{ padding: '7px 11px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const, background: 'rgba(0, 212, 255, 0.12)', color: 'var(--accent)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600 }} onClick={() => onOpenModal('bloods')}>+ Panel</button>
      </div>
      {store.bloods.length === 0 && <Empty msg="Log your first blood panel" />}
      {BLOOD_KEYS.map((k) => {
        const r = NHS_RANGES[k];
        const data = sorted.filter((e) => e[k] != null).map((e) => ({ x: e.date, [k]: e[k] }));
        if (!data.length) return null;
        const latest = data[data.length - 1][k];
        const inRange = (r.min === null || latest >= r.min) && (r.max === null || latest <= r.max);
        return (
          <div key={k} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' as const, gap: 6 }}>
              <div><div style={{ fontSize: 13, fontWeight: 700 }}>{r.label}</div><div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>NHS range: {r.min ?? '—'} – {r.max ?? '—'} {r.unit}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 18, fontWeight: 700, color: inRange ? '#7fff6b' : '#ff6b35' }}>{latest} <span style={{ fontSize: 10, opacity: 0.6 }}>{r.unit}</span></div><div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 1 }}>{inRange ? '✓ in range' : '⚠ out of range'}</div></div>
            </div>
            <LineChart data={data} series={[{ key: k, color: inRange ? '#7fff6b' : '#ff6b35', label: r.label }]} refRange={{ min: r.min, max: r.max }} height={150} formatY={(v) => v.toFixed(v < 10 ? 2 : 1)} formatX={(d: string) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })} unit={` ${r.unit}`} showLegend={false} />
          </div>
        );
      })}
      <div style={{ ...card, marginTop: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Recent Panels</div>
        {store.bloods.slice(0, 10).map((b) => (
          <div key={b.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontSize: 12, fontWeight: 700 }}>{fmt(b.date)}</div><button style={{ background: 'none', border: 'none', color: 'rgba(255,80,80,0.5)', fontSize: 12, padding: 0, fontFamily: 'inherit' }}>remove</button></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 4, marginTop: 4, fontSize: 11 }}>
              {b.bp_sys && <span><span style={{ color: 'var(--muted)' }}>BP:</span> {b.bp_sys}/{b.bp_dia}</span>}
              {BLOOD_KEYS.map((k) => b[k] != null ? <span key={k}><span style={{ color: 'var(--muted)' }}>{k.toUpperCase()}:</span> {b[k]}</span> : null)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

const BPSection: React.FC<{ store: { bloods: BloodPanel[] }; onOpenModal: (type: string, props?: any) => void }> = ({ store, onOpenModal }) => {
  const data = store.bloods.filter((b) => b.bp_sys).map((b) => ({ x: b.date, sys: b.bp_sys!, dia: b.bp_dia! })).sort((a, b) => a.x.localeCompare(b.x));
  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 14 };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>Blood Pressure ({data.length})</div>
        <button style={{ padding: '7px 11px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' as const, background: 'rgba(0, 212, 255, 0.12)', color: 'var(--accent)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600 }} onClick={() => onOpenModal('bloods', { bpOnly: true })}>+ Reading</button>
      </div>
      {data.length === 0 && <Empty msg="No BP readings yet" />}
      {data.length > 0 && <>
        <div style={card}>
          <LineChart data={data} series={[{ key: 'sys', color: '#ff6b35', label: 'Systolic' }, { key: 'dia', color: '#00d4ff', label: 'Diastolic' }]} refRange={{ min: 60, max: BP_TARGET.sys }} formatY={(v) => Math.round(v)} formatX={(d: string) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })} unit=" mmHg" />
          <div style={{ display: 'flex', gap: 14, fontSize: 10, color: 'var(--muted)', marginTop: 8, flexWrap: 'wrap' as const }}><span>Target: ≤{BP_TARGET.sys}/{BP_TARGET.dia}</span><span style={{ color: '#ff6b35' }}>Hypertension threshold: {BP_HIGH.sys}/{BP_HIGH.dia}</span></div>
        </div>
        {data.slice().reverse().slice(0, 20).map((d, i) => {
          const high = d.sys >= BP_HIGH.sys || d.dia >= BP_HIGH.dia;
          const ok = d.sys <= BP_TARGET.sys && d.dia <= BP_TARGET.dia;
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12 }}>{fmt(d.x)}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: high ? '#ff6b35' : ok ? '#7fff6b' : 'var(--accent5)' }}>{d.sys}/{d.dia}</div>
            </div>
          );
        })}
      </>}
    </>
  );
};

const MacrosSection: React.FC<{ store: { macros: MacroEntry[] }; onOpenModal: (type: string) => void; onImportMfpCsv: (file: File) => void }> = ({ store, onOpenModal, onImportMfpCsv }) => {
  const data = [...store.macros].sort((a, b) => a.date.localeCompare(b.date));
  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 14 };
  const byDate: Record<string, number | undefined> = {};
  const aligned = data.map((m) => ({ ...m, x: m.date, weight: byDate[m.date] || null }));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' as const, gap: 6 }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>Macros & Calories ({store.macros.length})</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <label style={{ padding: '8px 14px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const, background: 'rgba(0, 212, 255, 0.12)', color: 'var(--accent)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
            Import MFP CSV
            <input type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) onImportMfpCsv(e.target.files[0]); e.target.value = ''; }} />
          </label>
          <button style={{ padding: '8px 14px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const, background: 'rgba(0, 212, 255, 0.12)', color: 'var(--accent)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600 }} onClick={() => onOpenModal('macros')}>+ Day</button>
        </div>
      </div>
      {data.length === 0 && <div style={{ ...card, fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}><div style={{ color: 'var(--accent)', marginBottom: 8, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>How to import from MFP</div>MyFitnessPal Premium → <strong>Settings → Export Data</strong> → email yourself the CSV → download it → tap <em>Import MFP CSV</em>. The CSV should contain at least Date and Calories columns; Protein/Carbs/Fat are optional.<br /><br />Or tap <em>+ Day</em> to enter manually.</div>}
      {data.length > 0 && <div style={card}><LineChart data={aligned} series={[{ key: 'kcal', color: '#ffd166', label: 'Calories' }, { key: 'weight', color: '#00d4ff', label: 'Weight (kg)' }]} formatY={(v) => Math.round(v)} formatX={(d: string) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })} /></div>}
      {data.slice().reverse().slice(0, 30).map((m) => (
        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 12, flexWrap: 'wrap' as const }}>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 700 }}>{fmt(m.date)}</div><div style={{ fontSize: 10, color: 'var(--muted)' }}>{m.source === 'mfp' ? 'MFP' : 'Manual'}</div></div>
          <div style={{ display: 'flex', gap: 10, fontSize: 11, flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' as const }}>
            <span><span style={{ color: 'var(--muted)' }}>kcal</span> <strong>{m.kcal}</strong></span>
            <span style={{ color: '#7fff6b' }}>P {m.protein}g</span>
            <span style={{ color: '#ffd166' }}>C {m.carbs}g</span>
            <span style={{ color: '#ff6b9d' }}>F {m.fat}g</span>
            <button style={{ background: 'none', border: 'none', color: 'rgba(255,80,80,0.5)', fontSize: 12, padding: 0, fontFamily: 'inherit' }}>✕</button>
          </div>
        </div>
      ))}
    </>
  );
};

const TrainingSection: React.FC<{ store: { activities: Activity[] }; stravaConfig: StravaConfig; onSyncStrava: () => void; onSyncStravaFull: () => void; onOpenModal: (type: string) => void }> = ({ store, stravaConfig, onSyncStrava, onSyncStravaFull, onOpenModal }) => {
  const data = [...store.activities].sort((a, b) => a.date.localeCompare(b.date));
  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 14 };
  const weekly: Record<string, { x: string; minutes: number; sessions: number; km: number }> = {};
  data.forEach((a) => { const wk = a.date.slice(0, 10); if (!weekly[wk]) weekly[wk] = { x: wk, minutes: 0, sessions: 0, km: 0 }; weekly[wk].minutes += a.durationMin; weekly[wk].km += a.distanceKm; weekly[wk].sessions++; });
  const wd = Object.values(weekly).sort((a, b) => a.x.localeCompare(b.x));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' as const, gap: 6 }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>Training ({store.activities.length} activities)</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          {stravaConfig.workerUrl && stravaConfig.refreshToken && <>
            <button style={{ padding: '8px 14px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const, background: 'rgba(0, 212, 255, 0.12)', color: 'var(--accent)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600 }} onClick={onSyncStrava}>↺ New</button>
            <button style={{ padding: '8px 14px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const, background: 'rgba(127, 255, 107, 0.1)', color: '#7fff6b', border: '1px solid rgba(127, 255, 107, 0.3)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600 }} onClick={() => { if (confirm('Replace all stored activities with a full re-fetch from Strava? This may take a minute.')) onSyncStravaFull(); }}>⟳ Full Resync</button>
          </>}
          {(!stravaConfig.workerUrl || !stravaConfig.refreshToken) && <button style={{ padding: '8px 14px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const, background: 'rgba(0, 212, 255, 0.12)', color: 'var(--accent)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600 }} onClick={() => onOpenModal('settings')}>Connect Strava</button>}
        </div>
      </div>
      {!stravaConfig.refreshToken && <div style={{ ...card, fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}><div style={{ color: 'var(--accent)', marginBottom: 8, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>Connect Strava</div>Open <strong>Settings ⚙</strong> → enter your <strong>Cloudflare Worker URL</strong> → tap <strong>Authorise Strava</strong>. Setup instructions are in the README.<br /><br />Tip: enable Garmin Connect → Strava auto-sync inside Garmin's app to pipe Garmin data through Strava automatically.</div>}
      {wd.length > 0 && <div style={card}><div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: 6 }}>Weekly Training Minutes</div><LineChart data={wd} series={[{ key: 'minutes', color: '#7fff6b', label: 'Minutes' }]} formatY={(v) => Math.round(v)} formatX={(d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} unit=" min" /></div>}
      {data.slice().reverse().slice(0, 30).map((a) => (
        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name || a.type}</div><div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{a.type} · {fmt(a.date)}</div></div>
          <div style={{ textAlign: 'right', fontSize: 11 }}><div><strong>{a.durationMin}m</strong>{a.distanceKm > 0 && ` · ${a.distanceKm}km`}</div>{a.kj && <div style={{ fontSize: 9, color: 'var(--muted)' }}>{a.kj} kJ</div>}</div>
        </div>
      ))}
    </>
  );
};

export default HealthTab;
