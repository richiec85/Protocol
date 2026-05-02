import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    AppState,
    Compound,
    LogEntry,
    Cycle,
    BodyMetric,
    BloodPanel,
    MacroEntry,
    Activity,
    GitHubConfig,
    StravaConfig,
    LOCAL_KEY,
    SCHEMA_VERSION,
} from '../types';
import { emptyStore, uid } from '../utils';

export interface AppStore extends AppState {
    githubConfig: GitHubConfig;
    stravaConfig: StravaConfig;
    syncStatus: 'idle' | 'syncing' | 'ok' | 'error';
    syncMsg: string;
    loaded: boolean;

    // Actions
    addLog: (log: Omit<LogEntry, 'id' | 'datetime'> & { datetime?: string }) => void;
    updateLog: (id: string, updates: Partial<LogEntry>) => void;
    deleteLog: (id: string) => void;

    addCompound: (compound: Omit<Compound, 'id'>) => void;
    updateCompound: (id: string, updates: Partial<Compound>) => void;
    deleteCompound: (id: string) => void;

    addCycle: (cycle: Omit<Cycle, 'id'>) => void;
    updateCycle: (id: string, updates: Partial<Cycle>) => void;
    deleteCycle: (id: string) => void;

    addBodyMetric: (metric: Omit<BodyMetric, 'id'>) => void;
    updateBodyMetric: (id: string, updates: Partial<BodyMetric>) => void;
    deleteBodyMetric: (id: string) => void;

    addBloodPanel: (panel: Omit<BloodPanel, 'id'>) => void;
    updateBloodPanel: (id: string, updates: Partial<BloodPanel>) => void;
    deleteBloodPanel: (id: string) => void;

    addMacro: (macro: Omit<MacroEntry, 'id'>) => void;
    updateMacro: (id: string, updates: Partial<MacroEntry>) => void;
    deleteMacro: (id: string) => void;

    addActivity: (activity: Omit<Activity, 'id'>) => void;
    updateActivity: (id: string, updates: Partial<Activity>) => void;
    deleteActivity: (id: string) => void;

    setCompounds: (compounds: Compound[]) => void;
    setLogs: (logs: LogEntry[]) => void;
    setCycles: (cycles: Cycle[]) => void;
    setBodyMetrics: (metrics: BodyMetric[]) => void;
    setBloods: (bloods: BloodPanel[]) => void;
    setMacros: (macros: MacroEntry[]) => void;
    setActivities: (activities: Activity[]) => void;

    setGitHubConfig: (config: GitHubConfig) => void;
    clearGitHubConfig: () => void;
    setStravaConfig: (config: Partial<StravaConfig>) => void;
    clearStravaConfig: () => void;
    setSyncStatus: (status: 'idle' | 'syncing' | 'ok' | 'error', msg: string) => void;
    setLoaded: (loaded: boolean) => void;
    reset: () => void;
    syncToGitHub: () => Promise<void>;
    syncFromGitHub: () => Promise<void>;
}

const getCurrentState = (get: () => AppStore): AppState => {
    const state = get();
    return {
        compounds: state.compounds,
        logs: state.logs,
        cycles: state.cycles,
        bodyMetrics: state.bodyMetrics,
        bloods: state.bloods,
        macros: state.macros,
        activities: state.activities,
        schemaVersion: state.schemaVersion,
    };
};

