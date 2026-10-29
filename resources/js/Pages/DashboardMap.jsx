import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import toast from "react-hot-toast";
import { router } from "@inertiajs/react";
import clsx from "clsx";
import { useThemeStore } from "@/Store/themeStore";
import { DARK_THEME_NAME } from "@/Constants/colors";
import { BiCollapse, BiExpand } from "react-icons/bi";
import {
    RANK,
    blinkClass,
    getLevels,
    parseDeviceResponse,
    playAlarm,
    thresholdsFrom,
} from "@/Lib/climate";
import { BW, BH, layoutBubbles, tailPoints } from "@/Utils/layoutBubbles";

// Placeholder until you have the real floor plan. Replace with e.g. "/images/floor.png"
const PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <pattern id="g" width="100" height="100" patternUnits="userSpaceOnUse">
      <path d="M100 0H0V100" fill="none" stroke="#94a3b8" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1600" height="900" fill="#e2e8f0"/>
  <rect width="1600" height="900" fill="url(#g)"/>
  <rect x="40" y="40" width="1520" height="820" fill="none" stroke="#475569" stroke-width="6"/>
  <text x="800" y="460" text-anchor="middle" font-family="sans-serif" font-size="48" fill="#64748b">FLOOR PLAN PLACEHOLDER</text>
</svg>`)}`;

// Full class strings (not built dynamically) so Tailwind can see them.
const TONES = {
    red: {
        dark: { box: "bg-red-900 border-red-800", tail: "fill-red-900 stroke-red-800" },
        light: { box: "bg-red-500 border-red-400", tail: "fill-red-500 stroke-red-400" },
    },
    orange: {
        dark: { box: "bg-orange-800 border-orange-600", tail: "fill-orange-800 stroke-orange-600" },
        light: { box: "bg-orange-400 border-orange-300", tail: "fill-orange-400 stroke-orange-300" },
    },
    lime: {
        dark: { box: "bg-lime-900 border-lime-700", tail: "fill-lime-900 stroke-lime-700" },
        light: { box: "bg-lime-300 border-lime-400", tail: "fill-lime-300 stroke-lime-400" },
    },
    offline: {
        dark: { box: "bg-base-200 border-base-300 text-base-content/40", tail: "fill-base-200 stroke-base-300" },
        light: { box: "bg-base-200 border-base-300 text-base-content/40", tail: "fill-base-200 stroke-base-300" },
    },
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r2 = (v) => Math.round(v * 100) / 100;

// --- saving ---
// Goes through Inertia, the same path your Devices page uses, so it carries the
// same auth as your other requests. Saves run one at a time: Inertia cancels an
// in-flight visit when a new one starts, which would silently drop a save.
let saveChain = Promise.resolve();

function savePosition(deviceId, patch) {
    const run = () =>
        new Promise((resolve, reject) => {
            let ok = false;
            router.patch(route("devices.position", deviceId), patch, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    ok = true;
                },
                onFinish: () => (ok ? resolve() : reject(new Error("save failed"))),
            });
        });
    saveChain = saveChain.then(run, run);
    return saveChain;
}

