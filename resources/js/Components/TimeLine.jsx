import { useEffect, useState } from "react";

export default function TimeLine({ ranges, height = 60 }) {
	const [now, setNow] = useState(new Date());

	useEffect(() => {
		const id = setInterval(() => setNow(new Date()), 1000);
		return () => clearInterval(id);
	}, []);

	const internalWidth = 1300;
	const hourToX = (hour) => (hour / 24) * internalWidth;

	const currentHour =
		now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

	const inRange = ranges.some(
		(r) => currentHour >= r.startHour && currentHour < r.endHour,
	);

	return (
		<div className="flex flex-col items-center">
			<div className="p-2 font-bold">
				{inRange ? (
					<span className="text-primary">
						You are within the allowed time. You can update the checklist now.
					</span>
				) : (
					<span className="text-error">
						Updates are outside the allowed time. You can still proceed if
						needed, but it’s outside the normal window.
					</span>
				)}
			</div>
			<svg
				width="100%"
				height={height}
				viewBox={`0 0 ${internalWidth} ${height}`}
				// preserveAspectRatio="none"
			>
				{/* style={{ backgroundColor: "red", padding: "0 20" }} */}
				{/* Base line */}
				<line
					x1={internalWidth}
					y1={height / 2}
					y2={height / 2}
					stroke="var(--color-base-content-dim)"
					// stroke="#444"
					strokeWidth={4}
				/>
				{/* Colored ranges */}
				{ranges.map((r, i) => (
					<line
						key={i}
						x1={hourToX(r.startHour)}
						y1={height / 2}
						x2={hourToX(r.endHour)}
						y2={height / 2}
						stroke={r.color}
						strokeWidth={6}
						// strokeLinecap="round"
					/>
				))}
				{/* Hour labels every 3 hours */}
				{Array.from({ length: 9 }).map((_, i) => {
					const hour = i * 3;
					let anchor = "middle";
					if (hour === 0) anchor = "start";
					if (hour === 24) anchor = "end";

					return (
						<text
							key={hour}
							x={hourToX(hour)}
							y={height / 2 - 10}
							textAnchor={anchor}
							fontSize="14px"
							fill="var(--color-base-content)"
						>
							{hour}:00
						</text>
					);
				})}
				{/* Current time pointer */}
				{/* <circle
                    cx={hourToX(currentHour)}
                    cy={height / 2}
                    r={6}
                    fill={
                        inRange
                            ? "var(--color-accent)"
                            : "var(--color-base-content)"
                    }
                    stroke="var(--color-base-content-dim)"
                    strokeWidth={2}
                    style={{
                        filter: inRange
                            ? "drop-shadow(0 0 4px var(--color-accent))"
                            : "none",
                        transition: "cx 1s linear",
                    }}
                /> */}
				{/* Current time pointer with pin */}
				<g transform={`translate(${hourToX(currentHour)}, ${height / 2})`}>
					{/* Circle */}
					<circle
						cx={0}
						cy={0}
						r={2}
						fill={inRange ? "var(--color-accent)" : "var(--color-base-content)"}
						stroke="var(--color-base-content-dim)"
						strokeWidth={2}
						style={{
							filter: inRange
								? "drop-shadow(0 0 4px var(--color-accent))"
								: "none",
							transition: "transform 1s linear",
						}}
					/>
					{/* Pin triangle */}
					<path
						d="M0,6 L-5,15 L5,15 Z"
						fill={inRange ? "var(--color-accent)" : "var(--color-base-content)"}
						stroke="var(--color-base-content-dim)"
						strokeWidth={1}
					/>
				</g>
			</svg>
		</div>
	);
}
