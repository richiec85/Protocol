import React, { useRef, useState } from 'react';

interface Series {
    key: string;
    label: string;
    color: string;
}

interface LineChartProps {
    data: any[];
    series: Series[];
    xKey?: string;
    height?: number;
    formatY?: (v: number) => string;
    formatX?: (v: any) => string;
    refRange?: { min: number | null; max: number | null } | null;
    phaseBands?: Array<{ start: string; end: string; color: string; label: string }> | null;
    showGrid?: boolean;
    showLegend?: boolean;
    unit?: string;
}

const LineChart: React.FC<LineChartProps> = ({
    data,
    series,
    xKey = 'x',
    height = 220,
    formatY = (v) => Math.round(v).toString(),
        formatX = (v) => v,
            refRange = null,
            phaseBands = null,
            showGrid = true,
            showLegend = true,
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

    const allY: number[] = [];
    series.forEach((s) => {
        data.forEach((d) => {
            const v = d[s.key];
            if (v != null && !isNaN(v)) allY.push(v);
        });
    });

    if (refRange) {
        if (refRange.min != null) allY.push(refRange.min);
        if (refRange.max != null) allY.push(refRange.max);
    }

    if (!allY.length) return <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)' }}>No values</div>;

    let yMin = Math.min(...allY);
    let yMax = Math.max(...allY);

    if (yMin === yMax) {
        yMin -= 1;
        yMax += 1;
    }

    const pad = (yMax - yMin) * 0.1;
    yMin -= pad;
    yMax += pad;

    if (yMin > 0 && yMin < (yMax - yMin) * 0.3) yMin = 0;

    const sx = (t: number) => L + ((t - xMin) / (xMax - xMin)) * (W - L - R);
    const sy = (v: number) => T + (1 - (v - yMin) / (yMax - yMin)) * (H - T - B);

    const ticks = 4;
    const yTicks = Array.from({ length: ticks + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / ticks);
    const xTicks = Array.from({ length: 5 }, (_, i) => xMin + ((xMax - xMin) * i) / 4);

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
        let nearest: { d: any; i: number } | null = null;
        let bestD = Infinity;

        data.forEach((d, i) => {
            const dt = Math.abs(new Date(d[xKey]).getTime() - t);
            if (dt < bestD) {
                bestD = dt;
                nearest = { d, i };
            }
        });

        if (nearest) {
            setTip({ x: sx(new Date(nearest.d[xKey]).getTime()), d: nearest.d });
        }
    };

    const onLeave = () => setTip(null);

    return (
        <div style={{ position: 'relative', width: '100%' }}>
        <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height, display: 'block', cursor: 'crosshair' }}
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

            {refRange && (refRange.min != null || refRange.max != null) && (() => {
                const y1 = refRange.max != null ? sy(refRange.max) : T;
                const y2 = refRange.min != null ? sy(refRange.min) : H - B;
                return (
                    <rect
                    x={L}
                    y={Math.min(y1, y2)}
                    width={W - L - R}
                    height={Math.abs(y2 - y1)}
                    fill="#7fff6b"
                    fillOpacity={0.05}
                    stroke="#7fff6b"
                    strokeOpacity={0.2}
                    strokeDasharray="3 3"
                    />
                );
            })()}

            {showGrid &&
                yTicks.map((y, i) => (
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

                {series.map((s) => {
                    const pts = data
                    .filter((d) => d[s.key] != null && !isNaN(d[s.key]))
                    .map((d) => [sx(new Date(d[xKey]).getTime()), sy(d[s.key])]);

                    if (!pts.length) return null;

                    const path = pts
                    .map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1])
                    .join(' ');

                    return (
                        <g key={s.key}>
                        <path
                        d={path}
                        fill="none"
                        stroke={s.color}
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        opacity="0.9"
                        />
                        {pts.map((p, i) => (
                            <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={s.color} stroke="#080c12" strokeWidth="1" />
                        ))}
                        </g>
                    );
                })}

                {tip && <line x1={tip.x} x2={tip.x} y1={T} y2={H - B} stroke="rgba(0,212,255,0.4)" strokeDasharray="2 2" />}
                </svg>

                {tip && (() => {
                    const items = series
                    .map((s) => ({ label: s.label, color: s.color, val: tip.d[s.key] }))
                    .filter((x) => x.val != null);

                    if (!items.length) return null;

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
                                display: 'inline-block',
                            }}
                            />
                            <span>
                            {it.label}: <strong>{formatY(it.val)}{unit}</strong>
                            </span>
                            </div>
                        ))}
                        {tip.d.cycle && (
                            <div style={{ color: 'var(--muted)', marginTop: 3, fontSize: 10 }}>{tip.d.cycle}</div>
                        )}
                        </div>
                    );
                })()}

                {showLegend && series.length > 1 && (
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
                )}
                </div>
    );
};

export default LineChart;
