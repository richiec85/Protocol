import React, { useEffect, useRef, useCallback } from 'react';
import { useAppStore, useCompounds, useLogs, useCycles, useBodyMetrics, useBloods, useMacros, useActivities, useGitHubConfig, useStravaConfig, useSyncStatus, useAppActions, useLoaded } from './store';
import { fmt, today, nowDT, daysSince, weekKey, uid, emptyStore, normalize, migrateV1, debounce } from './utils';
import { isGitHubConfigured } from './services/github';
import { isStravaConfigured, stravaAuth } from './services/strava';
import { importMfpCsv } from './services/mfp';
import { SEEDED_COMPOUNDS, SCHEMA_VERSION, LOCAL_KEY, LEGACY_KEY, GH_CONFIG_KEY, STRAVA_CONFIG_KEY, INJECTION_SITES, TYPE_OPTIONS, FREQ_OPTIONS, PHASE_OPTIONS, BP_TARGET, BP_HIGH, NHS_RANGES, BLOOD_KEYS, SWATCHES } from './types';
import DashboardTab from './components/DashboardTab';
import LogTab from './components/LogTab';
import CyclesTab from './components/CyclesTab';
import HealthTab from './components/HealthTab';
import ChartsTab from './components/ChartsTab';
import ProtocolsTab from './components/ProtocolsTab';
import Modals from './components/Modals';
import SyncBar from './components/SyncBar';
import Empty from './components/Empty';

const S = {
    app: {
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'var(--font)',
        position: 'relative' as const,
    },
    bgGlow: {
        position: 'fixed' as const,
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none' as const,
        background: 'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0, 212, 255, 0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 90% 100%, rgba(127, 255, 107, 0.04) 0%, transparent 60%)',
    },
    wrap: {
        position: 'relative' as const,
        zIndex: 1,
        maxWidth: 920,
        margin: '0 auto',
        padding: '0 14px 110px',
    },
    header: {
        padding: '24px 0 16px',
        borderBottom: '1px solid rgba(0, 212, 255, 0.12)',
        marginBottom: 24,
    },
    logo: {
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: 'var(--accent)',
        textTransform: 'uppercase' as const,
    },
    subtitle: {
        fontSize: 11,
        color: 'rgba(0, 212, 255, 0.5)',
        letterSpacing: '0.2em',
        marginTop: 2,
    },
    nav: {
        display: 'flex',
        gap: 3,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 3,
        flexWrap: 'wrap' as const,
        marginTop: 14,
    },
    navBtn: (a: boolean) => ({
        padding: '7px 11px',
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        background: a ? 'rgba(0, 212, 255, 0.14)' : 'transparent',
                             color: a ? 'var(--accent)' : 'var(--muted)',
                             border: a ? '1px solid rgba(0, 212, 255, 0.28)' : '1px solid transparent',
                             borderRadius: 6,
                             transition: 'all 0.15s',
                             flex: '1 1 auto',
                             fontWeight: 600,
    }),
    fab: {
        position: 'fixed' as const,
        bottom: 22,
        right: 22,
        zIndex: 100,
        background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
        color: '#080c12',
        border: 'none',
        borderRadius: '50%' as const,
        width: 56,
        height: 56,
        fontSize: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
    },
};

