import React, { useState } from 'react';
import { Compound, GitHubConfig, StravaConfig } from '../types';
import { INJECTION_SITES, TYPE_OPTIONS, FREQ_OPTIONS, PHASE_OPTIONS, SWATCHES, NHS_RANGES, BLOOD_KEYS } from '../types';
import { today, nowDT } from '../utils';

interface ModalsProps {
  modal: { type: string; [key: string]: any };
  setModal: (modal: { type: string; [key: string]: any } | null) => void;
  compounds: Compound[];
  githubConfig: GitHubConfig;
  stravaConfig: StravaConfig;
  onSaveGhConfig: (config: GitHubConfig) => void;
  onClearGhConfig: () => void;
  onSetStravaConfig: (config: Partial<StravaConfig>) => void;
  onAddLog: (form: { compoundId: string; dose: string; site: string; notes: string; datetime?: string }) => void;
  onAddCompound: (form: { name: string; type: string; unit: string; defaultDose: string; color: string; frequency: string }) => void;
  onAddCycle: (form: { name: string; phase: string; startDate: string; endDate: string; notes: string }) => void;
  onUpdateCycle: (id: string, form: { name: string; phase: string; startDate: string; endDate: string; notes: string }) => void;
  onAddBody: (form: { date: string; weight: string; bf: string; notes: string }) => void;
  onAddBloods: (form: Record<string, string>) => void;
  onAddMacros: (form: { date: string; kcal: string; protein: string; carbs: string; fat: string }) => void;
  onImportHistorical: () => void;
  onStravaAuth: () => void;
}

const Modals: React.FC<ModalsProps> = ({ modal, setModal, compounds, githubConfig, stravaConfig, onSaveGhConfig, onClearGhConfig, onSetStravaConfig, onAddLog, onAddCompound, onAddCycle, onUpdateCycle, onAddBody, onAddBloods, onAddMacros, onImportHistorical, onStravaAuth }) => {
  const close = () => setModal(null);
  const modalStyle = { position: 'fixed' as const, inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 };
  const modalBox = { background: '#0d1520', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 460, boxShadow: '0 0 60px rgba(0,212,255,0.08)', maxHeight: '92vh', overflowY: 'auto' as const };
  const modalTitle = { fontSize: 15, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 18, textTransform: 'uppercase' as const };
  const label = { fontSize: 10, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginBottom: 5, display: 'block' as const, marginTop: 2 };
  const input = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', marginBottom: 12 };
  const select = { width: '100%', background: '#0d1520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', marginBottom: 12 };
  const btn = { padding: '10px 18px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const, background: 'rgba(0,212,255,0.12)', color: 'var(--accent)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700 };
  const btnCancel = { padding: '10px 18px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const, background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'inherit', marginRight: 8 };
  const btnDanger = { background: 'none', border: 'none', color: 'rgba(255,80,80,0.5)', fontSize: 11, padding: 0, fontFamily: 'inherit' };
  const siteChip = (a: boolean) => ({ padding: '5px 11px', borderRadius: 6, fontSize: 11, background: a ? 'rgba(0,212,255,0.14)' : 'rgba(255,255,255,0.04)', color: a ? 'var(--accent)' : 'var(--muted)', border: a ? '1px solid rgba(0,212,255,0.3)' : '1px solid var(--faint)', letterSpacing: '0.04em', fontFamily: 'inherit' });
  const Buttons: React.FC<{ onClose: () => void; onSave: () => void; saveLabel?: string }> = ({ onClose, onSave, saveLabel = 'Save' }) => <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}><button style={btnCancel} onClick={onClose}>Cancel</button><button style={btn} onClick={onSave}>{saveLabel}</button></div>;

  if (!modal) return null;

  switch (modal.type) {
    case 'log': return <div style={modalStyle} onClick={(e) => e.target === e.currentTarget && close()}><div style={modalBox}><LogModal compound={modal.compound} compounds={compounds} onClose={close} onSave={onAddLog} /></div></div>;
    case 'compound': return <div style={modalStyle} onClick={(e) => e.target === e.currentTarget && close()}><div style={modalBox}><CompoundModal onClose={close} onSave={onAddCompound} /></div></div>;
    case 'cycle': return <div style={modalStyle} onClick={(e) => e.target === e.currentTarget && close()}><div style={modalBox}><CycleModal cycle={modal.cycle} onClose={close} onSave={(f) => (modal.cycle ? onUpdateCycle(modal.cycle.id, f) : onAddCycle(f))} /></div></div>;
    case 'body': return <div style={modalStyle} onClick={(e) => e.target === e.currentTarget && close()}><div style={modalBox}><BodyModal onClose={close} onSave={onAddBody} /></div></div>;
    case 'bloods': return <div style={modalStyle} onClick={(e) => e.target === e.currentTarget && close()}><div style={modalBox}><BloodsModal bpOnly={modal.bpOnly} onClose={close} onSave={onAddBloods} /></div></div>;
    case 'macros': return <div style={modalStyle} onClick={(e) => e.target === e.currentTarget && close()}><div style={modalBox}><MacrosModal onClose={close} onSave={onAddMacros} /></div></div>;
    case 'import': return <div style={modalStyle} onClick={(e) => e.target === e.currentTarget && close()}><div style={modalBox}><ImportModal onClose={close} onConfirm={onImportHistorical} /></div></div>;
    case 'settings': return <div style={modalStyle} onClick={(e) => e.target === e.currentTarget && close()}><div style={modalBox}><SettingsModal ghConfig={githubConfig} stravaConfig={stravaConfig} onSave={onSaveGhConfig} onClear={onClearGhConfig} onSetStravaConfig={onSetStravaConfig} onClose={close} onStravaAuth={onStravaAuth} /></div></div>;
    default: return null;
  }
};