// --- polling -----------------------------------------------------------
// One poll loop per pin. Same endpoint and parsing as DeviceCard.
function useDeviceReading(ip, intervalMs, index) {
    const [reading, setReading] = useState({
        temp: undefined,
        rh: undefined,
        is_recording: undefined,
    });

    useEffect(() => {
        let cancelled = false;
        let timer;
        const ctrl = new AbortController();

        async function poll() {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_PROXY_URL}/proxy/${ip}/postReadHtml?a`,
                    { signal: ctrl.signal },
                );
                const parsed = parseDeviceResponse(await res.text());
                if (!cancelled) setReading(parsed);
            } catch {
                if (!cancelled) {
                    setReading((p) => ({ ...p, temp: "Offline", rh: "Offline" }));
                }
            } finally {
                if (!cancelled) timer = setTimeout(poll, intervalMs);
            }
        }

        timer = setTimeout(poll, index * 300); // stagger so pins don't all hit at once
        return () => {
            cancelled = true;
            clearTimeout(timer);
            ctrl.abort();
        };
    }, [ip, intervalMs, index]);

    return reading;
}

// Rendered size of an element, rounded so sub-pixel changes don't re-run the layout.
function useElementSize(ref) {
    const [size, setSize] = useState({ w: 0, h: 0 });

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            const w = Math.round(entry.contentRect.width);
            const h = Math.round(entry.contentRect.height);
            setSize((p) => (p.w === w && p.h === h ? p : { w, h }));
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [ref]);

    return size;
}

// --- dragging ----------------------------------------------------------
// Spread the returned handlers on an element. Positions are in % of the image.
//   getCurrent(): where the thing is now, so grabbing it by its edge doesn't make it jump
//   getBefore():  what to restore if the save fails (captured when the drag starts)
function useDragHandle({ enabled, toPct, getCurrent, getBefore, onMove, onEnd }) {
    const grab = useRef(null);
    const last = useRef(null);

    const finish = (e) => {
        if (!grab.current) return;
        const g = grab.current;
        grab.current = null;
        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        if (last.current) onEnd(last.current, g.before);
        last.current = null;
    };

    return {
        onPointerDown: (e) => {
            if (!enabled || e.button !== 0) return;
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            const p = toPct(e.clientX, e.clientY);
            const cur = getCurrent();
            grab.current = { ox: cur.x - p.x, oy: cur.y - p.y, before: getBefore() };
            last.current = null;
        },
        onPointerMove: (e) => {
            if (!grab.current) return;
            const p = toPct(e.clientX, e.clientY);
            last.current = { x: p.x + grab.current.ox, y: p.y + grab.current.oy };
            onMove(last.current);
        },
        onPointerUp: finish,
        onPointerCancel: finish,
    };
}

// --- Pin ---------------------------------------------------------------
// The wrapper sits exactly on the device's real position (map_x / map_y in %).
// The bubble is shifted by (dx, dy) px; the tail connects the two.
// In edit mode there are two separate handles: the dot, and the bubble.
const MapPin = React.memo(function MapPin({
    device,
    index,
    intervalMs,
    dx,
    dy,
    w,
    h,
    editing,
    toPct,
    onChange,
    onCommit,
}) {
    const { theme } = useThemeStore();
    const isDark = theme === DARK_THEME_NAME;

    const { temp, rh } = useDeviceReading(device.ip, intervalMs, index);

    const isOffline = rh === "Offline" || rh === undefined;
    const levels = isOffline
        ? { temp: "green", rh: "green", overall: "green" }
        : getLevels(temp, rh, thresholdsFrom(device.threshold_profile));
    const level = levels.overall;
    const failed = level === "red";
    const warning = level === "orange";

    const prevFailed = useRef(false);
    useEffect(() => {
        if (failed && !prevFailed.current) playAlarm();
        prevFailed.current = failed;
    }, [failed]);

    const tone = failed ? "red" : warning ? "orange" : isOffline ? "offline" : "lime";
    const c = TONES[tone][isDark ? "dark" : "light"];

    // Handle 1: the dot (real position)
    const dotDrag = useDragHandle({
        enabled: editing,
        toPct,
        getCurrent: () => ({ x: Number(device.map_x), y: Number(device.map_y) }),
        getBefore: () => ({ map_x: device.map_x, map_y: device.map_y }),
        onMove: (p) =>
            onChange(device.ip, { map_x: clamp(p.x, 0, 100), map_y: clamp(p.y, 0, 100) }),
        onEnd: (p, before) =>
            onCommit(
                device,
                { map_x: r2(clamp(p.x, 0, 100)), map_y: r2(clamp(p.y, 0, 100)) },
                before,
            ),
    });

    // Handle 2: the bubble. Its stored position is its CENTER, in % of the image.
    const halfW = (BW / 2 / w) * 100;
    const halfH = (BH / 2 / h) * 100;
    const fitX = (v) => clamp(v, halfW, 100 - halfW);
    const fitY = (v) => clamp(v, halfH, 100 - halfH);
    const labelBefore = () => ({ label_x: device.label_x ?? null, label_y: device.label_y ?? null });

    const bubbleDrag = useDragHandle({
        enabled: editing,
        toPct,
        getCurrent: () => ({
            x: Number(device.map_x) + (dx / w) * 100,
            y: Number(device.map_y) + (dy / h) * 100,
        }),
        getBefore: labelBefore,
        onMove: (p) => onChange(device.ip, { label_x: fitX(p.x), label_y: fitY(p.y) }),
        onEnd: (p, before) =>
            onCommit(device, { label_x: r2(fitX(p.x)), label_y: r2(fitY(p.y)) }, before),
    });

    return (
        <div
            className="map-pin absolute"
            style={{
                left: `${device.map_x}%`,
                top: `${device.map_y}%`,
                zIndex: 10 + RANK[level] * 10, // red above orange above green; hover goes above all
            }}
        >
            {/* tail + the dot marking the real position (origin = the device's x/y) */}
            <svg
                className="pointer-events-none absolute top-0 left-0 overflow-visible"
                width="1"
                height="1"
            >
                <polygon
                    points={tailPoints(dx, dy)}
                    strokeWidth="1"
                    strokeLinejoin="round"
                    className={c.tail}
                />
                <circle r="5" strokeWidth="1" className="fill-white/90 stroke-black/40" />
                <circle r="3" strokeWidth="1" className={c.tail} />
            </svg>

            {/* drag handle for the dot */}
            {editing && (
                <div
                    {...dotDrag}
                    title="Drag to move the device's real position"
                    className="absolute top-0 left-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full bg-fuchsia-500/20 ring-2 ring-fuchsia-500 active:cursor-grabbing"
                />
            )}

            {/* the bubble */}
            <div
                {...bubbleDrag}
                onDoubleClick={() => {
                    if (!editing || device.label_x == null) return;
                    onCommit(device, { label_x: null, label_y: null }, labelBefore());
                }}
                title={editing ? "Drag to move the bubble. Double-click to reset to auto." : undefined}
                className={clsx(
                    "group absolute rounded-lg",
                    editing && "cursor-move touch-none select-none ring-2 ring-fuchsia-500 ring-offset-1",
                )}
                style={{ left: dx - BW / 2, top: dy - BH / 2, width: BW, height: BH }}
            >
                <div
                    className={clsx(
                        "flex h-full w-full items-center justify-center overflow-hidden rounded-lg border text-xs font-black whitespace-nowrap tabular-nums transition-colors duration-500",
                        c.box,
                        failed && "shadow-[0_0_14px_theme(colors.red.500)]",
                        !isOffline && (isDark ? "text-white" : "text-black"),
                    )}
                >
                    {isOffline ? (
                        <span>{temp === undefined ? "…" : "—"}</span>
                    ) : (
                        <div className="flex flex-col w-full px-1">
                            <div className={`${blinkClass(levels.temp)} flex justify-between`}>
                                <span className="font-normal">T</span>
                                <span>
                                    <span className="font-semibold font-mono">{temp}</span>
                                    <span className="font-normal inline-block w-5 text-right">°C</span>
                                </span>
                            </div>

                            <div className={`${blinkClass(levels.rh)} flex justify-between`}>
                                <span className="font-normal">R</span>
                                <span>
                                    <span className="font-semibold font-mono">{rh}</span>
                                    <span className="font-normal inline-block w-5 text-right">%</span>
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* location label on hover */}
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 rounded bg-base-100 px-2 py-0.5 text-xs font-bold whitespace-nowrap text-base-content shadow group-hover:block">
                    {device.location}
                </div>
            </div>
        </div>
    );
});

// --- Page --------------------------------------------------------------
// devices: [{ id, ip, location, map_x, map_y, label_x, label_y, threshold_profile }]
// map_*   = the device's real position, % of image width / height
// label_* = hand-placed bubble center, same units. null = auto-placed.
export default function FloorMap({ devices = [], imageUrl = PLACEHOLDER, intervalMs = 2000 }) {
    const [editMode, setEditMode] = useState(false);
    const [edits, setEdits] = useState({}); // ip -> partial { map_x, map_y, label_x, label_y }
    const [expanded, setExpanded] = useState(true);

    const wrapRef = useRef(null);
    const { w, h } = useElementSize(wrapRef);

    // props + local edits (edits are saved as you drop, so this is always what's on screen)
    const merged = useMemo(
        () => devices.map((d) => (edits[d.ip] ? { ...d, ...edits[d.ip] } : d)),
        [devices, edits],
    );
    const placed = useMemo(() => merged.filter((d) => d.map_x != null && d.map_y != null), [merged]);
    const unplaced = useMemo(() => merged.filter((d) => d.map_x == null || d.map_y == null), [merged]);

    // Bubble offsets. Hand-placed bubbles stay put; the rest dodge around them.
    const offsets = useMemo(
        () =>
            layoutBubbles(
                placed.map((d) => ({
                    id: d.ip,
                    x: (Number(d.map_x) / 100) * w,
                    y: (Number(d.map_y) / 100) * h,
                    lx: d.label_x != null ? (Number(d.label_x) / 100) * w : undefined,
                    ly: d.label_y != null ? (Number(d.label_y) / 100) * h : undefined,
                })),
                w,
                h,
            ),
        [placed, w, h],
    );

    const toPct = useCallback((clientX, clientY) => {
        const r = wrapRef.current.getBoundingClientRect();
        return {
            x: ((clientX - r.left) / r.width) * 100,
            y: ((clientY - r.top) / r.height) * 100,
        };
    }, []);

    // live, while dragging
    const handleChange = useCallback((ip, patch) => {
        setEdits((p) => ({ ...p, [ip]: { ...p[ip], ...patch } }));
    }, []);

    // on drop: show it, save it, put it back if the save fails
    const handleCommit = useCallback(
        async (device, patch, before) => {
            handleChange(device.ip, patch);
            try {
                await savePosition(device.id, patch);
            } catch {
                handleChange(device.ip, before);
                toast.error(`Could not save ${device.location}. If you were logged out, log in again and retry.`);
            }
        },
        [handleChange],
    );

    return (
        <div
            className={
                expanded
                    ? "fixed p-4 inset-0 z-1000 bg-base-100 overflow-auto"
                    : "relative"
            }
        >
            <style>{`
                @keyframes blink {
                    0%, 49%   { opacity: 1; }
                    50%, 100% { opacity: 0.1; }
                }
                .blink-orange { animation: blink 1s linear infinite; }
                .blink-red    { animation: blink 0.5s linear infinite; }
                .map-pin:hover { z-index: 100 !important; }
            `}</style>

            <div className="mb-4 flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-base-content">
                    TSPI RH &amp; Temperature Map
                </h1>
                {!expanded && (
                    <button
                        type="button"
                        className={clsx("btn btn-sm", editMode ? "btn-warning" : "btn-outline")}
                        onClick={() => setEditMode((v) => !v)}
                    >
                        {editMode ? "Done editing" : "Edit layout"}
                    </button>
                )}
                <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => setExpanded((v) => !v)}
                >
                    {expanded ? <BiCollapse /> : <BiExpand />}
                    {expanded ? "Collapse" : "Expand"}
                </button>
            </div>

            {editMode && (
                <div className="mb-3 space-y-2 text-sm text-base-content/70">
                    <p>
                        Drag a <b>bubble</b> to place it. Drag the <b>ring on the dot</b> to set the
                        device&apos;s real position. Double-click a bubble to send it back to
                        auto placement. Changes save when you let go.
                    </p>
                    {unplaced.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span>Not on the map yet (click to drop in the middle):</span>
                            {unplaced.map((d) => (
                                <button
                                    key={d.ip}
                                    type="button"
                                    className="btn btn-xs btn-outline"
                                    onClick={() =>
                                        handleCommit(
                                            d,
                                            { map_x: 50, map_y: 50 },
                                            { map_x: null, map_y: null },
                                        )
                                    }
                                >
                                    {d.location}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/*
              The wrapper is exactly as big as the image, so a pin's left/top percentages
              always land on the same spot of the image at any screen width. No overflow-hidden
              here, so a hover label near the edge isn't clipped.
            */}
            <div ref={wrapRef} className="relative mx-auto w-full max-w-[1750px]">
                <img
                    src={imageUrl}
                    alt="Floor plan"
                    draggable={false}
                    className="block h-auto w-full rounded-xl border border-base-300 select-none"
                />

                {w > 0 &&
                    placed.map((device, i) => {
                        const o = offsets.get(device.ip) ?? { dx: 0, dy: -(BH / 2 + 12) };
                        return (
                            <MapPin
                                key={device.ip}
                                device={device}
                                index={i}
                                intervalMs={intervalMs}
                                dx={o.dx}
                                dy={o.dy}
                                w={w}
                                h={h}
                                editing={editMode}
                                toPct={toPct}
                                onChange={handleChange}
                                onCommit={handleCommit}
                            />
                        );
                    })}
            </div>
        </div>
    );
}