const App: React.FC = () => {
    const [tab, setTab] = React.useState<'dashboard' | 'log' | 'cycles' | 'health' | 'charts' | 'protocols'>('dashboard');
    const [healthSubtab, setHealthSubtab] = React.useState<'body' | 'bloods' | 'bp' | 'macros' | 'training'>('body');
    const [chartsSubtab, setChartsSubtab] = React.useState<'doses' | 'body' | 'macros' | 'bp' | 'training' | 'bloods'>('doses');
    const [modal, setModal] = React.useState<{ type: string; [key: string]: any } | null>(null);

    const compounds = useCompounds();
    const logs = useLogs();
    const cycles = useCycles();
    const bodyMetrics = useBodyMetrics();
    const bloods = useBloods();
    const macros = useMacros();
    const activities = useActivities();
    const githubConfig = useGitHubConfig();
    const stravaConfig = useStravaConfig();
    const syncStatus = useSyncStatus();
    const loaded = useLoaded();

    const {
        addLog,
        addCompound,
        addCycle,
        updateCycle,
        addBodyMetric,
        addBloodPanel,
        addMacro,
        addActivity,
        setCompounds,
        setLogs,
        setCycles,
        setBodyMetrics,
        setBloods,
        setMacros,
        setActivities,
        setGitHubConfig,
        clearGitHubConfig,
        setStravaConfig,
        clearStravaConfig,
        setSyncStatus,
        setLoaded,
    } = useAppActions();

    const shaRef = useRef<string | null>(null);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        try {
            const sc = JSON.parse(localStorage.getItem(STRAVA_CONFIG_KEY) || '{}');
            if (sc.workerUrl) {
                setStravaConfig({ workerUrl: sc.workerUrl || '', refreshToken: sc.refreshToken || '', lastSync: sc.lastSync || null });
            }
        } catch {}

        const params = new URLSearchParams(window.location.search);
        if (params.get('strava_refresh')) {
            const rt = params.get('strava_refresh');
            const saved = JSON.parse(localStorage.getItem(STRAVA_CONFIG_KEY) || '{}');
            const cfg = { ...saved, refreshToken: rt };
            setStravaConfig(cfg);
            localStorage.setItem(STRAVA_CONFIG_KEY, JSON.stringify(cfg));
            window.history.replaceState({}, '', window.location.pathname);
        }

        try {
            const savedCfg = JSON.parse(localStorage.getItem(GH_CONFIG_KEY) || '{}');
            if (savedCfg?.token) {
                setGitHubConfig(savedCfg);
                loadFromGitHub(savedCfg);
                return;
            }
        } catch {}

        loadFromLocal();
    }, []);

    const loadFromLocal = () => {
        let data = null;
        try {
            data = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
        } catch {}

        if (!data) {
            try {
                const v1 = JSON.parse(localStorage.getItem(LEGACY_KEY) || '{}');
                if (v1) data = migrateV1(v1);
            } catch {}
        }

        if (data) {
            useAppStore.setState(normalize(data));
        }
        setLoaded(true);
    };

    const loadFromGitHub = async (cfg: { owner: string; repo: string; token: string }) => {
        setSyncStatus('syncing', 'Fetching from GitHub...');
        try {
            const { ghGet } = await import('./services/github');
            const { content, sha } = await ghGet(cfg);
            if (content) {
                useAppStore.setState(normalize(content.schemaVersion ? content : migrateV1(content)));
                shaRef.current = sha;
                setSyncStatus('ok', `Loaded · ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`);
            } else {
                loadFromLocal();
                setSyncStatus('ok', 'Connected · no remote data yet');
            }
        } catch (e) {
            setSyncStatus('error', `GitHub: ${e instanceof Error ? e.message : 'Unknown error'}`);
            loadFromLocal();
        }
        setLoaded(true);
    };

    useEffect(() => {
        if (!loaded) return;

        localStorage.setItem(LOCAL_KEY, JSON.stringify({
            compounds,
            logs,
            cycles,
            bodyMetrics,
            bloods,
            macros,
            activities,
            schemaVersion: SCHEMA_VERSION,
        }));

        if (isGitHubConfigured(githubConfig)) {
            if (saveTimer.current) clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => pushToGitHub(), 1500);
        }

        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, [compounds, logs, cycles, bodyMetrics, bloods, macros, activities, githubConfig, loaded]);

    const pushToGitHub = async () => {
        setSyncStatus('syncing', 'Saving to GitHub...');
        try {
            const { ghPut } = await import('./services/github');
            const newSha = await ghPut(githubConfig, {
                compounds,
                logs,
                cycles,
                bodyMetrics,
                bloods,
                macros,
                activities,
                schemaVersion: SCHEMA_VERSION,
            }, shaRef.current);
            shaRef.current = newSha;
            setSyncStatus('ok', `Synced · ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`);
        } catch (e) {
            setSyncStatus('error', `Sync: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    };

    const manualSync = async () => {
        if (!isGitHubConfigured(githubConfig)) {
            setModal({ type: 'settings' });
            return;
        }
        setSyncStatus('syncing', 'Pulling...');
        try {
            const { ghGet } = await import('./services/github');
            const { content, sha } = await ghGet(githubConfig);
            if (content) {
                useAppStore.setState(normalize(content));
                shaRef.current = sha;
                setSyncStatus('ok', `Pulled · ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`);
            }
        } catch (e) {
            setSyncStatus('error', `Sync: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    };

    const saveGhConfig = (cfg: { owner: string; repo: string; token: string }) => {
        localStorage.setItem(GH_CONFIG_KEY, JSON.stringify(cfg));
        setGitHubConfig(cfg);
        loadFromGitHub(cfg);
    };

    const clearGhConfig = () => {
        localStorage.removeItem(GH_CONFIG_KEY);
        clearGitHubConfig();
        shaRef.current = null;
        setSyncStatus('idle', '');
    };

    const last7 = logs.filter(l => daysSince(l.datetime) < 7);
    const lastFor = (id: string) => logs.find(l => l.compoundId === id);
    const recentSites = logs.slice(0, 10).map(l => l.site).filter(Boolean) as string[];
    const nextSite = INJECTION_SITES.find(s => !recentSites.slice(0, 4).includes(s)) || INJECTION_SITES[0];

    const sortedCycles = [...cycles].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
    const activeCycle = sortedCycles.find(c => c.startDate <= today() && (!c.endDate || c.endDate >= today()));
    const phaseBands = sortedCycles.map(c => ({ start: c.startDate, end: c.endDate || today(), color: (PHASE_OPTIONS.find(p => p.value === c.phase) || {}).color || '#888', label: c.name }));

    const handleAddLog = (form: { compoundId: string; dose: string; site: string; notes: string; datetime?: string }) => {
        const c = compounds.find(x => x.id === form.compoundId);
        if (!c || !form.dose) return;
        addLog({
            compoundId: c.id,
            dose: parseFloat(form.dose),
               site: form.site,
               notes: form.notes,
               datetime: form.datetime,
        });
        setModal(null);
    };

    const handleAddCompound = (form: { name: string; type: string; unit: string; defaultDose: string; color: string; frequency: string }) => {
        if (!form.name || !form.defaultDose) return;
        addCompound({
            name: form.name,
            type: form.type as any,
            unit: form.unit as any,
            defaultDose: parseFloat(form.defaultDose),
                color: form.color,
                frequency: form.frequency as any,
        });
        setModal(null);
    };

    const handleAddCycle = (form: { name: string; phase: string; startDate: string; endDate: string; notes: string }) => {
        if (!form.name || !form.startDate) return;
        addCycle({
            name: form.name,
            phase: form.phase as any,
            startDate: form.startDate,
            endDate: form.endDate,
            notes: form.notes,
        });
        setModal(null);
    };

    const handleUpdateCycle = (id: string, form: { name: string; phase: string; startDate: string; endDate: string; notes: string }) => {
        updateCycle(id, {
            name: form.name,
            phase: form.phase as any,
            startDate: form.startDate,
            endDate: form.endDate,
            notes: form.notes,
        });
        setModal(null);
    };

    const handleAddBody = (form: { date: string; weight: string; bf: string; notes: string }) => {
        if (!form.date || (!form.weight && !form.bf)) return;
        const w = form.weight ? parseFloat(form.weight) : null;
        const bf = form.bf ? parseFloat(form.bf) / 100 : null;
        addBodyMetric({
            date: form.date,
            weight: w,
            bf,
            notes: form.notes || '',
        });
        setModal(null);
    };

    const handleAddBloods = (form: Record<string, string>) => {
        if (!form.date) return;
        const panel: any = { id: uid(), date: form.date };
        if (form.bp_sys) panel.bp_sys = parseFloat(form.bp_sys);
        if (form.bp_dia) panel.bp_dia = parseFloat(form.bp_dia);
        BLOOD_KEYS.forEach(k => {
            if (form[k] !== '' && form[k] != null && !isNaN(parseFloat(form[k]))) {
                panel[k] = parseFloat(form[k]);
            }
        });
        if (form.notes) panel.notes = form.notes;
        addBloodPanel(panel);
        setModal(null);
    };

    const handleAddMacros = (form: { date: string; kcal: string; protein: string; carbs: string; fat: string }) => {
        if (!form.date || !form.kcal) return;
        addMacro({
            date: form.date,
            kcal: parseFloat(form.kcal),
                 protein: parseFloat(form.protein || '0'),
                 carbs: parseFloat(form.carbs || '0'),
                 fat: parseFloat(form.fat || '0'),
                 source: 'manual',
        });
        setModal(null);
    };

    const handleImportMfpCsv = async (file: File) => {
        try {
            const rows = await importMfpCsv(file);
            if (!rows.length) {
                alert('No rows parsed from this CSV');
                return;
            }
            const dates = new Set(rows.map(r => r.date));
            setMacros([
                ...rows,
                ...macros.filter(x => !dates.has(x.date)),
            ].sort((a, b) => b.date.localeCompare(a.date)));
            alert(`Imported ${rows.length} days of macros from MFP.`);
        } catch (e) {
            alert(`CSV import failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    };

    const handleSyncStrava = async () => {
        if (!stravaConfig.workerUrl || !stravaConfig.refreshToken) {
            alert('Configure Strava in Settings first.');
            return;
        }
        try {
            setSyncStatus('syncing', 'Pulling Strava activities...');
            const { stravaPullActivities } = await import('./services/strava');
            const acts = await stravaPullActivities(
                stravaConfig.workerUrl,
                stravaConfig.refreshToken,
                stravaConfig.lastSync || null,
                (loaded, page) => setSyncStatus('syncing', `Fetching Strava... page ${page} (${loaded} so far)`)
            );
            const existing = new Set(activities.map(a => a.stravaId));
            const fresh = acts.filter(a => !existing.has(a.stravaId));
            setActivities([
                ...fresh.map(a => ({ ...a, id: uid(), source: 'strava' })),
                          ...activities,
            ].sort((a, b) => b.date.localeCompare(a.date)));
            setStravaConfig({ lastSync: Date.now() });
            setSyncStatus('ok', `Strava: ${acts.length} activities loaded`);
        } catch (e) {
            setSyncStatus('error', `Strava: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    };

    const handleSyncStravaFull = async () => {
        if (!confirm('Replace all stored activities with a full re-fetch from Strava? This may take a minute.')) return;
        try {
            setSyncStatus('syncing', 'Pulling Strava activities (full sync)...');
            const { stravaPullActivities } = await import('./services/strava');
            const acts = await stravaPullActivities(
                stravaConfig.workerUrl,
                stravaConfig.refreshToken,
                null,
                (loaded, page) => setSyncStatus('syncing', `Fetching Strava... page ${page} (${loaded} so far)`)
            );
            setActivities(
                acts.map(a => ({ ...a, id: uid(), source: 'strava' })).sort((a, b) => b.date.localeCompare(a.date))
            );
            setStravaConfig({ lastSync: Date.now() });
            setSyncStatus('ok', `Strava: ${acts.length} activities loaded (full sync)`);
        } catch (e) {
            setSyncStatus('error', `Strava: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    };

    const handleImportHistorical = async () => {
        try {
            setSyncStatus('syncing', 'Loading historical data...');
            const r = await fetch('./seed-data.json', { cache: 'no-store' });
            if (!r.ok) throw new Error('seed-data.json not found in this folder');
            const seed = await r.json();
            const byName: Record<string, any> = {};
            compounds.forEach(c => { byName[c.name.toLowerCase()] = c; });
            let newCompounds = [...compounds];
            SEEDED_COMPOUNDS.forEach(sc => {
                if (!byName[sc.name.toLowerCase()]) {
                    newCompounds.push({ ...sc });
                    byName[sc.name.toLowerCase()] = sc;
                }
            });
            const newLogs = seed.logs.map((l: any) => {
                const c = byName[l.compound.toLowerCase()];
                if (!c) return null;
                return {
                    id: uid(),
                                          compoundId: c.id,
                                          compoundName: c.name,
                                          dose: l.dose,
                                          unit: l.unit,
                                          site: '',
                                          notes: `imported - ${l.cycle}`,
                                          datetime: new Date(l.date + 'T09:00:00').toISOString(),
                                          color: c.color,
                                          type: c.type,
                };
            }).filter(Boolean);
            const newCycles = seed.cycles.map((c: any) => ({
                id: uid(),
                                                           name: c.name,
                                                           phase: c.phase || 'cut',
                                                           startDate: c.startDate,
                                                           endDate: c.endDate,
                                                           notes: '',
            }));
            const newBody = seed.bodyMetrics.map((b: any) => ({
                id: uid(),
                                                              date: b.date,
                                                              weight: b.weight,
                                                              bf: b.bf,
                                                              notes: '',
            }));
            const newBloods = seed.bloods.map((b: any) => ({ id: uid(), ...b }));
            useAppStore.setState((state) => {
                const lDates = new Set(state.logs.map(x => x.datetime.slice(0, 10) + x.compoundId));
                const bDates = new Set(state.bodyMetrics.map(x => x.date));
                const blDates = new Set(state.bloods.map(x => x.date));
                return {
                    ...state,
                    compounds: newCompounds,
                    logs: [
                        ...state.logs,
                        ...(newLogs as any[]).filter(l => !lDates.has(l.datetime.slice(0, 10) + l.compoundId)),
                    ].sort((a, b) => b.datetime.localeCompare(a.datetime)),
                                 cycles: [...state.cycles, ...newCycles].filter((c, i, a) => a.findIndex(x => x.name === c.name) === i),
                                 bodyMetrics: [
                                     ...newBody.filter((b: any) => !bDates.has(b.date)),
                                 ...state.bodyMetrics,
                                 ].sort((a, b) => b.date.localeCompare(a.date)),
                                 bloods: [
                                     ...newBloods.filter((b: any) => !blDates.has(b.date)),
                                 ...state.bloods,
                                 ].sort((a, b) => b.date.localeCompare(a.date)),
                };
            });
            setSyncStatus('ok', `Imported ${newLogs.length} doses, ${newBody.length} body, ${newBloods.length} bloods, ${newCycles.length} cycles`);
            setModal(null);
        } catch (e) {
            setSyncStatus('error', `Import: ${e instanceof Error ? e.message : 'Unknown error'}`);
            alert(`Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    };

    const handleAddMissingSeeded = () => {
        const have = new Set(compounds.map(c => c.name.toLowerCase()));
        const missing = SEEDED_COMPOUNDS.filter(s => !have.has(s.name.toLowerCase()));
        if (!missing.length) {
            alert('All seeded compounds are already added.');
            return;
        }
        setCompounds([...compounds, ...missing.map(m => ({ ...m, id: uid() }))]);
        alert(`Added ${missing.length} compounds.`);
    };

    return (
        <div style={S.app}>
        <div style={S.bgGlow} />
        <div style={S.wrap}>
        <div style={S.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
        <div style={S.logo}>⬡ Protocol</div>
        <div style={S.subtitle}>TRT · Cycle · Health Tracker</div>
        </div>
        {activeCycle && (
            <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Active Cycle</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: (PHASE_OPTIONS.find(p => p.value === activeCycle.phase) || {}).color, marginTop: 2 }}>
            {activeCycle.name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>Week {Math.floor(daysSince(activeCycle.startDate) / 7) + 1}</div>
            </div>
        )}
        </div>
        <nav style={S.nav}>
        {[
            ['dashboard', 'Dash'],
            ['log', 'Log'],
            ['cycles', 'Cycles'],
            ['health', 'Health'],
            ['charts', 'Charts'],
            ['protocols', 'Protocols'],
        ].map(([k, l]) => (
            <button key={k} style={S.navBtn(tab === k)} onClick={() => setTab(k as any)}>
            {l}
            </button>
        ))}
        </nav>
        </div>

        <SyncBar
        syncStatus={syncStatus.status}
        syncMsg={syncStatus.msg}
        isGhConfigured={isGitHubConfigured(githubConfig)}
        onManualSync={manualSync}
        onSettings={() => setModal({ type: 'settings' })}
        />

        {tab === 'dashboard' && (
            <DashboardTab
            store={{ compounds, logs, cycles, bodyMetrics, bloods, macros, activities }}
            last7={last7}
            nextSite={nextSite}
            lastFor={lastFor}
            activeCycle={activeCycle}
            onOpenLog={(c) => setModal({ type: 'log', compound: c })}
            />
        )}
        {tab === 'log' && (
            <LogTab
            logs={logs}
            compounds={compounds}
            onDeleteLog={(id) => setLogs(logs.filter(x => x.id !== id))}
            />
        )}
        {tab === 'cycles' && (
            <CyclesTab
            cycles={sortedCycles}
            store={{ compounds, logs, bodyMetrics }}
            onEditCycle={(cycle) => setModal({ type: 'cycle', cycle })}
            onDeleteCycle={(id) => setCycles(cycles.filter(x => x.id !== id))}
            />
        )}
        {tab === 'health' && (
            <HealthTab
            store={{ bodyMetrics, bloods, macros, activities }}
            subtab={healthSubtab}
            setSubtab={setHealthSubtab}
            onOpenModal={(type, props = {}) => setModal({ type, ...props })}
            stravaConfig={stravaConfig}
            onSyncStrava={handleSyncStrava}
            onSyncStravaFull={handleSyncStravaFull}
            onImportMfpCsv={handleImportMfpCsv}
            />
        )}
        {tab === 'charts' && (
            <ChartsTab
            store={{ logs, bodyMetrics, macros, bloods, activities, compounds }}
            subtab={chartsSubtab}
            setSubtab={setChartsSubtab}
            phaseBands={phaseBands}
            />
        )}
        {tab === 'protocols' && (
            <ProtocolsTab
            compounds={compounds}
            onDeleteCompound={(id) => {
                if (confirm(`Delete this compound and all its logs?`)) {
                    setCompounds(compounds.filter(x => x.id !== id));
                    setLogs(logs.filter(l => l.compoundId !== id));
                }
            }}
            onAddMissingSeeded={handleAddMissingSeeded}
            onImportHistorical={() => setModal({ type: 'import' })}
            />
        )}
        </div>

        <button className="fab" style={S.fab} onClick={() => setModal({ type: 'log' })} title="Log injection">
        +
        </button>

        {modal && (
            <Modals
            modal={modal}
            setModal={setModal}
            compounds={compounds}
            githubConfig={githubConfig}
            stravaConfig={stravaConfig}
            onSaveGhConfig={saveGhConfig}
            onClearGhConfig={clearGhConfig}
            onSetStravaConfig={setStravaConfig}
            onAddLog={handleAddLog}
            onAddCompound={handleAddCompound}
            onAddCycle={handleAddCycle}
            onUpdateCycle={handleUpdateCycle}
            onAddBody={handleAddBody}
            onAddBloods={handleAddBloods}
            onAddMacros={handleAddMacros}
            onImportHistorical={handleImportHistorical}
            onStravaAuth={() => stravaConfig.workerUrl && stravaAuth(stravaConfig.workerUrl)}
            />
        )}
        </div>
    );
};

export default App;
