import PieChartWithNeedle from "@/Components/Chart/Speedometer";
import STATUS_CONFIG from "@/Constants/checkItemStatusConfig";
import formatFriendlyDate from "@/Utils/formatFriendlyDate";
import formatPastDateTimeLabel from "@/Utils/formatPastDateTimeLabel";
import { Head, usePage } from "@inertiajs/react";
import clsx from "clsx";
import { useState } from "react";
import { FaCheckCircle, FaMinusCircle, FaTimes } from "react-icons/fa";
import { TbAlertTriangle } from "react-icons/tb";
import { Tooltip } from "react-tooltip";

const ASSETS_CATEGORIES = [
	{
		key: "assets_complete",
		label: "Complete",
		description: "All due items checked",
		color: "text-emerald-600",
		bg: "bg-emerald-500/2",
		border: "border-emerald-200/50",
		indicator: "bg-emerald-500",
		barColor: "bg-emerald-400",
		icon: <FaCheckCircle className="w-5 h-5" />,
	},
	{
		key: "assets_partial",
		label: "Partial",
		description: "Some items still due",
		color: "text-amber-600",
		bg: "bg-amber-500/2",
		border: "border-amber-200/50",
		indicator: "bg-amber-500",
		barColor: "bg-amber-400",
		icon: <TbAlertTriangle className="w-5 h-5" />,
	},
	{
		key: "assets_not_started",
		label: "Not Started",
		description: "No items checked yet",
		color: "text-red-600",
		bg: "bg-red-500/2",
		border: "border-red-200/50",
		indicator: "bg-red-500",
		barColor: "bg-red-400",
		icon: <FaTimes className="w-5 h-5" />,
	},
	{
		key: "assets_overdue",
		label: "Overdue",
		description: "Due date has passed",
		color: "text-slate-500",
		bg: "bg-slate-500/2",
		border: "border-slate-200/50",
		indicator: "bg-slate-400",
		barColor: "bg-slate-300",
		icon: <FaMinusCircle className="w-5 h-5" />,
	},
];

function StatCard({ statusKey, count }) {
	const config = STATUS_CONFIG[statusKey];
	const Icon = config?.icon;

	if (!config) return null;

	return (
		<div
			style={{ border: `1px solid ${config.color}22` }}
			className={clsx(
				`h-full p-2 flex flex-col justify-between gap-1 relative overflow-hidden transition-all duration-300 cursor-default`,
				config.bgClass,
			)}
			onMouseEnter={(e) => {
				e.currentTarget.style.borderColor = `${config.color}66`;
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.borderColor = `${config.color}22`;
			}}
		>
			<div
				style={{
					background: config.color,
					top: -40,
					right: -40,
				}}
				className="absolute w-18 h-28 rounded-full opacity-[0.06] blur-3xl pointer-events-none"
			/>

			<div className="flex justify-between items-center">
				<div style={{ color: config.color }} className="shrink-0">
					{Icon && <Icon size={30} />}
				</div>
				<div
					className={clsx(
						"text-[42px] font-semibold text-base-content leading-none tracking-tight",
						{
							"opacity-25": count === 0,
						},
					)}
					style={{ fontFamily: "'DM Mono', monospace" }}
				>
					{String(count)}
				</div>
			</div>

			<div
				className="mt-1.5 text-[13px] text-base-content text-center font-medium capitalize tracking-wide"
				style={{ fontFamily: "'DM Sans', sans-serif" }}
			>
				{config.label}
			</div>
		</div>
	);
}

// ─── Color tokens (should match your CSS variables) ──────────────────────────
const statusColors = {
	ok: "var(--color-ok)",
	warning: "var(--color-warning)",
	danger: "var(--color-danger)",
};

// ─── Validity helpers ─────────────────────────────────────────────────────────
function parseRunningHours(raw) {
	if (raw === null || raw === undefined || raw === "") return null;
	const n = Number(raw);
	if (isNaN(n)) return null; // only non-numeric strings are invalid
	return n;
}

// ─── Status badge sub-component ───────────────────────────────────────────────
function ScheduleBadge({ isNoSchedule, isDue }) {
	if (isNoSchedule) {
		return (
			<span className="inline-flex items-center text-xs bg-base-200 text-base-content/50">
				<span className="text-[10px]">—</span> no schedule
			</span>
		);
	}

	if (isDue) {
		return (
			<span className="inline-flex items-center text-xs text-red-600 animate-pulse">
				<span>⚠</span>
			</span>
		);
	}

	return null;
}

