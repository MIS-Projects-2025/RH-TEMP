import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import formatPastDateTimeLabel from "@/Utils/formatPastDateTimeLabel";
import { RiWifiOffLine } from "react-icons/ri";
import { useThemeStore } from "@/Store/themeStore";
import { DARK_THEME_NAME } from "@/Constants/colors";
import { BiCollapse, BiExpand } from "react-icons/bi";
import clsx from "clsx";

// returns "green" | "orange" | "red"
function getLevel(v, min, max, critMin, critMax) {
    const lo = critMin ?? min; // no crit value = no orange band on that side
    const hi = critMax ?? max;
    if (lo != null && v < lo) return "red";
    if (hi != null && v > hi) return "red";
    if ((min != null && v < min) || (max != null && v > max)) return "orange";
    return "green";
}

// order here = display order; colors are pale so the red/orange/lime cards still stand out
// const GROUPS = [
//     { key: "PL1", cls: "bg-[#FC03F0]/20 border-[#FC03F0]/33" },
//     { key: "PL6", cls: "bg-[#F0FC03]/20 border-[#F0FC03]/33" },
//     { key: "PL3", cls: "bg-[#03F0FC]/20 border-[#03F0FC]/33" },
//     { key: "OTHER", cls: "bg-stone-400/20 border-stone-500/33" },
// ];

const GROUPS = [
    { key: "PL1", cls: "fill-[#007ecc]/30 stroke-[#03F0FC] stroke-[1]" },
    { key: "PL6", cls: "fill-[#FC03F0]/25 stroke-[#FC03F0] stroke-[1]" },
    { key: "PL3", cls: "fill-[#F0FC03]/75 stroke-[#F0FC03] stroke-[2]" },
    { key: "OTHER", cls: "fill-stone-400/30 stroke-stone-500 stroke-[1]" },
];

const PAD = 4;
const RADIUS = 20; // outline corner radius

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const toward = (p, q, r) => {
    const d = dist(p, q);
    return [p[0] + ((q[0] - p[0]) / d) * r, p[1] + ((q[1] - p[1]) / d) * r];
};

// rects: [{l, t, r, b}] -> rounded SVG path around their union
function buildOutline(rects) {
    // 1. cluster into rows by top edge
    const rows = [];
    [...rects]
        .sort((a, b) => a.t - b.t || a.l - b.l)
        .forEach((c) => {
            const row = rows.find((r) => Math.abs(r.t - c.t) < 8);
            if (row) {
                row.l = Math.min(row.l, c.l);
                row.r = Math.max(row.r, c.r);
                row.b = Math.max(row.b, c.b);
            } else {
                rows.push({ ...c });
            }
        });

    // 2. inflate sideways, bridge the gap between rows at its midpoint
    rows.forEach((r) => {
        r.l -= PAD;
        r.r += PAD;
    });
    rows.forEach((r, i) => {
        const prev = rows[i - 1];
        const next = rows[i + 1];
        r.top = prev ? (prev.b + r.t) / 2 : r.t - PAD;
        r.bot = next ? (r.b + next.t) / 2 : r.b + PAD;
    });

    // 3. polygon: down the right side, up the left side
    const pts = [];
    rows.forEach((r) => pts.push([r.r, r.top], [r.r, r.bot]));
    for (let i = rows.length - 1; i >= 0; i--) {
        pts.push([rows[i].l, rows[i].bot], [rows[i].l, rows[i].top]);
    }
    const poly = pts.filter((p, i) => {
        const q = pts[(i + 1) % pts.length];
        return p[0] !== q[0] || p[1] !== q[1];
    });

    // 4. rounded corners
    const n = poly.length;
    let d = "";
    poly.forEach((p, i) => {
        const a = poly[(i - 1 + n) % n];
        const b = poly[(i + 1) % n];
        const r = Math.min(RADIUS, dist(p, a) / 2, dist(p, b) / 2);
        const s = toward(p, a, r);
        const e = toward(p, b, r);
        d += `${i === 0 ? "M" : "L"}${s[0]} ${s[1]} Q${p[0]} ${p[1]} ${e[0]} ${e[1]} `;
    });
    return d + "Z";
}

