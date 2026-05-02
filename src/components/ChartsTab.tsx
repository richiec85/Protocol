import React, { useState, useMemo } from 'react';
import { LogEntry, BodyMetric, MacroEntry, BloodPanel, Activity, Compound } from '../types';
import { weekKey } from '../utils';
import { NHS_RANGES, BLOOD_KEYS } from '../types';
import Empty from './Empty';
import LineChart from './LineChart';
import StackedAreaChart from './StackedAreaChart';

interface ChartsTabProps {
  store: {
    logs: LogEntry[];
    bodyMetrics: BodyMetric[];
    macros: MacroEntry[];
    bloods: BloodPanel[];
    activities: Activity[];
    compounds: Compound[];
  };
  subtab: 'doses' | 'body' | 'macros' | 'bp' | 'training' | 'bloods';
  setSubtab: (subtab: 'doses' | 'body' | 'macros' | 'bp' | 'training' | 'bloods') => void;
  phaseBands: Array<{ start: string; end: string; color: string; label: string }>;
}

const ChartsTab: React.FC<ChartsTabProps> = ({ store, subtab, setSubtab, phaseBands }) => {
  const subnav = { display: 'flex', gap: 4, marginBottom: 18, flexWrap: 'wrap' as const };
  const subnavBtn = (a: boolean) => ({
    padding: '6px 12px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const,
    background: a ? 'rgba(127, 255, 107, 0.12)' : 'transparent', color: a ? '#7fff6b' : 'var(--muted)',
    border: a ? '1px solid rgba(127, 255, 107, 0.3)' : '1px solid var(--border)', borderRadius: 6, fontFamily: 'inherit', fontWeight: 600,
  });
  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 14 };
  const sectionH = { fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: 12, marginTop: 6 };

  return (
    <>
      <div style={subnav}>
        {[['doses', 'Dosage'], ['body', 'Body'], ['macros', 'Macros'], ['bp', 'BP'], ['training', 'Training'], ['bloods', 'Bloods']].map(([k, l]) => (
          <button key={k} style={subnavBtn(subtab === k)} onClick={() => setSubtab(k as any)}>{l}</button>
        ))}
      </div>
      {subtab === 'doses' && <DosesChart store={store} phaseBands={phaseBands} />}
      {subtab === 'body' && <BodyChart store={store} phaseBands={phaseBands} />}
      {subtab === 'macros' && <MacrosChart store={store} phaseBands={phaseBands} />}
      {subtab === 'bp' && <BPChart store={store} phaseBands={phaseBands} />}
      {subtab === 'training' && <TrainingChart store={store} phaseBands={phaseBands} />}
      {subtab === 'bloods' && <BloodsChartView store={store} />}
    </>
  );
};

const DosesChart: React.FC<{ store: { logs: LogEntry[]; compounds: Compound[] }; phaseBands: any[] }> = ({ store, phaseBands }) => {
  const [mode, setMode] = useState<'lines' | 'stack'>('lines');
  const data = useMemo(() => {
    const weeks: Record<string, { x: string }> = {};
    store.logs.forEach((l) => { const wk = weekKey(l.datetime); if (!weeks[wk]) weeks[wk] = { x: wk }; weeks[wk][l.compoundName] = (weeks[wk][l.compoundName] || 0) + l.dose; });
    return Object.values(weeks).sort((a, b) => a.x.localeCompare(b.x));
  }, [store.logs]);
  const compounds = useMemo(() => {
    const names = new Set(store.logs.map((l) => l.compoundName));
    return Array.from(names).map((n, i) => { const c = store.compounds.find((x) => x.name === n); return { key: n, label: n, color: c ? c.color : ['#00d4ff', '#7fff6b', '#ff6b35', '#c77dff', '#ffd166', '#ff6b9d', '#ff5050', '#85d5ff'][i % 8], unit: c ? c.unit : 'mg' }; });
  }, [store.logs, store.compounds]);
  const byUnit: Record<string, any[]> = {}; compounds.forEach((c) => { if (!byUnit[c.unit]) byUnit[c.unit] = []; byUnit[c.unit].push(c); });

  if (!data.length) return <Empty msg="No dose history yet" />;
  return (
    <>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, justifyContent: 'flex-end' }}>
        <button style={subnavBtn(mode === 'lines')} onClick={() => setMode('lines')}>Lines</button>
        <button style={subnavBtn(mode === 'stack')} onClick={() => setMode('stack')}>Stacked</button>
      </div>
      {Object.entries(byUnit).map(([unit, cs]) => (
        <div key={unit} style={card}>
          <div style={sectionH}>Weekly Total · {unit}</div>
          {mode === 'lines' ? <LineChart data={data} series={cs} formatY={(v) => (v < 10 ? v.toFixed(1) : Math.round(v))} formatX={(d: string) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })} phaseBands={phaseBands} unit={` ${unit}`} /> : <StackedAreaChart data={data} series={cs} formatY={(v) => Math.round(v)} formatX={(d: string) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })} phaseBands={phaseBands} unit={` ${unit}`} />}
        </div>
      ))}
      {phaseBands.length > 0 && <div style={{ display: 'flex', gap: 14, fontSize: 10, color: 'var(--muted)', flexWrap: 'wrap' as const, justifyContent: 'center', marginTop: 6 }}>{phaseBands.map((b, i) => <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 18, height: 8, background: b.color, opacity: 0.5, borderRadius: 2 }} />{b.label}</span>)}</div>}
    </>
  );
};

