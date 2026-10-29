// Shared by Dashboard and FloorMap. Save as resources/js/Utils/climate.js

export const RANK = { green: 0, orange: 1, red: 2 };

// returns "green" | "orange" | "red"
export function getLevel(v, min, max, critMin, critMax) {
    const lo = critMin ?? min; // no crit value = no orange band on that side
    const hi = critMax ?? max;
    if (lo != null && v < lo) return "red";
    if (hi != null && v > hi) return "red";
    if ((min != null && v < min) || (max != null && v > max)) return "orange";
    return "green";
}

export function thresholdsFrom(tp) {
    return {
        temp_min: tp?.temp_min ?? null,
        temp_max: tp?.temp_max ?? null,
        temp_crit_min: tp?.temp_crit_min ?? null,
        temp_crit_max: tp?.temp_crit_max ?? null,
        rh_min: tp?.rh_min ?? null,
        rh_max: tp?.rh_max ?? null,
        rh_crit_min: tp?.rh_crit_min ?? null,
        rh_crit_max: tp?.rh_crit_max ?? null,
    };
}

export function getLevels(temp, rh, th) {
    const invalid = (v) => v === undefined || v === "Offline";

    const t = invalid(temp)
        ? "green"
        : getLevel(parseFloat(temp), th.temp_min, th.temp_max, th.temp_crit_min, th.temp_crit_max);
    const r = invalid(rh)
        ? "green"
        : getLevel(parseFloat(rh), th.rh_min, th.rh_max, th.rh_crit_min, th.rh_crit_max);

    return { temp: t, rh: r, overall: RANK[t] >= RANK[r] ? t : r };
}

export const blinkClass = (lvl) =>
    lvl === "red" ? "blink-red" : lvl === "orange" ? "blink-orange" : "";

export function parseDeviceResponse(text) {
    const temp = text.match(/Temperature\s+([\d.]+)/)?.[1] ?? "Offline";
    const rh = text.match(/Humidity\s+([\d.]+)/)?.[1] ?? "Offline";
    const rec = text.match(/Recording\s+(\w+)/)?.[1] ?? "Off";
    return { temp, rh, is_recording: rec };
}

// With many pins on one page, several can go red at the same moment.
// Throttle so it's one alarm, not a pile-up. Also closes the AudioContext
// (browsers cap how many can stay open).
let lastAlarmAt = 0;
export function playAlarm() {
    const nowMs = Date.now();
    if (nowMs - lastAlarmAt < 2000) return;
    lastAlarmAt = nowMs;

    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    [0, 0.25, 0.5].forEach((offset) => {
        const osc = ctx.createOscillator();
        osc.connect(gain);
        osc.type = "square";
        osc.frequency.setValueAtTime(880, ctx.currentTime + offset);
        osc.frequency.setValueAtTime(440, ctx.currentTime + offset + 0.05);
        osc.frequency.setValueAtTime(880, ctx.currentTime + offset + 0.1);

        gain.gain.setValueAtTime(0.3, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.2);

        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.2);
    });

    setTimeout(() => ctx.close(), 1200);
}