const groupKey = (loc) => {
    const k = /^(PL\d+)/i.exec(loc ?? "")?.[1]?.toUpperCase();
    return GROUPS.some((g) => g.key === k) ? k : "OTHER";
};

const groupRank = (loc) => GROUPS.findIndex((g) => g.key === groupKey(loc));

const isPL = (s) => /^PL\d/i.test(s ?? "");

// PL-prefixed first, then natural sort so "Line 2" < "Line 10" and Ω1 < Ω2
const byLocation = (a, b) =>
    groupRank(a.location) - groupRank(b.location) ||
    (a.location ?? "").localeCompare(b.location ?? "", undefined, {
        numeric: true,
        sensitivity: "base",
    });

const RANK = { green: 0, orange: 1, red: 2 };

function getLevels(temp, rh, th) {
    const invalid = (v) => v === undefined || v === "Offline";

    const t = invalid(temp)
        ? "green"
        : getLevel(parseFloat(temp), th.temp_min, th.temp_max, th.temp_crit_min, th.temp_crit_max);
    const r = invalid(rh)
        ? "green"
        : getLevel(parseFloat(rh), th.rh_min, th.rh_max, th.rh_crit_min, th.rh_crit_max);

    return { temp: t, rh: r, overall: RANK[t] >= RANK[r] ? t : r };
}

const blinkClass = (lvl) =>
    lvl === "red" ? "blink-red" : lvl === "orange" ? "blink-orange" : "";

function getOverallLevel(temp, rh, th) {
    if (temp === "Offline" || rh === "Offline") return "green";
    if (temp === undefined || rh === undefined) return "green";

    const t = getLevel(parseFloat(temp), th.temp_min, th.temp_max, th.temp_crit_min, th.temp_crit_max);
    const r = getLevel(parseFloat(rh), th.rh_min, th.rh_max, th.rh_crit_min, th.rh_crit_max);
    return RANK[t] >= RANK[r] ? t : r; // worst of the two wins
}

function parseDeviceResponse(text) {
    const temp = text.match(/Temperature\s+([\d.]+)/)?.[1] ?? "Offline";
    const rh = text.match(/Humidity\s+([\d.]+)/)?.[1] ?? "Offline";
    const rec = text.match(/Recording\s+(\w+)/)?.[1] ?? "Off";
    return { temp, rh, is_recording: rec };
}

function playAlarm() {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    [0, 0.25, 0.5].forEach((offset) => {
        const oscillator = ctx.createOscillator();
        oscillator.connect(gain);

        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(880, ctx.currentTime + offset);
        oscillator.frequency.setValueAtTime(
            440,
            ctx.currentTime + offset + 0.05,
        );
        oscillator.frequency.setValueAtTime(
            880,
            ctx.currentTime + offset + 0.1,
        );

        gain.gain.setValueAtTime(0.3, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + offset + 0.2,
        );

        oscillator.start(ctx.currentTime + offset);
        oscillator.stop(ctx.currentTime + offset + 0.2);
    });
}

