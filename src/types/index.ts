// Core data types for the TRT Tracker application

// Compound types
export type CompoundType = 'trt' | 'peptide' | 'ai' | 'hcg' | 'other';
export type Frequency = 'daily' | 'eod' | '2x_week' | 'weekly' | 'biweekly' | 'custom';
export type Unit = 'mg' | 'mcg' | 'IU' | 'ml';

// Phase types
export type Phase = 'cut' | 'grow' | 'maintenance' | 'cruise';

// Injection sites
export const INJECTION_SITES = [
    'Left Glute', 'Right Glute', 'Left Quad', 'Right Quad',
'Left Delt', 'Right Delt', 'Left VG', 'Right VG',
'Abdomen', 'SubQ Belly'
] as const;
export type InjectionSite = typeof INJECTION_SITES[number];

// Blood marker keys
export const BLOOD_KEYS = [
    'test', 'shbg', 'freeAndro', 'lh', 'oest', 'prolactin',
'fsh', 'albumin', 'hdl', 'ldl', 'totalChol', 'alt', 'ast'
] as const;
export type BloodKey = typeof BLOOD_KEYS[number];

// NHS Reference Ranges
export interface ReferenceRange {
    unit: string;
    min: number | null;
    max: number | null;
    label: string;
    goodHigh?: boolean;
    goodLow?: boolean;
}

export const NHS_RANGES: Record<BloodKey, ReferenceRange> = {
    test: { unit: 'nmol/L', min: 8.64, max: 29.0, label: 'Total Testosterone' },
    shbg: { unit: 'nmol/L', min: 18.3, max: 54.1, label: 'SHBG' },
    freeAndro: { unit: '%', min: 24, max: 104, label: 'Free Androgen Index' },
    lh: { unit: 'IU/L', min: 1.7, max: 8.6, label: 'LH' },
    oest: { unit: 'pmol/L', min: 28, max: 156, label: 'Oestradiol' },
    prolactin: { unit: 'mU/L', min: 86, max: 324, label: 'Prolactin' },
    fsh: { unit: 'IU/L', min: 1.5, max: 12.4, label: 'FSH' },
    albumin: { unit: 'g/L', min: 35, max: 50, label: 'Albumin' },
    hdl: { unit: 'mmol/L', min: 1.0, max: null, label: 'HDL Cholesterol', goodHigh: true },
    ldl: { unit: 'mmol/L', min: null, max: 3.0, label: 'LDL Cholesterol', goodLow: true },
    totalChol: { unit: 'mmol/L', min: null, max: 5.0, label: 'Total Cholesterol', goodLow: true },
    alt: { unit: 'U/L', min: 10, max: 40, label: 'ALT' },
    ast: { unit: 'U/L', min: 10, max: 40, label: 'AST' },
};

// BP Targets
export const BP_TARGET = { sys: 120, dia: 80 };
export const BP_HIGH = { sys: 140, dia: 90 };

// Color swatches
export const SWATCHES = [
    '#00d4ff', '#7fff6b', '#ff6b35', '#c77dff', '#ffd166', '#ff6b9d', '#ff5050', '#85d5ff'
] as const;

// Data Models
export interface Compound {
    id: string;
    name: string;
    type: CompoundType;
    unit: Unit;
    defaultDose: number;
    color: string;
    frequency: Frequency;
}

export interface LogEntry {
    id: string;
    compoundId: string;
    compoundName: string;
    dose: number;
    unit: Unit;
    site: InjectionSite | '';
    notes: string;
    datetime: string;
    color: string;
    type: CompoundType;
}

export interface Cycle {
    id: string;
    name: string;
    phase: Phase;
    startDate: string;
    endDate: string | '';
    notes: string;
}

export interface BodyMetric {
    id: string;
    date: string;
    weight: number | null;
    bf: number | null;
    notes: string;
}

export interface BloodPanel {
    id: string;
    date: string;
    bp_sys?: number;
    bp_dia?: number;
    notes?: string;
    [key: string]: any;
}

export interface MacroEntry {
    id: string;
    date: string;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    source: 'manual' | 'mfp';
}

export interface Activity {
    id: string;
    stravaId?: string;
    date: string;
    type: string;
    name: string;
    durationMin: number;
    distanceKm: number;
    kj?: number | null;
    source: 'strava' | 'manual';
}

// Configuration types
export interface GitHubConfig {
    owner: string;
    repo: string;
    token: string;
}

export interface StravaConfig {
    workerUrl: string;
    refreshToken: string;
    lastSync: number | null;
}