const LogModal: React.FC<{ compound?: Compound; compounds: Compound[]; onClose: () => void; onSave: (form: { compoundId: string; dose: string; site: string; notes: string; datetime?: string }) => void }> = ({ compound, compounds, onClose, onSave }) => {
  const [f, setF] = useState({ compoundId: compound?.id || '', dose: compound ? compound.defaultDose.toString() : '', site: '', notes: '', datetime: nowDT() });
  const c = compounds.find((x) => x.id === f.compoundId);
  return (
    <>
      <div style={modalTitle}>Log Dose</div>
      <label style={label}>Compound</label>
      <select style={select} value={f.compoundId} onChange={(e) => { const selected = compounds.find((x) => x.id === e.target.value); setF((p) => ({ ...p, compoundId: e.target.value, dose: selected ? selected.defaultDose.toString() : '' })); }}><option value="">— Select —</option>{compounds.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <label style={label}>Dose ({c?.unit || 'unit'})</label>
      <input style={input} type="number" step="any" inputMode="decimal" value={f.dose} onChange={(e) => setF((p) => ({ ...p, dose: e.target.value }))} />
      <label style={label}>Date & Time</label>
      <input style={input} type="datetime-local" value={f.datetime} onChange={(e) => setF((p) => ({ ...p, datetime: e.target.value }))} />
      <label style={label}>Injection Site</label>
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5, marginBottom: 12 }}>{INJECTION_SITES.map((s) => <button key={s} style={siteChip(f.site === s)} onClick={() => setF((p) => ({ ...p, site: p.site === s ? '' : s }))}>{s}</button>)}</div>
      <label style={label}>Notes</label>
      <input style={input} placeholder="optional" value={f.notes} onChange={(e) => setF((p) => ({ ...p, notes: e.target.value }))} />
      <Buttons onClose={onClose} onSave={() => onSave(f)} saveLabel="Log" />
    </>
  );
};

