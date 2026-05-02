import React from 'react';
import { Compound, LogEntry, Cycle, BodyMetric, BloodPanel, MacroEntry, Activity } from '../types';
import { fmt, daysSince } from '../utils';
import { TYPE_OPTIONS, PHASE_OPTIONS, BP_TARGET, BP_HIGH } from '../types';
import Empty from './Empty';

interface DashboardTabProps {
    store: {
        compounds: Compound[];
        logs: LogEntry[];
        cycles: Cycle[];
        bodyMetrics: BodyMetric[];
        bloods: BloodPanel[];
        macros: MacroEntry[];
        activities: Activity[];
    };
    last7: LogEntry[];
    nextSite: string;
    lastFor: (id: string) => LogEntry | undefined;
    activeCycle: Cycle | undefined;
    onOpenLog: (compound: Compound) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ store, last7, nextSite, lastFor, activeCycle, onOpenLog }) => {
    const lastWeight = store.bodyMetrics[0];
    const lastBP = store.bloods.find(b => b.bp_sys);

    const statCard = (rgb: string) => ({
        background: `rgba(${rgb},0.06)`,
                                       border: `1px solid rgba(${rgb},0.2)`,
                                       borderRadius: 10,
                                       padding: '14px 16px',
    });

    const statNum = (rgb: string) => ({
        fontSize: 28,
        fontWeight: 700,
        color: `rgb(${rgb})`,
                                      lineHeight: 1,
    });

    const statLabel = {
        fontSize: 9,
        color: 'var(--muted)',
        letterSpacing: '0.15em',
        textTransform: 'uppercase' as const,
        marginTop: 4,
    };

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

    const dot = (color: string) => ({
        width: 10,
        height: 10,
        borderRadius: '50%' as const,
        background: color,
        flexShrink: 0,
        boxShadow: `0 0 8px ${color}`,
    });

    const card = {
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 18,
        marginBottom: 14,
    };

    const sectionH = {
        fontSize: 10,
        color: 'var(--muted)',
        letterSpacing: '0.2em',
        textTransform: 'uppercase' as const,
        marginBottom: 12,
        marginTop: 6,
    };

    return (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 18 }}>
        <div style={statCard('0,212,255')}>
        <div style={statNum('0,212,255')}>{store.logs.length}</div>
        <div style={statLabel}>Doses Logged</div>
        </div>
        <div style={statCard('127,255,107')}>
        <div style={statNum('127,255,107')}>{last7.length}</div>
        <div style={statLabel}>Last 7 Days</div>
        </div>
        <div style={statCard('199,125,255')}>
        <div style={statNum('199,125,255')}>{store.cycles.length}</div>
        <div style={statLabel}>Cycles</div>
        </div>
        {lastWeight && (
            <div style={statCard('255,209,102')}>
            <div style={statNum('255,209,102')}>
            {lastWeight.weight?.toFixed(1) || '-'}
            <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6 }}>kg</span>
            </div>
            <div style={statLabel}>Latest Weight</div>
            </div>
        )}
        </div>

        <div style={{ ...card, borderColor: 'rgba(0, 212, 255, 0.2)', marginBottom: 18 }}>
        <div style={{ fontSize: 9, color: 'rgba(0, 212, 255, 0.6)', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
        Suggested Next Site
        </div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{nextSite}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>Based on recent rotation</div>
        </div>

        {lastBP && (
            <div style={card}>
            <div style={sectionH}>Latest BP · {fmt(lastBP.date)}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: lastBP.bp_sys >= BP_HIGH.sys || lastBP.bp_dia >= BP_HIGH.dia ? '#ff6b35' : lastBP.bp_sys <= BP_TARGET.sys && lastBP.bp_dia <= BP_TARGET.dia ? '#7fff6b' : 'var(--accent5)' }}>
            {lastBP.bp_sys}/{lastBP.bp_dia} <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>mmHg</span>
            </div>
            </div>
        )}

        <div style={sectionH}>Protocols</div>
        {store.compounds.length === 0 && <Empty msg="No compounds yet — add some in Protocols tab" />}
        {store.compounds.map((c) => {
            const last = lastFor(c.id);
            return (
                <div key={c.id} className="fade-up" style={{ ...card, borderColor: `${c.color}22`, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const }}>
                <div style={dot(c.color)} />
                <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{c.defaultDose} {c.unit} · {(FREQ_OPTIONS.find(f => f.value === c.frequency) || {}).label}</div>
                {last && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Last: {last.dose}{last.unit} — {daysSince(last.datetime) === 0 ? 'today' : `${daysSince(last.datetime)}d ago`}{last.site && ` · ${last.site}`}</div>}
                </div>
                <div style={tag(c.color)}>{(TYPE_OPTIONS.find(t => t.value === c.type) || {}).label}</div>
                <button style={{ padding: '7px 14px', fontSize: 10, background: 'rgba(0, 212, 255, 0.12)', color: 'var(--accent)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const }} onClick={() => onOpenLog(c)}>Log</button>
                </div>
            );
        })}
        </>
    );
};

export default DashboardTab;
