import React, { useRef, useState } from 'react';

interface Series {
    key: string;
    label: string;
    color: string;
}

interface StackedAreaChartProps {
    data: any[];
    series: Series[];
    xKey?: string;
    height?: number;
    formatY?: (v: number) => string;
    formatX?: (v: any) => string;
    phaseBands?: Array<{ start: string; end: string; color: string; label: string }> | null;
    unit?: string;
}

const StackedAreaChart: React.FC<StackedAreaChartProps> = ({
    data,
    series,
    xKey = 'x',
    height = 220,
    formatY = (v) => Math.round(v).toString(),
        formatX = (v) => v,
            phaseBands = null,
            unit = '',
}) => {
    const ref = useRef<SVGSVGElement>(null);
    const [tip, setTip] = useState<{ x: number; d: any } | null>(null);

    if (!data || !data.length) return <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)' }}>No data yet</div>;

    const W = 720;
    const H = height;
    const L = 44;
    const R = 14;
    const T = 14;
    const B = 34;

    const xs = data.map((d) => new Date(d[xKey]).getTime());
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);

    const totals = data.map((d) => series.reduce((a, s) => a + (d[s.key] || 0), 0));
    let yMax = Math.max(...totals, 1);
    yMax *= 1.1;

    const sx = (t: number) => L + ((t - xMin) / (xMax - xMin)) * (W - L - R);
    const sy = (v: number) => T + (1 - v / yMax) * (H - T - B);

    const onMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
        const x = (clientX - rect.left) * (W / rect.width);

        if (x < L || x > W - R) {
            setTip(null);
            return;
        }

        const t = xMin + ((x - L) / (W - L - R)) * (xMax - xMin);
        let nearest: { d: any } | null = null;
        let bestD = Infinity;

        data.forEach((d) => {
            const dt = Math.abs(new Date(d[xKey]).getTime() - t);
            if (dt < bestD) {
                bestD = dt;
                nearest = { d };
            }
        });

        if (nearest) {
            setTip({ x: sx(new Date(nearest.d[xKey]).getTime()), d: nearest.d });
        }
    };

    const onLeave = () => setTip(null);

    const stacks = series.map((s, si) => {
        return data.map((d, i) => {
            let below = 0;
            for (let j = 0; j < si; j++) {
                below += (d[series[j].key] || 0);
            }
            const v = d[s.key] || 0;
            return { x: sx(new Date(d[xKey]).getTime()), y0: sy(below), y1: sy(below + v) };
        });
    });

    const yTicks = Array.from({ length: 5 }, (_, i) => yMax * i / 4);
    const xTicks = Array.from({ length: 5 }, (_, i) => xMin + ((xMax - xMin) * i) / 4);

    return (
        <div style={{ position: 'relative', width: '100%' }}>
        <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height, display: 'block' }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onTouchStart={onMove}
        onTouchMove={onMove}
        onTouchEnd={onLeave}
        >
        {phaseBands &&
            phaseBands.map((b, i) => {
                const x1 = sx(Math.max(xMin, new Date(b.start).getTime()));
                const x2 = sx(Math.min(xMax, new Date(b.end || xMax).getTime()));
                if (x2 <= x1) return null;
                return (
                    <rect key={i} x={x1} y={T} width={x2 - x1} height={H - T - B} fill={b.color} fillOpacity={0.06} />
                );
            })}

            {yTicks.map((y, i) => (
                <line key={i} x1={L} x2={W - R} y1={sy(y)} y2={sy(y)} stroke="rgba(255,255,255,0.04)" />
            ))}

            {yTicks.map((y, i) => (
                <text
                key={i}
                x={L - 6}
                y={sy(y) + 4}
                textAnchor="end"
                fontSize="9"
                fill="rgba(255,255,255,0.4)"
                fontFamily="DM Mono"
                >
                {formatY(y)}
                </text>
            ))}

            {xTicks.map((t, i) => (
                <text
                key={i}
                x={sx(t)}
                y={H - 12}
                textAnchor="middle"
                fontSize="9"
                fill="rgba(255,255,255,0.4)"
                fontFamily="DM Mono"
                >
                {formatX(new Date(t))}
                </text>
            ))}

            <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="rgba(255,255,255,0.15)" />
            <line x1={L} x2={L} y1={T} y2={H - B} stroke="rgba(255,255,255,0.15)" />

            {series.map((s, si) => {
                const pts = stacks[si];
                const top = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y1).join(' ');
                const bot = pts.slice().reverse().map(p => 'L' + p.x + ',' + p.y0).join(' ');

                return (
                    <path
                    key={s.key}
                    d={top + ' ' + bot + ' Z'}
                    fill={s.color}
                    fillOpacity="0.55"
                    stroke={s.color}
                    strokeWidth="0.8"
                    />
                );
            })}

            {tip && <line x1={tip.x} x2={tip.x} y1={T} y2={H - B} stroke="rgba(0,212,255,0.4)" strokeDasharray="2 2" />}
            </svg>

            {tip && (() => {
                const items = series
                .map((s) => ({ label: s.label, color: s.color, val: tip.d[s.key] }))
                .filter((x) => x.val);

                if (!items.length) return null;

                const total = items.reduce((a, x) => a + x.val, 0);

                return (
                    <div
                    className="chart-tip"
                    style={{
                        left: `${(tip.x / W) * 100}%`,
                        top: 8,
                        transform: `translateX(${tip.x > W * 0.7 ? '-100%' : tip.x < W * 0.3 ? '0' : '-50%'})`,
                    }}
                    >
                    <div style={{ color: 'var(--muted)', marginBottom: 3 }}>{formatX(tip.d[xKey])}</div>
                    {items.map((it, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: it.color,
                        }}
                        />
                        <span>
                        {it.label}: <strong>{formatY(it.val)}{unit}</strong>
                        </span>
                        </div>
                    ))}
                    <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 3 }}>
                    Total: <strong>{formatY(total)}{unit}</strong>
                    </div>
                    </div>
                );
            })()}

            <div
            style={{
                display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 6,
            fontSize: 11,
            }}
            >
            {series.map((s) => (
                <span key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--muted)' }}>
                <span
                style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: s.color,
                    display: 'inline-block',
                    boxShadow: `0 0 6px ${s.color}`,
                }}
                />
                {s.label}
                </span>
            ))}
            </div>
            </div>
    );
};

export default StackedAreaChart;