const CompoundModal: React.FC<{ onClose: () => void; onSave: (form: { name: string; type: string; unit: string; defaultDose: string; color: string; frequency: string }) => void }> = ({ onClose, onSave }) => {
  const [f, setF] = useState({ name: '', type: 'trt', unit: 'mg', defaultDose: '', color: '#7fff6b', frequency: 'weekly' });
  return (
    <>
      <div style={modalTitle}>Add Compound</div>
      <label style={label}>Name</label>
      <input style={input} value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} />
      <label style={label}>Type</label>
      <select style={select} value={f.type} onChange={(e) => setF((p) => ({ ...p, type: e.target.value }))}>{TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={label}>Default Dose</label><input style={input} type="number" step="any" inputMode="decimal" value={f.defaultDose} onChange={(e) => setF((p) => ({ ...p, defaultDose: e.target.value }))} /></div>
        <div><label style={label}>Unit</label><select style={select} value={f.unit} onChange={(e) => setF((p) => ({ ...p, unit: e.target.value }))}>{['mg', 'mcg', 'IU', 'ml'].map((u) => <option key={u}>{u}</option>)}</select></div>
      </div>
      <label style={label}>Frequency</label>
      <select style={select} value={f.frequency} onChange={(e) => setF((p) => ({ ...p, frequency: e.target.value }))}>{FREQ_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
      <label style={label}>Colour</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' as const }}>{SWATCHES.map((c) => <div key={c} onClick={() => setF((p) => ({ ...p, color: c }))} style={{ width: 26, height: 26, borderRadius: '50%' as const, background: c, cursor: 'pointer', border: f.color === c ? '3px solid #fff' : '3px solid transparent', boxShadow: f.color === c ? `0 0 10px ${c}` : 'none', transition: 'all 0.15s' }} />)}</div>
      <Buttons onClose={onClose} onSave={() => onSave(f)} saveLabel="Add" />
    </>
  );
};

const CycleModal: React.FC<{ cycle?: any; onClose: () => void; onSave: (form: { name: string; phase: string; startDate: string; endDate: string; notes: string }) => void }> = ({ cycle, onClose, onSave }) => {
  const [f, setF] = useState({ name: cycle?.name || '', phase: cycle?.phase || 'cut', startDate: cycle?.startDate || today(), endDate: cycle?.endDate || '', notes: cycle?.notes || '' });
  return (
    <>
      <div style={modalTitle}>{cycle ? 'Edit Cycle' : 'New Cycle'}</div>
      <label style={label}>Name</label>
      <input style={input} placeholder="e.g. Cut 2026, Grow 25-26" value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} />
      <label style={label}>Phase</label>
      <select style={select} value={f.phase} onChange={(e) => setF((p) => ({ ...p, phase: e.target.value }))}>{PHASE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={label}>Start Date</label><input style={input} type="date" value={f.startDate} onChange={(e) => setF((p) => ({ ...p, startDate: e.target.value }))} /></div>
        <div><label style={label}>End Date</label><input style={input} type="date" value={f.endDate} onChange={(e) => setF((p) => ({ ...p, endDate: e.target.value }))} placeholder="leave blank if ongoing" /></div>
      </div>
      <label style={label}>Notes</label>
      <textarea style={{ ...input, minHeight: 60, resize: 'vertical' as const }} value={f.notes} onChange={(e) => setF((p) => ({ ...p, notes: e.target.value }))} />
      <Buttons onClose={onClose} onSave={() => onSave(f)} saveLabel={cycle ? 'Save' : 'Create'} />
    </>
  );
};

const BodyModal: React.FC<{ onClose: () => void; onSave: (form: { date: string; weight: string; bf: string; notes: string }) => void }> = ({ onClose, onSave }) => {
  const [f, setF] = useState({ date: today(), weight: '', bf: '', notes: '' });
  return (
    <>
      <div style={modalTitle}>Log Weight & BF</div>
      <label style={label}>Date</label>
      <input style={input} type="date" value={f.date} onChange={(e) => setF((p) => ({ ...p, date: e.target.value }))} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={label}>Weight (kg)</label><input style={input} type="number" step="0.1" inputMode="decimal" value={f.weight} onChange={(e) => setF((p) => ({ ...p, weight: e.target.value }))} /></div>
        <div><label style={label}>BF (%)</label><input style={input} type="number" step="0.1" inputMode="decimal" value={f.bf} onChange={(e) => setF((p) => ({ ...p, bf: e.target.value }))} /></div>
      </div>
      <label style={label}>Notes</label>
      <input style={input} placeholder="optional" value={f.notes} onChange={(e) => setF((p) => ({ ...p, notes: e.target.value }))} />
      <Buttons onClose={onClose} onSave={() => onSave(f)} saveLabel="Save" />
    </>
  );
};

const BloodsModal: React.FC<{ bpOnly?: boolean; onClose: () => void; onSave: (form: Record<string, string>) => void }> = ({ bpOnly, onClose, onSave }) => {
  const [f, setF] = useState({ date: today(), bp_sys: '', bp_dia: '', notes: '', ...Object.fromEntries(BLOOD_KEYS.map((k) => [k, ''])) });
  return (
    <>
      <div style={modalTitle}>{bpOnly ? 'Log BP' : 'Log Blood Panel'}</div>
      <label style={label}>Date</label>
      <input style={input} type="date" value={f.date} onChange={(e) => setF((p) => ({ ...p, date: e.target.value }))} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={label}>BP Systolic</label><input style={input} type="number" inputMode="numeric" value={f.bp_sys} onChange={(e) => setF((p) => ({ ...p, bp_sys: e.target.value }))} /></div>
        <div><label style={label}>BP Diastolic</label><input style={input} type="number" inputMode="numeric" value={f.bp_dia} onChange={(e) => setF((p) => ({ ...p, bp_dia: e.target.value }))} /></div>
      </div>
      {!bpOnly && <>
        <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginTop: 8, marginBottom: 6 }}>Hormone Panel</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{['test', 'shbg', 'freeAndro', 'lh', 'oest', 'prolactin', 'fsh', 'albumin'].map((k) => { const r = NHS_RANGES[k]; return <div key={k}><label style={{ ...label, marginBottom: 3 }}>{r.label} <span style={{ textTransform: 'none', color: 'rgba(255,255,255,0.25)' }}>({r.unit})</span></label><input style={{ ...input, marginBottom: 8 }} type="number" step="any" inputMode="decimal" value={f[k]} onChange={(e) => setF((p) => ({ ...p, [k]: e.target.value }))} /></div>; })}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginTop: 8, marginBottom: 6 }}>Lipids & Liver</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{['hdl', 'ldl', 'totalChol', 'alt', 'ast'].map((k) => { const r = NHS_RANGES[k]; return <div key={k}><label style={{ ...label, marginBottom: 3 }}>{r.label} <span style={{ textTransform: 'none', color: 'rgba(255,255,255,0.25)' }}>({r.unit})</span></label><input style={{ ...input, marginBottom: 8 }} type="number" step="any" inputMode="decimal" value={f[k]} onChange={(e) => setF((p) => ({ ...p, [k]: e.target.value }))} /></div>; })}</div>
      </>}
      <Buttons onClose={onClose} onSave={() => onSave(f)} saveLabel="Save" />
    </>
  );
};