// --- DeviceCard -------------------------------------------------------
const DeviceCard = React.memo(function DeviceCard({
    device: initialDevice,
    thresholds,
    intervalMs = 1000,
    index = 1,
}) {
    const { theme } = useThemeStore();
    const isDarkTheme = theme === DARK_THEME_NAME;

    const [device, setDevice] = useState(initialDevice);
    const [polling, setPolling] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    const tp = device?.threshold_profile;
    const operation_thresholds = {
        temp_min: tp?.temp_min ?? null,
        temp_max: tp?.temp_max ?? null,
        temp_crit_min: tp?.temp_crit_min ?? null,
        temp_crit_max: tp?.temp_crit_max ?? null,
        rh_min: tp?.rh_min ?? null,
        rh_max: tp?.rh_max ?? null,
        rh_crit_min: tp?.rh_crit_min ?? null,
        rh_crit_max: tp?.rh_crit_max ?? null,
    };

    const rh = device.rh;
    const temp = device.temp;
    
    const prevRhRef = useRef(null);
    const prevTempRef = useRef(null);
    const [rhDir, setRhDir] = useState(null);
    const [tempDir, setTempDir] = useState(null);
    
    const isFetching = device.is_recording === undefined;
    const isOffline = rh === "Offline" || rh === undefined;
    
    const levels = isOffline
        ? { temp: "green", rh: "green", overall: "green" }
        : getLevels(temp, rh, operation_thresholds);
    const level = levels.overall;
    const failed = level === "red";
    const warning = level === "orange";
    
    const prevFailedRef = useRef(false);
 
    useEffect(() => {
        if (failed && !prevFailedRef.current) {
            playAlarm();
        }
        prevFailedRef.current = failed;
    }, [failed]);

    useEffect(() => {
        let timeoutId;

        async function poll() {
            try {
                setPolling(true);
                const res = await fetch(
                    `${import.meta.env.VITE_PROXY_URL}/proxy/${initialDevice.ip}/postReadHtml?a`,
                );
                const text = await res.text();
                const parsed = parseDeviceResponse(text);
                setDevice({ ...initialDevice, ...parsed });
                setLastUpdated(new Date());
            } catch {
                setDevice((prev) => ({
                    ...prev,
                    temp: "Offline",
                    rh: "Offline",
                }));
            } finally {
                setPolling(false);
                timeoutId = setTimeout(poll, intervalMs);
            }
        }

        // Stagger start by 300ms per card
        timeoutId = setTimeout(poll, index * 300);
        return () => clearTimeout(timeoutId);
    }, [initialDevice.ip]);

    // Track direction changes
    useEffect(() => {
        if (
            prevRhRef.current !== null &&
            rh !== "Offline" &&
            rh !== undefined
        ) {
            const dir =
                parseFloat(rh) > parseFloat(prevRhRef.current) ? "up" : "down";
            if (parseFloat(rh) !== parseFloat(prevRhRef.current)) {
                setRhDir(dir);
                setTimeout(() => setRhDir(null), 500);
            }
        }
        prevRhRef.current = rh;
    }, [rh]);

    useEffect(() => {
        if (
            prevTempRef.current !== null &&
            temp !== "Offline" &&
            temp !== undefined
        ) {
            const dir =
                parseFloat(temp) > parseFloat(prevTempRef.current)
                    ? "up"
                    : "down";
            if (parseFloat(temp) !== parseFloat(prevTempRef.current)) {
                setTempDir(dir);
                setTimeout(() => setTempDir(null), 500);
            }
        }
        prevTempRef.current = temp;
    }, [temp]);

    const slideStyle = (dir) => ({
        display: "inline-block",
        animation:
            dir === "up"
                ? "slideUp 0.4s ease forwards"
                : dir === "down"
                  ? "slideDown 0.4s ease forwards"
                  : "none",
    });

    return (
        <>
            <style>{`
            @keyframes blink {
                0%, 49%  { opacity: 1; }
                50%, 100% { opacity: 0.1; }
            }
            
            .blink-orange { animation: blink 1s linear infinite; }
            .blink-red    { animation: blink 0.5s linear infinite; }

            @keyframes slideUp {
                from { transform: translateY(6px); opacity: 0; }
                to   { transform: translateY(0);   opacity: 1; }
            }
            @keyframes slideDown {
                from { transform: translateY(-6px); opacity: 0; }
                to   { transform: translateY(0);    opacity: 1; }
            }
        `}</style>

            <div
                className={clsx(
                    "relative flex flex-col w-56 rounded-2xl overflow-hidden border transition-all duration-700",
                    // failed && "order-first animate-shake", // removing jump-to-front
                    failed && "animate-shake",
                    failed && isDarkTheme && "bg-red-900 border-red-800 shadow-[0_0_24px_theme(colors.red.900)]",
                    failed && !isDarkTheme && "bg-red-500 border-red-400 shadow-[0_0_24px_theme(colors.red.200)]",

                    // warning && "order-[-1]", // removing jump-to-front
                    warning && isDarkTheme && "bg-orange-800 border-orange-600 shadow-[0_0_24px_theme(colors.orange.900)]",
                    warning && !isDarkTheme && "bg-orange-400 border-orange-300 shadow-[0_0_24px_theme(colors.orange.200)]",

                    !failed && !warning && isOffline && "bg-base-200 border-base-300",
                    // !failed && !warning && isOffline && "order-last bg-base-200 border-base-300", // removing jump-to-last
                    !failed && !warning && !isOffline && isDarkTheme && "bg-lime-900 border-lime-700 shadow-[0_4px_24px_rgba(0,0,0,0.4)]",
                    !failed && !warning && !isOffline && !isDarkTheme && "bg-lime-300 border-lime-400 shadow-[0_4px_24px_rgba(0,0,0,0.10)]",
                )}
            >
                {/* Top bar */}
                <div className="flex items-center justify-between px-3 pt-3 pb-1">
                    <span className="text-[12px] min-h-[2lh] font-bold uppercase tracking-[0.1em] text-base-content opacity-100">
                        {device.location}
                    </span>
                    <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300
                        ${
                            polling
                                ? "bg-success shadow-[0_0_6px_var(--color-success)]"
                                : "bg-base-content/15"
                        }`}
                    />
                </div>

                <div className="mx-3 h-px bg-base-content/5" />

                {/* Readings */}
                <div className="relative flex-1 flex flex-col justify-center px-3 py-3 gap-3">
                    {isOffline && !isFetching && (
                        <RiWifiOffLine className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 w-20 h-20 text-base-content/10" />
                    )}

                    {isFetching && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/25">
                            <span className="text-[9px] uppercase tracking-widest">
                                Connecting
                            </span>
                            <span className="loading loading-dots loading-xs" />
                        </div>
                    )}

                    <div className="flex justify-between gap-0.5">
                        <span className="text-[16px] uppercase tracking-widest text-base-content/80">
                            RH
                        </span>
                        <span
                            className={clsx(
                                "text-2xl font-black leading-none tabular-nums",
                                isDarkTheme ? "text-white" : "text-black",
                                blinkClass(levels.rh),
                            )}
                        >
                            {rh === "Offline" || rh === undefined ? (
                                <span className="text-base-content/20 text-base">
                                    —
                                </span>
                            ) : (
                                <span style={slideStyle(rhDir)}>
                                    {rh}
                                    <span className="text-sm font-normal text-base-content/80 ml-0.5">
                                        %
                                    </span>
                                </span>
                            )}
                        </span>
                    </div>

                    <div className="flex justify-between gap-0.5">
                        <span className="text-[16px] uppercase tracking-widest text-base-content/80">
                            Temp
                        </span>
                        <span
                            className={clsx(
                                "text-2xl font-black leading-none tabular-nums",
                                isDarkTheme ? "text-white" : "text-black",
                                blinkClass(levels.temp),
                            )}
                        >
                            {temp === "Offline" || temp === undefined ? (
                                <span className="text-base-content/20 text-base">
                                    —
                                </span>
                            ) : (
                                <span style={slideStyle(tempDir)}>
                                    {temp}
                                    <span className="text-sm font-normal text-base-content/80 ml-0.5">
                                        °C
                                    </span>
                                </span>
                            )}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div
                    className={`flex items-center justify-between px-3 py-2 border-t
                    ${
                        failed
                            ? isDarkTheme
                                ? "border-red-800 bg-red-950/50"
                                : "border-red-300 bg-red-100/50"
                            : "border-base-content/5 bg-base-300/50"
                    }`}
                >
                    {/* IMPORTANT NOTE: OFF intentionally displays REC per management requirement */}
                    <span
                        className={`text-[14px] font-extrabold uppercase tracking-widest ${
                            device.is_recording === "ON"
                                ? isDarkTheme
                                    ? "text-success"
                                    : "border-success border-2 bg-success/50 px-1 rounded-xl shadow-lg text-black"
                                : device.is_recording === "OFF"
                                  ? isDarkTheme
                                      ? "text-success"
                                      : "border-success border-2 bg-success/50 px-1 rounded-xl shadow-lg text-black"
                                  : "text-base-content/25"
                        }`}
                    >
                        {/* IMPORTANT NOTE: OFF intentionally displays REC per management requirement */}
                        {device.is_recording === "ON"
                            ? "● REC"
                            : device.is_recording === "OFF"
                                ? "● REC"
                                : "○ Offline"}
                    </span>
                    <span className="text-[11px] text-base-content/50 tabular-nums">
                        {lastUpdated
                            ? formatPastDateTimeLabel(lastUpdated)
                            : "—"}
                    </span>
                </div>
            </div>
        </>
    );
});

// --- Dashboard --------------------------------------------------------
export default function Dashboard({ devices: initialDevices, thresholds }) {
    const [devices, setDevices] = useState(
        [...initialDevices].sort(byLocation).map((d) => ({
            ...d,
            temp: undefined,
            rh: undefined,
            is_recording: undefined,
        })),
    );

    const [expanded, setExpanded] = useState(true);
    const [clock, setClock] = useState("");
    const wrapRef = useRef(null);
    const cellRefs = useRef({});
    const [outlines, setOutlines] = useState([]);

    useLayoutEffect(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;

        const measure = () => {
            const byGroup = {};
            devices.forEach((d) => {
                const el = cellRefs.current[d.ip];
                if (!el) return;
                (byGroup[groupKey(d.location)] ??= []).push({
                    l: el.offsetLeft,
                    t: el.offsetTop,
                    r: el.offsetLeft + el.offsetWidth,
                    b: el.offsetTop + el.offsetHeight,
                });
            });
            setOutlines(
                GROUPS.filter((g) => byGroup[g.key]).map((g) => ({
                    key: g.key,
                    cls: g.cls,
                    d: buildOutline(byGroup[g.key]),
                })),
            );
        };

        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(wrap);
        Object.values(cellRefs.current).forEach((el) => el && ro.observe(el));
        return () => ro.disconnect();
    }, [devices]);

    // Clock
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setClock(
                now.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                }),
            );
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div
            className={
                expanded
                    ? "fixed p-4 inset-0 z-1000 bg-base-100 overflow-auto"
                    : "relative"
            }
        >
            {/* Shake animation style */}
            <style>{`
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
                .animate-shake { animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both; }
                @keyframes slideup {
                    from { transform: translateY(30px); opacity: 0; }
                    to   { transform: translateY(0); opacity: 1; }
                }
                .animate-slideup { animation: slideup 1s ease-in-out; }
            `}</style>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-base-content">
                    TSPI RH &amp; Temperature Monitoring
                </h1>
                <div className="w-100 text-red-600 text-sm mt-1">{clock}</div>
                {/* <div className="flex items-center gap-1 w-100"> */}
                <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => setExpanded((v) => !v)}
                >
                    {expanded ? <BiCollapse /> : <BiExpand />}
                    {expanded ? "Collapse" : "Expand"}
                </button>
                {/* </div> */}
            </div>

            <div
                ref={wrapRef}
                className="relative flex flex-wrap justify-center items-start gap-x-4 gap-y-6 animate-slideup"
            >
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    {outlines.map((o) => (
                        <path key={o.key} d={o.d} className={o.cls} strokeWidth={2} />
                    ))}
                </svg>

                {devices.map((device, i) => (
                    <div
                        key={device.ip}
                        ref={(el) => (cellRefs.current[device.ip] = el)}
                        className="relative"
                    >
                        <DeviceCard
                            device={device}
                            thresholds={thresholds}
                            index={i}
                        />
                    </div>
                ))}

                {devices.length === 0 && (
                    <p className="text-base-content/40 py-16">
                        Fetching device statuses...
                    </p>
                )}
            </div>
        </div>
    );
}