function PowerStatusBadge({ status }) {
	const normalized = status?.toLowerCase();
	const isRunning = normalized === "running";
	const isUnknown = normalized === "unknown";
	const isStandby = normalized === "stand by" || normalized === "standby";

	return (
		<div className="flex items-center gap-1">
			<div className="relative flex items-center justify-center">
				{isRunning && (
					<span className="absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75 animate-ping" />
				)}
				<span
					className={clsx("relative inline-flex h-2 w-2 rounded-full", {
						"bg-green-400": isRunning,
						"bg-gray-500": isUnknown,
						"bg-yellow-400": isStandby,
					})}
				/>
			</div>
		</div>
	);
}

// ─── Single speedometer card ──────────────────────────────────────────────────
function SpeedometerCard({ entry, speedometerData, maxValue, power }) {
	console.log("🚀 ~ SpeedometerCard ~ power:", power);
	const { is_no_schedule, is_due } = entry;
	const powerStatus = power?.item_status || "unknown";
	const powerStatusLastUpdated = power?.checked_at || null;
	const hours = parseRunningHours(entry.item_status);
	const isInvalid = hours === null;
	const needleValue = isInvalid ? 0 : Math.min(hours, maxValue);
	const tooltipId = `tooltip-${entry.asset_name.replace(/\s+/g, "-")}`;

	const checkedBy = entry.checked_by ?? {};
	const checkerName =
		[checkedBy.FIRSTNAME, checkedBy.LASTNAME].filter(Boolean).join(" ") || "—";
	const checkerTitle = checkedBy.JOB_TITLE || "—";
	const checkedAt = entry.checked_at
		? new Date(entry.checked_at).toLocaleString()
		: "—";

	const getColorBasedOnStatus = () => {
		let cumulative = 0;
		for (const range of speedometerData) {
			cumulative += range.value;
			if (hours <= cumulative) return range.fill;
		}
		return speedometerData[speedometerData.length - 1].fill;
	};

	return (
		<div
			className={clsx(
				"flex relative flex-col items-center w-30 p-1 transition-all",
				is_no_schedule && "opacity-60",
			)}
		>
			<div className="absolute top-2 left-2 flex flex-col gap-1">
				<PowerStatusBadge status={powerStatus} />
				<ScheduleBadge isNoSchedule={is_no_schedule} isDue={is_due} />
			</div>

			<PieChartWithNeedle
				outerRadius={30}
				innerRadius={25}
				width={100}
				cx={50}
				data={speedometerData}
				needleValue={needleValue}
				height={40}
				cy={30}
			/>

			{/* Asset name + running hours — hoverable */}
			<div data-tooltip-id={tooltipId} className="text-center cursor-default">
				<p
					className={clsx(
						`text-lg leading-5 font-bold ${isInvalid ? "text-base-content italic" : "text-gray-800"}`,
					)}
					style={{ color: getColorBasedOnStatus() }}
				>
					{isInvalid ? "invalid" : `${hours.toLocaleString()} hrs`}
				</p>
				<p className="text-xs font-semibold text-base-content truncate w-full">
					{entry.asset_name}
				</p>
			</div>

			{/* Tooltip */}
			<Tooltip id={tooltipId} place="top" className="z-50 max-w-sm">
				<div className="text-xs space-y-1">
					{!!is_due && (
						<p className="text-red-400 font-semibold">
							⚠ Running hours are overdue for update
						</p>
					)}
					{!!is_no_schedule && (
						<p className="text-white italic">
							No maintenance schedule configured
						</p>
					)}
					<p className="text-sm font-semibold text-white truncate w-full">
						<span>{entry.asset_name}</span>
						<span className="text-xs opacity-50 text-white">
							@{entry.asset_location}
						</span>
					</p>

					<div className="flex gap-1">
						<PowerStatusBadge status={powerStatus} />
						{powerStatus}
						<span className="opacity-50">
							last checked{" "}
							{formatFriendlyDate(powerStatusLastUpdated, true) || "—"}
						</span>
					</div>

					<p className="font-semibold">
						encoded by: {checkerName} ({checkerTitle})
					</p>
					<p className="text-white">max running hours: {maxValue}</p>
					<p className="text-white">
						Checked{" "}
						<span className="font-bold opacity-100">
							{formatPastDateTimeLabel(checkedAt, true)}
						</span>{" "}
						({checkedAt})
					</p>
				</div>
			</Tooltip>
		</div>
	);
}

