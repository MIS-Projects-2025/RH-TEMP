// Save as resources/js/Utils/layoutBubbles.js
//
// Places fixed-size bubbles around anchor points so that:
//   - bubbles never overlap each other
//   - bubbles stay inside the image
//   - bubbles don't sit on top of another device's anchor dot
//   - each bubble stays as close to its own anchor as possible
//
// Everything is in PIXELS of the rendered image. The result only depends on the
// anchors and the image size (not on live readings), so it is stable between
// polls and only re-runs on resize.

export const BW = 70; // bubble width  (px)
export const BH = 32;  // bubble height (px)

const GAP = 6;        // minimum space between two bubbles
const TAIL_MIN = 12;  // minimum distance from anchor to the bubble edge
const TAIL_BASE = 10; // width of the tail where it meets the bubble
const STEP = 14;      // how far each extra ring moves outward
const RINGS = 12;

// Preference order: straight above first, then up-diagonals, sides, below last.
const ANGLES = [-90, -60, -120, -30, -150, 0, 180, 30, 150, 60, 120, 90];

const rad = (d) => (d * Math.PI) / 180;

// distance from a point to the bubble rectangle centered at (cx, cy)
function distToRect(px, py, cx, cy) {
    return Math.hypot(
        Math.max(Math.abs(px - cx) - BW / 2, 0),
        Math.max(Math.abs(py - cy) - BH / 2, 0),
    );
}

/**
 * anchors: [{ id, x, y, lx?, ly? }]  px, relative to the image's top-left.
 *   lx / ly = a bubble center the user placed by hand. Those bubbles are kept
 *   exactly where they are and treated as obstacles; only the rest are auto-placed.
 * returns Map(id -> { dx, dy })  bubble CENTER offset from its anchor, in px
 */
export function layoutBubbles(anchors, width, height) {
    const out = new Map();
    if (!width || !height || anchors.length === 0) return out;

    // Hand-placed bubbles go in first and are never moved.
    const isFixed = (a) => a.lx != null && a.ly != null;
    const auto = anchors.filter((a) => !isFixed(a));
    const placed = []; // [{ cx, cy }]
    for (const a of anchors.filter(isFixed)) {
        placed.push({ cx: a.lx, cy: a.ly });
        out.set(a.id, { dx: a.lx - a.x, dy: a.ly - a.y });
    }

    // Most crowded anchors choose first; isolated ones can take what's left.
    const crowd = new Map(
        anchors.map((a) => [
            a.id,
            anchors.filter((b) => Math.hypot(a.x - b.x, a.y - b.y) < 150).length,
        ]),
    );
    const order = [...auto].sort(
        (a, b) =>
            crowd.get(b.id) - crowd.get(a.id) ||
            String(a.id).localeCompare(String(b.id)),
    );

    for (const a of order) {
        let best = null;

        for (let r = 0; r < RINGS; r++) {
            for (let i = 0; i < ANGLES.length; i++) {
                const dx = Math.cos(rad(ANGLES[i])) * (BW / 2 + TAIL_MIN + r * STEP);
                const dy = Math.sin(rad(ANGLES[i])) * (BH / 2 + TAIL_MIN + r * STEP);
                const cx = a.x + dx;
                const cy = a.y + dy;

                let cost = r * STEP + i * 2; // closer + preferred direction = cheaper

                // outside the image
                const ox = Math.max(0, BW / 2 - cx, cx + BW / 2 - width);
                const oy = Math.max(0, BH / 2 - cy, cy + BH / 2 - height);
                if (ox || oy) cost += 1000 + ox + oy;

                // overlaps an already placed bubble
                for (const p of placed) {
                    if (Math.abs(cx - p.cx) < BW + GAP && Math.abs(cy - p.cy) < BH + GAP) {
                        cost += 1000;
                    }
                }

                // covers someone else's anchor dot
                for (const o of anchors) {
                    if (o.id !== a.id && distToRect(o.x, o.y, cx, cy) < 4) cost += 300;
                }

                // tail would be too short to read as a pointer
                if (distToRect(a.x, a.y, cx, cy) < TAIL_MIN - 0.5) cost += 800;

                if (!best || cost < best.cost) best = { dx, dy, cx, cy, cost };
            }
        }

        placed.push({ cx: best.cx, cy: best.cy });
        out.set(a.id, { dx: best.dx, dy: best.dy });
    }

    return out;
}

/**
 * SVG polygon points for the speech-bubble tail, in coordinates where the anchor
 * is (0, 0) and the bubble center is (dx, dy). The tip touches the anchor and the
 * base sits on the bubble edge that faces the anchor.
 */
export function tailPoints(dx, dy) {
    const hw = BW / 2;
    const hh = BH / 2;
    const half = TAIL_BASE / 2;
    const corner = 8; // keep the base on the straight part of the rounded edge

    const vx = -dx; // from bubble center toward the anchor
    const vy = -dy;
    const tx = vx === 0 ? Infinity : hw / Math.abs(vx);
    const ty = vy === 0 ? Infinity : hh / Math.abs(vy);
    // anchor is inside (or exactly under) the bubble: nothing to draw
    if (Math.min(tx, ty) >= 1) return "0,0 0,0 0,0";
    const clamp = (v, lim) => Math.max(-lim, Math.min(lim, v));

    let b1;
    let b2;
    if (tx < ty) {
        // leaves through the left or right edge
        const ex = dx + Math.sign(vx) * (hw - 1); // -1 tucks the base under the bubble
        const lim = Math.max(0, hh - corner - half);
        const ey = dy + clamp(vy * tx, lim);
        b1 = [ex, ey - half];
        b2 = [ex, ey + half];
    } else {
        // leaves through the top or bottom edge
        const ey = dy + Math.sign(vy) * (hh - 1);
        const lim = Math.max(0, hw - corner - half);
        const ex = dx + clamp(vx * ty, lim);
        b1 = [ex - half, ey];
        b2 = [ex + half, ey];
    }

    return `${b1[0]},${b1[1]} ${b2[0]},${b2[1]} 0,0`;
}