const BodyChart: React.FC<{ store: { bodyMetrics: BodyMetric[] }; phaseBands: any[] }> = ({ store, phaseBands }) => {
  const data = [...store.bodyMetrics].sort((a, b) => a.date.localeCompare(b.date)).map((b) => ({ x: b.date, weight: b.weight, bfPct: b.bf ? b.bf * 100 : null }));
  if (!data.length) return <Empty msg="No body data yet" />;
  return <div style={card}><div style={sectionH}>Weight & Body Fat with Cycle Overlay</div><LineChart data={data} series={[{ key: 'weight', color: '#00d4ff', label: 'Weight (kg)' }, { key: 'bfPct', color: '#ffd166', label: 'BF %' }]} formatY={(v) => v.toFixed(1)} formatX={(d: string) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })} phaseBands={phaseBands} /></div>;
};

const MacrosChart: React.FC<{ store: { macros: MacroEntry[]; bodyMetrics: BodyMetric[] }; phaseBands: any[] }> = ({ store, phaseBands }) => {
  const byDate: Record<string, number | undefined> = {}; store.bodyMetrics.forEach((b) => { byDate[b.date] = b.weight; });
  const data = [...store.macros].sort((a, b) => a.date.localeCompare(b.date)).map((m) => ({ x: m.date, kcal: m.kcal, protein: m.protein, weight: byDate[m.date] || null }));
  if (!data.length) return <Empty msg="No macro data yet — import MFP CSV in Health → Macros" />;
  return (
    <>
      <div style={card}><div style={sectionH}>Calories vs Weight</div><LineChart data={data} series={[{ key: 'kcal', color: '#ffd166', label: 'kcal' }, { key: 'weight', color: '#00d4ff', label: 'Weight (kg)' }]} formatY={(v) => Math.round(v)} formatX={(d: string) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })} phaseBands={phaseBands} /></div>
      <div style={card}><div style={sectionH}>Protein Intake</div><LineChart data={data} series={[{ key: 'protein', color: '#7fff6b', label: 'Protein (g)' }]} formatY={(v) => Math.round(v)} formatX={(d: string) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })} phaseBands={phaseBands} unit=" g" /></div>
    </>
  );
};

const BPChart: React.FC<{ store: { bloods: BloodPanel[] }; phaseBands: any[] }> = ({ store, phaseBands }) => {
  const data = store.bloods.filter((b) => b.bp_sys).map((b) => ({ x: b.date, sys: b.bp_sys!, dia: b.bp_dia! })).sort((a, b) => a.x.localeCompare(b.x));
  if (!data.length) return <Empty msg="No BP readings yet" />;
  return <div style={card}><div style={sectionH}>Blood Pressure Trend</div><LineChart data={data} series={[{ key: 'sys', color: '#ff6b35', label: 'Systolic' }, { key: 'dia', color: '#00d4ff', label: 'Diastolic' }]} refRange={{ min: 60, max: 120 }} formatY={(v) => Math.round(v)} formatX={(d: string) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })} phaseBands={phaseBands} unit=" mmHg" /></div>;
};

const TrainingChart: React.FC<{ store: { activities: Activity[]; bodyMetrics: BodyMetric[] }; phaseBands: any[] }> = ({ store, phaseBands }) => {
  const weekly: Record<string, { x: string; minutes: number; km: number }> = {}; store.activities.forEach((a) => { const wk = weekKey(a.date); if (!weekly[wk]) weekly[wk] = { x: wk, minutes: 0, km: 0 }; weekly[wk].minutes += a.durationMin; weekly[wk].km += a.distanceKm; });
  const byDate: Record<string, number | undefined> = {}; store.bodyMetrics.forEach((b) => { byDate[weekKey(b.date)] = b.weight; });
  const data = Object.values(weekly).sort((a, b) => a.x.localeCompare(b.x)).map((w) => ({ ...w, weight: byDate[w.x] || null }));
  if (!data.length) return <Empty msg="No training data yet — connect Strava in Settings" />;
  return <div style={card}><div style={sectionH}>Weekly Training Minutes vs Weight</div><LineChart data={data} series={[{ key: 'minutes', color: '#7fff6b', label: 'Training (min)' }, { key: 'weight', color: '#00d4ff', label: 'Weight (kg)' }]} formatY={(v) => Math.round(v)} formatX={(d: string) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })} phaseBands={phaseBands} /></div>;
};

const BloodsChartView: React.FC<{ store: { bloods: BloodPanel[] } }> = ({ store }) => {
  const sorted = [...store.bloods].sort((a, b) => a.date.localeCompare(b.date));
  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 14 };
  if (!sorted.length) return <Empty msg="No blood panels yet" />;
  return (
    <>
      {BLOOD_KEYS.map((k) => {
        const r = NHS_RANGES[k]; const data = sorted.filter((e) => e[k] != null).map((e) => ({ x: e.date, [k]: e[k] })); if (!data.length) return null;
        return (
          <div key={k} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{r.label}</div><div style={{ fontSize: 10, color: 'var(--muted)' }}>NHS: {r.min ?? '—'}–{r.max ?? '—'} {r.unit}</div>
            </div>
            <LineChart data={data} series={[{ key: k, color: '#7fff6b', label: r.label }]} refRange={{ min: r.min, max: r.max }} height={140} formatY={(v) => v.toFixed(v < 10 ? 2 : 1)} formatX={(d: string) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })} unit={` ${r.unit}`} showLegend={false} />
          </div>
        );
      })}
    </>
  );
};

export default ChartsTab;