// ─── Group section (Vacuum / Air Compressor) ──────────────────────────────────
function SpeedometerGroup({ title, entries, speedometerData, maxValue }) {
	return (
		<section className="border border-base-content/10 p-2">
			<h2 className="text-base-content">{title}</h2>
			<div className="flex gap-2">
				{Object.entries(entries).map(([assetName, items]) => {
					const runningHours = items.find(
						(item) => item.item_name.toLowerCase() === "running hours",
					);
					const power = items.find(
						(item) => item.item_name.toLowerCase() === "vacuum pump",
					);

					return (
						<SpeedometerCard
							key={assetName}
							entry={runningHours}
							speedometerData={speedometerData}
							maxValue={maxValue}
							power={power}
						/>
					);
				})}
			</div>
		</section>
	);
}

// ─── Asset row inside expanded list ──────────────────────────────────────────
function AssetRow({ asset, color, barColor }) {
	const due = parseInt(asset.due_items) || 0;
	const done = parseInt(asset.done_items) || 0;
	const overdue = parseInt(asset.overdue_items) || 0;
	const total = due + done;
	const pct = total > 0 ? Math.round((done / total) * 100) : 0;

	return (
		<div className="flex items-center gap-3 py-2 hover:bg-black/5 transition-colors">
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-1">
					<span className="text-sm font-semibold text-base-content truncate">
						{asset.code}
					</span>
					{overdue > 0 && (
						<span className="text-[10px] font-light text-red-600 shrink-0">
							{overdue} overdue
						</span>
					)}
				</div>
				<p className="text-xs text-base-content/50 truncate">
					{asset.location_name}
				</p>
			</div>

			<div className="flex flex-col items-center gap-1 shrink-0">
				{total > 0 && (
					<div className="flex items-center gap-1.5">
						<div className="w-16 h-1.5 rounded-full bg-black/10 overflow-hidden">
							<div
								className={clsx("h-full rounded-full transition-all", barColor)}
								style={{ width: `${pct}%` }}
							/>
						</div>
					</div>
				)}
				<div className="flex items-end min-w-10">
					<div className={clsx("text-[11px] font-medium tabular-nums", color)}>
						{done}/{total}
					</div>
					<div className="text-[11px] text-base-content/50 w-8 text-right">
						{pct}%
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Single category card ─────────────────────────────────────────────────────
function CategoryCard({ category, assets = [] }) {
	const [expanded, setExpanded] = useState(false);
	const count = assets.length;

	return (
		<div
			className={clsx(
				"border overflow-hidden transition-all duration-200",
				category.border,
				expanded ? "shadow-md" : "shadow-sm hover:shadow-md",
			)}
		>
			{/* Header */}
			<button
				onClick={() => count > 0 && setExpanded((p) => !p)}
				className={clsx(
					"w-full flex items-center gap-4 p-4 transition-colors text-left",
					category.bg,
					count > 0 ? "cursor-pointer" : "cursor-default",
				)}
			>
				{/* Left indicator bar */}
				<div
					className={clsx(
						"w-1 self-stretch rounded-full shrink-0",
						category.indicator,
					)}
				/>

				{/* Icon */}
				<div className={clsx("shrink-0", category.color)}>{category.icon}</div>

				{/* Text */}
				<div className="flex-1 min-w-0">
					<p className={clsx("text-sm font-semibold", category.color)}>
						{category.label}
					</p>
					<p className="text-xs text-base-content/50">{category.description}</p>
				</div>

				{/* Count */}
				<div className="flex items-center gap-2 shrink-0">
					<span
						className={clsx(
							"text-2xl font-bold tabular-nums leading-none",
							count === 0 ? "text-base-content/30" : category.color,
						)}
					>
						{count}
					</span>
					{count > 0 && (
						<svg
							viewBox="0 0 20 20"
							fill="currentColor"
							className={clsx(
								"w-4 h-4 transition-transform duration-200 text-base-content/30",
								expanded && "rotate-180",
							)}
						>
							<path
								fillRule="evenodd"
								d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
								clipRule="evenodd"
							/>
						</svg>
					)}
				</div>
			</button>

			{/* Expanded asset list */}
			{expanded && count > 0 && (
				<div className="border-t border-black/5 px-2 py-1 max-h-60 overflow-y-auto">
					{assets.map((asset) => (
						<AssetRow
							key={asset.id}
							asset={asset}
							color={category.color}
							barColor={category.barColor}
						/>
					))}
				</div>
			)}
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────
function AssetDueCategories({ assets_due = mockData }) {
	return (
		<section className="space-y-2">
			<div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
				{ASSETS_CATEGORIES.map((category) => (
					<CategoryCard
						key={category.key}
						category={category}
						assets={assets_due[category.key] ?? []}
					/>
				))}
			</div>
		</section>
	);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
	const {
		vacuum_latest_results,
		air_compressor_latest_result,
		vacuum_running_hours_ok,
		assets_due,
		unverified_today,
		checklists_overview,
		unverified_total,
		vacuum_running_hours_warning,
		vacuum_running_hours_danger,
		air_compressor_running_hours_ok,
		air_compressor_running_hours_warning,
		air_compressor_running_hours_danger,
		all_latest_status_results,
	} = usePage().props;
	console.log(
		"🚀 ~ Dashboard ~ all_latest_status_results:",
		all_latest_status_results,
	);
	console.log("🚀 ~ Dashboard ~ checklists_overview:", checklists_overview);
	console.log("🚀 ~ Dashboard ~ assets_due:", assets_due);
	console.log(
		"🚀 ~ Dashboard ~ vacuum_latest_running_hours:",
		vacuum_latest_results,
	);
	console.log(
		"🚀 ~ Dashboard ~ air_compressor_latest_running_hours:",
		air_compressor_latest_result,
	);

	const vacuumMax =
		vacuum_running_hours_ok +
		vacuum_running_hours_warning +
		vacuum_running_hours_danger;
	const airCompressorMax =
		air_compressor_running_hours_ok +
		air_compressor_running_hours_warning +
		air_compressor_running_hours_danger;

	const vacuumSpeedometer = [
		{ name: "ok", value: vacuum_running_hours_ok, fill: statusColors.ok },
		{
			name: "warning",
			value: vacuum_running_hours_warning,
			fill: statusColors.warning,
		},
		{
			name: "danger",
			value: vacuum_running_hours_danger,
			fill: statusColors.danger,
		},
	];

	const airCompressorSpeedometer = [
		{
			name: "ok",
			value: air_compressor_running_hours_ok,
			fill: statusColors.ok,
		},
		{
			name: "warning",
			value: air_compressor_running_hours_warning,
			fill: statusColors.warning,
		},
		{
			name: "danger",
			value: air_compressor_running_hours_danger,
			fill: statusColors.danger,
		},
	];

	const total = ASSETS_CATEGORIES.reduce(
		(sum, cat) => sum + (assets_due[cat.key]?.length ?? 0),
		0,
	);

	return (
		<>
			<Head title="Dashboard" />

			<div className="space-y-4">
				<h1 className="text-2xl font-bold text-base-content">Dashboard</h1>

				<div className="flex gap-4">
					<div className="flex-1">
						<div className="flex items-center gap-2">
							<div className="flex flex-col">
								<h2 className="text-base font-semibold text-base-content">
									Checklist Status
								</h2>
								<span className="text-xs text-base-content/40">
									{total} assets total
								</span>
							</div>
							<div className="flex justify-center">
								<div className="font-bold flex gap-1 items-center text-primary">
									<div className="text-[30px]">{unverified_total}</div>
									<div className="">unverified checklist</div>
								</div>
							</div>
							{/* <div className="flex justify-center">
								<div className="font-bold flex gap-1 items-center text-primary">
									<div className="text-[30px]">
										{all_latest_no_good_results?.length ?? 0}
									</div>
									<div className="">"No Good" results</div>
								</div>
							</div> */}
							{/* <div className="font-bold text-primary text-center">
								{unverified_today}, today
							</div> */}
						</div>
						<AssetDueCategories assets_due={assets_due} />
					</div>
				</div>

				<div className="grid grid-cols-2 w-full gap-2">
					<div>
						<div className="flex justify-between items-end">
							<h1>Asset Status</h1>
							<div className="opacity-50 text-xs">Unique assets per status</div>
						</div>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(6, minmax(50px, 1fr))",
								gridTemplateRows: "repeat(2, auto)",
								gap: "8px",
							}}
						>
							{all_latest_status_results?.map((status, i) => (
								<div key={i} style={{ transitionDelay: `${i * 60}ms` }}>
									<StatCard
										statusKey={(status?.item_status ?? "").toLowerCase()}
										count={status?.asset_count ?? 0}
									/>
								</div>
							))}
						</div>
					</div>

					<div>
						<h1>Running Hours</h1>
						<SpeedometerGroup
							title="Vacuum"
							entries={vacuum_latest_results}
							speedometerData={vacuumSpeedometer}
							maxValue={vacuumMax}
						/>
						<SpeedometerGroup
							title="Air Compressor"
							entries={air_compressor_latest_result}
							speedometerData={airCompressorSpeedometer}
							maxValue={airCompressorMax}
						/>
					</div>
				</div>
			</div>
		</>
	);
}
