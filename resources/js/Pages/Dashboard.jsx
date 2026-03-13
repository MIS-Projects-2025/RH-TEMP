import React, { useState, useEffect, useRef } from "react";
import formatPastDateTimeLabel from "@/Utils/formatPastDateTimeLabel";
import { RiWifiOffLine } from "react-icons/ri";
import { useThemeStore } from "@/Store/themeStore";
import { DARK_THEME_NAME } from "@/Constants/colors";
import { BiCollapse, BiExpand } from "react-icons/bi";
import clsx from "clsx";

function isOutOfRange(temp, rh, location, thresholds) {
    if (temp === "Offline" || rh === "Offline") return false;
    if (temp === undefined || rh === undefined) return false;

    const t = parseFloat(temp);
    const r = parseFloat(rh);

    const isPL3 = thresholds.pl3_locations
        .map((l) => l.toUpperCase())
        .includes(location?.toUpperCase());
    const limits = isPL3 ? thresholds.pl3 : thresholds.standard;

    return (
        t > limits.temp_max ||
        t < limits.temp_min ||
        r > limits.rh_max ||
        r < limits.rh_min
    );
}

// --- Doktor mode fakes ------------------------------------------------
// function fakeRh(rh, doktorMode) {
// 	if (!doktorMode || rh === "Offline") return rh;
// 	const v = parseFloat(rh);
// 	if (v > 55.1) return randomizer(54, 55.1);
// 	if (v < 44.9) return randomizer(44.9, 46);
// 	return rh;
// }

// function fakeTemp(temp, doktorMode) {
// 	if (!doktorMode || temp === "Offline") return temp;
// 	const v = parseFloat(temp);
// 	if (v > 25.1) return randomizer(24, 25.1);
// 	if (v < 19.9) return randomizer(19.9, 20);
// 	return temp;
// }

// function randomizer(min, max) {
// 	return (Math.random() * (max - min) + min).toFixed(1);
// }

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

    [0, 0.4, 0.8].forEach((offset) => {
        const oscillator = ctx.createOscillator();
        oscillator.connect(gain);

        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(880, ctx.currentTime + offset);
        oscillator.frequency.setValueAtTime(
            440,
            ctx.currentTime + offset + 0.1,
        );
        oscillator.frequency.setValueAtTime(
            880,
            ctx.currentTime + offset + 0.2,
        );

        gain.gain.setValueAtTime(0.3, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + offset + 0.6,
        );

        oscillator.start(ctx.currentTime + offset);
        oscillator.stop(ctx.currentTime + offset + 0.6);
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

    const prevRhRef = useRef(null);
    const prevTempRef = useRef(null);
    const [rhDir, setRhDir] = useState(null);
    const [tempDir, setTempDir] = useState(null);

    const prevFailedRef = useRef(false);

    const rh = device.rh;
    const temp = device.temp;

    const isFetching = device.is_recording === undefined;
    const isOffline = rh === "Offline" || rh === undefined;
    const failed =
        !isOffline && isOutOfRange(temp, rh, device.location, thresholds);

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
                    failed && "order-first animate-shake",
                    failed &&
                        isDarkTheme &&
                        "bg-red-900 border-red-800 shadow-[0_0_24px_theme(colors.red.900)]",
                    failed &&
                        !isDarkTheme &&
                        "bg-red-500 border-red-400 shadow-[0_0_24px_theme(colors.red.200)]",
                    !failed &&
                        isOffline &&
                        "order-last bg-base-200 border-base-300",
                    !failed &&
                        !isOffline &&
                        isDarkTheme &&
                        "bg-lime-900 border-lime-700 shadow-[0_4px_24px_rgba(0,0,0,0.4)]",
                    !failed &&
                        !isOffline &&
                        !isDarkTheme &&
                        "bg-lime-300 border-lime-400 shadow-[0_4px_24px_rgba(0,0,0,0.10)]",
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
                            className={`text-2xl font-black leading-none tabular-nums
                            ${isDarkTheme ? "text-white" : "text-black"}`}
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
                            className={`text-2xl font-black leading-none tabular-nums
                            ${isDarkTheme ? "text-white" : "text-black"}`}
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
                    <span
                        className={`text-[14px] font-extrabold uppercase tracking-widest ${
                            device.is_recording === "ON"
                                ? isDarkTheme
                                    ? "text-success"
                                    : "border-success border-2 bg-success/50 px-1 rounded-xl shadow-lg text-black"
                                : device.is_recording === "OFF"
                                  ? isDarkTheme
                                      ? "text-error"
                                      : "border-error border-2 bg-error/50 px-1 rounded-xl shadow-lg text-black"
                                  : "text-base-content/25"
                        }`}
                    >
                        {device.is_recording === "ON"
                            ? "● REC"
                            : device.is_recording === "OFF"
                              ? "○ OFF"
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
        initialDevices.map((d) => ({
            ...d,
            temp: undefined,
            rh: undefined,
            is_recording: undefined,
        })),
    );

    const [expanded, setExpanded] = useState(false);
    const [clock, setClock] = useState("");

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

            <div className="flex flex-wrap justify-center mb-10 gap-2 animate-slideup">
                {devices.map((device, index) => (
                    <DeviceCard
                        key={device.ip}
                        device={device}
                        thresholds={thresholds}
                        index={index}
                    />
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