const MacrosModal: React.FC<{ onClose: () => void; onSave: (form: { date: string; kcal: string; protein: string; carbs: string; fat: string }) => void }> = ({ onClose, onSave }) => {
  const [f, setF] = useState({ date: today(), kcal: '', protein: '', carbs: '', fat: '' });
  return (
    <>
      <div style={modalTitle}>Log Macros</div>
      <label style={label}>Date</label>
      <input style={input} type="date" value={f.date} onChange={(e) => setF((p) => ({ ...p, date: e.target.value }))} />
      <label style={label}>Calories (kcal)</label>
      <input style={input} type="number" inputMode="numeric" value={f.kcal} onChange={(e) => setF((p) => ({ ...p, kcal: e.target.value }))} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div><label style={label}>Protein (g)</label><input style={input} type="number" inputMode="numeric" value={f.protein} onChange={(e) => setF((p) => ({ ...p, protein: e.target.value }))} /></div>
        <div><label style={label}>Carbs (g)</label><input style={input} type="number" inputMode="numeric" value={f.carbs} onChange={(e) => setF((p) => ({ ...p, carbs: e.target.value }))} /></div>
        <div><label style={label}>Fat (g)</label><input style={input} type="number" inputMode="numeric" value={f.fat} onChange={(e) => setF((p) => ({ ...p, fat: e.target.value }))} /></div>
      </div>
      <Buttons onClose={onClose} onSave={() => onSave(f)} saveLabel="Save" />
    </>
  );
};

const ImportModal: React.FC<{ onClose: () => void; onConfirm: () => void }> = ({ onClose, onConfirm }) => (
  <>
    <div style={modalTitle}>Import Historical Data</div>
    <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 18 }}>
      This will load <strong style={{ color: 'var(--accent)' }}>seed-data.json</strong> from the same folder as this page (i.e. your GitHub Pages site root) and merge it with your current data.<br /><br />
      <strong style={{ color: 'var(--text)' }}>What gets imported:</strong><br />
      · 3 cycles (Cut 2025, Grow 25-26, Cut 2026)<br />
      · ~1,090 dose entries<br />
      · 23 weigh-ins<br />
      · 20 blood panels<br />
      <br />
      Existing data on the same date will not be overwritten. Any compound names not yet in your list will be added.<br />
      <br />
      <span style={{ color: '#ff6b35' }}>⚠ Make sure <code>seed-data.json</code> is uploaded to your repo first.</span>
    </div>
    <Buttons onClose={onClose} onSave={onConfirm} saveLabel="Import" />
  </>
);