// App State
export interface AppState {
    compounds: Compound[];
    logs: LogEntry[];
    cycles: Cycle[];
    bodyMetrics: BodyMetric[];
    bloods: BloodPanel[];
    macros: MacroEntry[];
    activities: Activity[];
    schemaVersion: number;
}

// Seeded compounds
export const SEEDED_COMPOUNDS: Compound[] = [
    { id: 'c-testc', name: 'Testosterone Cypionate', type: 'trt', unit: 'mg', defaultDose: 125, color: '#00d4ff', frequency: '2x_week' },
{ id: 'c-testE', name: 'Testosterone Enanthate', type: 'trt', unit: 'mg', defaultDose: 125, color: '#00d4ff', frequency: '2x_week' },
{ id: 'c-npp', name: 'NPP', type: 'trt', unit: 'mg', defaultDose: 25, color: '#7fff6b', frequency: 'eod' },
{ id: 'c-primo', name: 'Primobolan', type: 'trt', unit: 'mg', defaultDose: 150, color: '#c77dff', frequency: '2x_week' },
{ id: 'c-mast', name: 'Masteron', type: 'trt', unit: 'mg', defaultDose: 100, color: '#ff6b9d', frequency: 'eod' },
{ id: 'c-tbol', name: 'Turinabol', type: 'other', unit: 'mg', defaultDose: 20, color: '#ffd166', frequency: 'daily' },
{ id: 'c-anavar', name: 'Anavar', type: 'other', unit: 'mg', defaultDose: 50, color: '#ffd166', frequency: 'daily' },
{ id: 'c-winny', name: 'Winstrol', type: 'other', unit: 'mg', defaultDose: 25, color: '#ff6b35', frequency: 'daily' },
{ id: 'c-eq', name: 'Equipoise (Boldenone)', type: 'trt', unit: 'mg', defaultDose: 300, color: '#7fff6b', frequency: 'weekly' },
{ id: 'c-tren', name: 'Trenbolone Acetate', type: 'trt', unit: 'mg', defaultDose: 50, color: '#ff6b35', frequency: 'eod' },
{ id: 'c-ment', name: 'Trestolone (MENT)', type: 'trt', unit: 'mg', defaultDose: 5, color: '#c77dff', frequency: 'daily' },
{ id: 'c-hgh', name: 'HGH', type: 'peptide', unit: 'IU', defaultDose: 4, color: '#7fff6b', frequency: 'daily' },
{ id: 'c-reta', name: 'Retatrutide', type: 'peptide', unit: 'mg', defaultDose: 1, color: '#c77dff', frequency: 'weekly' },
{ id: 'c-proviron', name: 'Proviron', type: 'ai', unit: 'mg', defaultDose: 25, color: '#ff6b35', frequency: 'daily' },
{ id: 'c-anastro', name: 'Anastrozole', type: 'ai', unit: 'mg', defaultDose: 0.25, color: '#ff6b35', frequency: 'eod' },
];

// Option types for dropdowns
export interface Option {
    value: string;
    label: string;
    color?: string;
}

export const TYPE_OPTIONS: Option[] = [
    { value: 'trt', label: 'TRT', color: '#00d4ff' },
{ value: 'peptide', label: 'Peptide', color: '#7fff6b' },
{ value: 'ai', label: 'AI / Supp', color: '#ff6b35' },
{ value: 'hcg', label: 'hCG', color: '#c77dff' },
{ value: 'other', label: 'Other', color: '#ffd166' },
];

export const FREQ_OPTIONS: Option[] = [
    { value: 'daily', label: 'Daily' },
{ value: 'eod', label: 'Every Other Day' },
{ value: '2x_week', label: '2x / Week' },
{ value: 'weekly', label: 'Weekly' },
{ value: 'biweekly', label: 'Every 2 Weeks' },
{ value: 'custom', label: 'Custom' },
];

export const PHASE_OPTIONS: Option[] = [
    { value: 'cut', label: 'Cut', color: '#00d4ff' },
{ value: 'grow', label: 'Grow / Bulk', color: '#7fff6b' },
{ value: 'maintenance', label: 'Maintenance', color: '#888' },
{ value: 'cruise', label: 'Cruise / TRT', color: '#c77dff' },
];

// Storage keys
export const LOCAL_KEY = 'protocol-trt-tracker-v2';
export const LEGACY_KEY = 'protocol-trt-tracker-v1';
export const GH_CONFIG_KEY = 'protocol-gh-config';
export const STRAVA_CONFIG_KEY = 'protocol-strava-config';
export const SCHEMA_VERSION = 2;