const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            ...emptyStore(),
                       githubConfig: { owner: '', repo: 'TRT', token: '' },
                       stravaConfig: { workerUrl: '', refreshToken: '', lastSync: null },
                       syncStatus: 'idle',
                       syncMsg: '',
                       loaded: false,

                       addLog: (log) => set((state) => ({
                           logs: [
                               {
                                   id: uid(),
                                                        compoundId: log.compoundId,
                                                        compoundName: state.compounds.find(c => c.id === log.compoundId)?.name || log.compoundId,
                                                        dose: log.dose,
                                                        unit: state.compounds.find(c => c.id === log.compoundId)?.unit || 'mg',
                                                        site: log.site || '',
                                                        notes: log.notes || '',
                                                        datetime: log.datetime || new Date().toISOString(),
                                                        color: state.compounds.find(c => c.id === log.compoundId)?.color || '#00d4ff',
                                                        type: state.compounds.find(c => c.id === log.compoundId)?.type || 'trt',
                               },
                               ...state.logs,
                           ],
                       })),

                       updateLog: (id, updates) => set((state) => ({
                           logs: state.logs.map(log => log.id === id ? { ...log, ...updates } : log),
                       })),

                       deleteLog: (id) => set((state) => ({
                           logs: state.logs.filter(log => log.id !== id),
                       })),

                       addCompound: (compound) => set((state) => ({
                           compounds: [...state.compounds, { ...compound, id: uid() }],
                       })),

                       updateCompound: (id, updates) => set((state) => ({
                           compounds: state.compounds.map(c => c.id === id ? { ...c, ...updates } : c),
                       })),

                       deleteCompound: (id) => set((state) => ({
                           compounds: state.compounds.filter(c => c.id !== id),
                                                               logs: state.logs.filter(log => log.compoundId !== id),
                       })),

                       addCycle: (cycle) => set((state) => ({
                           cycles: [...state.cycles, { ...cycle, id: uid() }],
                       })),

                       updateCycle: (id, updates) => set((state) => ({
                           cycles: state.cycles.map(c => c.id === id ? { ...c, ...updates } : c),
                       })),

                       deleteCycle: (id) => set((state) => ({
                           cycles: state.cycles.filter(c => c.id !== id),
                       })),

                       addBodyMetric: (metric) => set((state) => ({
                           bodyMetrics: [
                               { ...metric, id: uid() },
                                                                  ...state.bodyMetrics.filter(b => b.date !== metric.date),
                           ].sort((a, b) => b.date.localeCompare(a.date)),
                       })),

                       updateBodyMetric: (id, updates) => set((state) => ({
                           bodyMetrics: state.bodyMetrics.map(b => b.id === id ? { ...b, ...updates } : b),
                       })),

                       deleteBodyMetric: (id) => set((state) => ({
                           bodyMetrics: state.bodyMetrics.filter(b => b.id !== id),
                       })),

                       addBloodPanel: (panel) => set((state) => ({
                           bloods: [
                               { ...panel, id: uid() },
                                                                 ...state.bloods.filter(b => b.date !== panel.date || b.id === panel.id),
                           ].sort((a, b) => b.date.localeCompare(a.date)),
                       })),

                       updateBloodPanel: (id, updates) => set((state) => ({
                           bloods: state.bloods.map(b => b.id === id ? { ...b, ...updates } : b),
                       })),

                       deleteBloodPanel: (id) => set((state) => ({
                           bloods: state.bloods.filter(b => b.id !== id),
                       })),

                       addMacro: (macro) => set((state) => ({
                           macros: [
                               { ...macro, id: uid() },
                                                            ...state.macros.filter(m => m.date !== macro.date),
                           ].sort((a, b) => b.date.localeCompare(a.date)),
                       })),

                       updateMacro: (id, updates) => set((state) => ({
                           macros: state.macros.map(m => m.id === id ? { ...m, ...updates } : m),
                       })),

                       deleteMacro: (id) => set((state) => ({
                           macros: state.macros.filter(m => m.id !== id),
                       })),

                       addActivity: (activity) => set((state) => ({
                           activities: [
                               { ...activity, id: uid() },
                                                                  ...state.activities,
                           ].sort((a, b) => b.date.localeCompare(a.date)),
                       })),

                       updateActivity: (id, updates) => set((state) => ({
                           activities: state.activities.map(a => a.id === id ? { ...a, ...updates } : a),
                       })),

                       deleteActivity: (id) => set((state) => ({
                           activities: state.activities.filter(a => a.id !== id),
                       })),

                       setCompounds: (compounds) => set({ compounds }),
                       setLogs: (logs) => set({ logs }),
                       setCycles: (cycles) => set({ cycles }),
                       setBodyMetrics: (metrics) => set({ bodyMetrics: metrics }),
                       setBloods: (bloods) => set({ bloods }),
                       setMacros: (macros) => set({ macros }),
                       setActivities: (activities) => set({ activities }),

                       setGitHubConfig: (config) => set({ githubConfig: config }),
                       clearGitHubConfig: () => set({
                           githubConfig: { owner: '', repo: 'TRT', token: '' },
                       }),

                       setStravaConfig: (config) => set((state) => ({
                           stravaConfig: { ...state.stravaConfig, ...config },
                       })),
                       clearStravaConfig: () => set({
                           stravaConfig: { workerUrl: '', refreshToken: '', lastSync: null },
                       }),

                       setSyncStatus: (status, msg) => set({ syncStatus: status, syncMsg: msg }),
                       setLoaded: (loaded) => set({ loaded }),

                       reset: () => set(emptyStore()),

                       syncToGitHub: async () => {
                           const { githubConfig, setSyncStatus } = get();
                           if (!githubConfig.owner || !githubConfig.repo || !githubConfig.token) return;
                           setSyncStatus('syncing', 'Saving to GitHub...');
                       },

                       syncFromGitHub: async () => {
                           const { githubConfig, setSyncStatus } = get();
                           if (!githubConfig.owner || !githubConfig.repo || !githubConfig.token) return;
                           setSyncStatus('syncing', 'Fetching from GitHub...');
                       },
        }),
        {
            name: LOCAL_KEY,
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                compounds: state.compounds,
                logs: state.logs,
                cycles: state.cycles,
                bodyMetrics: state.bodyMetrics,
                bloods: state.bloods,
                macros: state.macros,
                activities: state.activities,
                schemaVersion: state.schemaVersion,
            }),
        }
    )
);