const SettingsModal: React.FC<{ ghConfig: GitHubConfig; stravaConfig: StravaConfig; onSave: (config: GitHubConfig) => void; onClear: () => void; onSetStravaConfig: (config: Partial<StravaConfig>) => void; onClose: () => void; onStravaAuth: () => void }> = ({ ghConfig, stravaConfig, onSave, onClear, onSetStravaConfig, onClose, onStravaAuth }) => {
  const [gh, setGh] = useState(ghConfig); const [sv, setSv] = useState(stravaConfig);
  const ghOk = gh.owner && gh.repo && gh.token;
  const saveStrava = () => { onSetStravaConfig(sv); localStorage.setItem('protocol-strava-config', JSON.stringify(sv)); };
  return (
    <>
      <div style={modalTitle}>⚙ Settings</div>
      <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginBottom: 8, marginTop: 4 }}>GitHub Sync</div>
      <div style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 11, lineHeight: 1.7, color: 'rgba(255,255,255,0.55)' }}>Generate a fine-grained Personal Access Token at github.com → Settings → Developer settings → Fine-grained tokens. Repository access: select your TRT repo. Permissions: <strong style={{ color: 'var(--text)' }}>Contents → Read and write</strong>.</div>
      <label style={label}>GitHub Username</label>
      <input style={input} value={gh.owner} onChange={(e) => setGh((p) => ({ ...p, owner: e.target.value }))} />
      <label style={label}>Repository</label>
      <input style={input} value={gh.repo} onChange={(e) => setGh((p) => ({ ...p, repo: e.target.value }))} />
      <label style={label}>Personal Access Token</label>
      <input style={input} type="password" value={gh.token} onChange={(e) => setGh((p) => ({ ...p, token: e.target.value }))} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 24 }}>{ghOk && <button style={{ ...btnDanger, fontSize: 11 }} onClick={() => { onClear(); onClose(); }}>Disconnect</button>}<button style={btn} onClick={() => { onSave(gh); onClose(); }}>Save GitHub</button></div>
      <div style={{ fontSize: 11, color: 'var(--accent2)', letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginBottom: 8, borderTop: '1px solid var(--border)', paddingTop: 18 }}>Strava (via Cloudflare Worker)</div>
      <div style={{ background: 'rgba(127,255,107,0.05)', border: '1px solid rgba(127,255,107,0.15)', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 11, lineHeight: 1.7, color: 'rgba(255,255,255,0.55)' }}>Setup once: deploy <code>worker.js</code> to Cloudflare Workers (free), set <code>STRAVA_CLIENT_ID</code> and <code>STRAVA_CLIENT_SECRET</code> as Worker secrets, paste the Worker URL below, then tap Authorise. See README for the full walkthrough.</div>
      <label style={label}>Worker URL</label>
      <input style={input} placeholder="https://protocol-strava.YOURNAME.workers.dev" value={sv.workerUrl} onChange={(e) => setSv((p) => ({ ...p, workerUrl: e.target.value }))} />
      {sv.refreshToken ? <div style={{ fontSize: 11, color: '#7fff6b', marginBottom: 10 }}>✓ Connected · last sync {sv.lastSync ? new Date(sv.lastSync).toLocaleDateString('en-GB') : 'never'}</div> : <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>○ Not connected</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8, flexWrap: 'wrap' as const }}><button style={btn} onClick={saveStrava}>Save URL</button><button style={{ ...btn, background: 'rgba(127,255,107,0.12)', color: '#7fff6b', borderColor: 'rgba(127,255,107,0.3)' }} onClick={() => { if (!sv.workerUrl) { alert('Set Worker URL first'); return; } saveStrava(); onStravaAuth(); }}>Authorise Strava</button>{sv.refreshToken && <button style={{ ...btnDanger, fontSize: 11 }} onClick={() => { const c = { ...sv, refreshToken: '', lastSync: null }; setSv(c); onSetStravaConfig(c); localStorage.setItem('protocol-strava-config', JSON.stringify(c)); }}>Disconnect Strava</button>}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18, borderTop: '1px solid var(--border)', paddingTop: 14 }}><button style={btnCancel} onClick={onClose}>Close</button></div>
    </>
  );
};

export default Modals;
