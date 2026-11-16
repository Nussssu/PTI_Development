import { useEffect, useMemo, useRef, useState } from 'react';

/** Series colors (validated: lightness, chroma, colour-blind separation on the white card). */
const VIEWS = '#2563EB';
const VISITORS = '#C08A2E';
const RANGES = [[7, '7 days'], [30, '30 days'], [90, '90 days']];
const H = 240;
const PAD = { l: 40, r: 12, t: 14, b: 28 };

const fmtDay = (d, long) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', long ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' });
const n = (v) => Number(v || 0).toLocaleString('en-US');

/** A "nice" axis maximum and 4 ticks (0, ¼, ½, ¾, max). */
function niceMax(v) {
    const raw = Math.max(1, v / 4);
    const p = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((s) => s * p).find((s) => s >= raw);
    return Math.max(4, Math.round(step * 4));
}

/** Website visits: page views + unique visitors per day (built-in counter). */
export default function VisitsChart({ visits }) {
    const [range, setRange] = useState(30);
    const [hover, setHover] = useState(null);
    const box = useRef(null);
    const [w, setW] = useState(800);

    useEffect(() => {
        if (!box.current) return undefined;
        const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
        ro.observe(box.current);
        return () => ro.disconnect();
    }, []);

    const days = useMemo(() => visits.days.slice(-range), [visits.days, range]);
    const prev = useMemo(() => visits.days.slice(-range * 2, -range), [visits.days, range]);
    const sum = (arr, k) => arr.reduce((a, d) => a + d[k], 0);
    const totalViews = sum(days, 'views');
    const totalVisitors = sum(days, 'visitors');
    const prevViews = sum(prev, 'views');
    const change = prev.length === range && prevViews > 0 ? Math.round(((totalViews - prevViews) / prevViews) * 100) : null;

    const max = niceMax(Math.max(1, ...days.map((d) => d.views)));
    const iw = w - PAD.l - PAD.r;
    const ih = H - PAD.t - PAD.b;
    const x = (i) => PAD.l + (days.length === 1 ? iw / 2 : (i / (days.length - 1)) * iw);
    const y = (v) => PAD.t + ih - (v / max) * ih;
    const line = (k) => days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join('');
    const area = `${line('views')}L${x(days.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
    const every = Math.ceil(days.length / Math.max(2, Math.floor(iw / 90)));
    const empty = totalViews === 0;

    const onMove = (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * w;
        const i = Math.round(((px - PAD.l) / iw) * (days.length - 1));
        setHover(Math.min(days.length - 1, Math.max(0, i)));
    };
    const hd = hover !== null ? days[hover] : null;

    return (
        <div className="a-card a-visits">
            <div className="a-card-head">
                <div>
                    <h2>Website visits</h2>
                    <p className="a-muted sm" style={{ margin: '2px 0 0' }}>Public pages only · admins and bots are not counted{visits.since ? ` · counting since ${fmtDay(visits.since)}` : ''}</p>
                </div>
                <div className="a-tabs" role="tablist" aria-label="Time range">
                    {RANGES.map(([k, l]) => <button key={k} role="tab" aria-selected={range === k} className={range === k ? 'is-active' : ''} onClick={() => { setRange(k); setHover(null); }}>{l}</button>)}
                </div>
            </div>

            <div className="a-visit-kpis">
                <div><small>Page views</small><b>{n(totalViews)}</b>{change !== null && <em className={change >= 0 ? 'up' : 'down'}>{change >= 0 ? '▲' : '▼'} {Math.abs(change)}% vs previous {range} days</em>}</div>
                <div><small>Unique visitors</small><b>{n(totalVisitors)}</b><em>counted once per day</em></div>
                <div><small>Views per day</small><b>{n(Math.round((totalViews / range) * 10) / 10)}</b><em>average</em></div>
            </div>

            <div className="a-legend" aria-hidden="true">
                <span><i style={{ background: VIEWS }} /> Page views</span>
                <span><i className="ln" style={{ background: VISITORS }} /> Unique visitors</span>
            </div>

            <div className="a-chart" ref={box}>
                <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} role="img"
                    aria-label={`Website visits, last ${range} days: ${totalViews} page views, ${totalVisitors} unique visitors.`}>
                    {ticks.map((t) => (
                        <g key={t}>
                            <line x1={PAD.l} x2={w - PAD.r} y1={y(t)} y2={y(t)} className={t === 0 ? 'a-axis' : 'a-grid'} />
                            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" className="a-tick">{n(t)}</text>
                        </g>
                    ))}
                    {days.map((d, i) => (i % every === 0 || i === days.length - 1) && (days.length - 1 - i >= every * 0.85 || i === days.length - 1) ? (
                        <text key={d.day} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle'} className="a-tick">{fmtDay(d.day)}</text>
                    ) : null)}
                    {!empty && <>
                        <path d={area} fill={VIEWS} opacity=".1" />
                        <path d={line('views')} fill="none" stroke={VIEWS} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                        <path d={line('visitors')} fill="none" stroke={VISITORS} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    </>}
                    {hd && !empty && <>
                        <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={y(0)} className="a-cross" />
                        <circle cx={x(hover)} cy={y(hd.views)} r="4.5" fill={VIEWS} stroke="#fff" strokeWidth="2" />
                        <circle cx={x(hover)} cy={y(hd.visitors)} r="4.5" fill={VISITORS} stroke="#fff" strokeWidth="2" />
                    </>}
                    <rect x={PAD.l} y={0} width={iw} height={H} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} onTouchStart={(e) => onMove(e.touches[0] ? { ...e, clientX: e.touches[0].clientX, currentTarget: e.currentTarget } : e)} />
                </svg>
                {empty && <div className="a-chart-empty">No visits recorded in this period yet. The graph fills in as people open the website.</div>}
                {hd && !empty && (
                    <div className="a-tip" style={x(hover) > w - 210 ? { left: x(hover) - 14, transform: 'translateX(-100%)' } : { left: x(hover) + 14 }}>
                        <b>{fmtDay(hd.day, true)}</b>
                        <span><i style={{ background: VIEWS }} /> Page views <strong>{n(hd.views)}</strong></span>
                        <span><i style={{ background: VISITORS }} /> Unique visitors <strong>{n(hd.visitors)}</strong></span>
                    </div>
                )}
            </div>

            <div className="a-visit-lists">
                <List title="Most visited pages · 30 days" rows={visits.pages.map((p) => [p.path === '/' ? 'Home' : p.path, p.views])} />
                <List title="Where visitors came from · 30 days" rows={visits.sources.map((s) => [s.source, s.views])} />
                <List title="Devices · 30 days" rows={Object.entries(visits.devices).map(([k, v]) => [k[0].toUpperCase() + k.slice(1), v])} />
            </div>
        </div>
    );
}

function List({ title, rows }) {
    const top = Math.max(1, ...rows.map((r) => r[1]));
    return (
        <div className="a-vlist">
            <h3>{title}</h3>
            {rows.length === 0 ? <p className="a-muted sm">No data yet.</p> : rows.map(([label, v]) => (
                <div key={label} className="a-vrow">
                    <span className="a-vbar" style={{ width: `${(v / top) * 100}%` }} />
                    <span className="a-vlabel" title={label}>{label}</span>
                    <b>{n(v)}</b>
                </div>
            ))}
        </div>
    );
}