export const useCompounds = () => useAppStore((state) => state.compounds);
export const useLogs = () => useAppStore((state) => state.logs);
export const useCycles = () => useAppStore((state) => state.cycles);
export const useBodyMetrics = () => useAppStore((state) => state.bodyMetrics);
export const useBloods = () => useAppStore((state) => state.bloods);
export const useMacros = () => useAppStore((state) => state.macros);
export const useActivities = () => useAppStore((state) => state.activities);
export const useGitHubConfig = () => useAppStore((state) => state.githubConfig);
export const useStravaConfig = () => useAppStore((state) => state.stravaConfig);
export const useSyncStatus = () => useAppStore((state) => ({ status: state.syncStatus, msg: state.syncMsg }));
export const useLoaded = () => useAppStore((state) => state.loaded);

export const useAppActions = () => useAppStore((state) => ({
    addLog: state.addLog,
    updateLog: state.updateLog,
    deleteLog: state.deleteLog,
    addCompound: state.addCompound,
    updateCompound: state.updateCompound,
    deleteCompound: state.deleteCompound,
    addCycle: state.addCycle,
    updateCycle: state.updateCycle,
    deleteCycle: state.deleteCycle,
    addBodyMetric: state.addBodyMetric,
    updateBodyMetric: state.updateBodyMetric,
    deleteBodyMetric: state.deleteBodyMetric,
    addBloodPanel: state.addBloodPanel,
    updateBloodPanel: state.updateBloodPanel,
    deleteBloodPanel: state.deleteBloodPanel,
    addMacro: state.addMacro,
    updateMacro: state.updateMacro,
    deleteMacro: state.deleteMacro,
    addActivity: state.addActivity,
    updateActivity: state.updateActivity,
    deleteActivity: state.deleteActivity,
    setCompounds: state.setCompounds,
    setLogs: state.setLogs,
    setCycles: state.setCycles,
    setBodyMetrics: state.setBodyMetrics,
    setBloods: state.setBloods,
    setMacros: state.setMacros,
    setActivities: state.setActivities,
    setGitHubConfig: state.setGitHubConfig,
    clearGitHubConfig: state.clearGitHubConfig,
    setStravaConfig: state.setStravaConfig,
    clearStravaConfig: state.clearStravaConfig,
    setSyncStatus: state.setSyncStatus,
    setLoaded: state.setLoaded,
    reset: state.reset,
    syncToGitHub: state.syncToGitHub,
    syncFromGitHub: state.syncFromGitHub,
}));

export default useAppStore;
