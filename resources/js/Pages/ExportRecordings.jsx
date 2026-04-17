import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { useFetch } from "@/Hooks/useFetch";
import { useExportStore } from "@/Store/useExportStore";

const PERIODS = [
	{ value: "day", label: "1 Day" },
	{ value: "week", label: "1 Week" },
	{ value: "month", label: "1 Month" },
	{ value: "year", label: "1 Year" },
];

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

const today = new Date();

function csrfToken() {
	return document.querySelector('meta[name="csrf-token"]')?.content ?? "";
}

export default function ExportRecordings() {
	const {
		startMonitoring,
		stopMonitoring,
		updateStatus,
		activeJobId,
		progress,
		status,
	} = useExportStore();

	const [year, setYear] = useState(today.getFullYear());
	const [month, setMonth] = useState(today.getMonth() + 1);
	const [day, setDay] = useState(today.getDate());
	const [period, setPeriod] = useState("day");

	const [fileUrl, setFileUrl] = useState(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);
	const [health, setHealth] = useState([]);

	const daysInMonth = new Date(year, month, 0).getDate();
	const clampedDay = Math.min(day, daysInMonth);

	useEffect(() => {
		if (day > daysInMonth) setDay(daysInMonth);
	}, [month, year]);

	// useEffect(() => {
	// 	fetch("/devices/health")
	// 		.then((r) => r.json())
	// 		.then((data) => setHealth(data.filter((d) => !d.reachable)))
	// 		.catch(() => {});
	// }, []);

	const {
		data: healthData,
		isLoading: isHealthDataLoading,
		errorMessage: healthDataErrorMessage,
		fetch: healthDataFetch,
	} = useFetch(route("devices.health"), {
		auto: false,
	});

	useEffect(() => {
		if (fileUrl) window.location.href = fileUrl;
	}, [fileUrl]);

	async function handleExport() {
		setLoading(true);
		setError(null);
		updateStatus({ status: null, progress: null });
		setFileUrl(null);
		stopMonitoring();

		try {
			const res = await fetch("/export", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-CSRF-TOKEN": csrfToken(),
				},
				body: JSON.stringify({
					date: `${year}-${String(month).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`,
					period,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message ?? "Failed to start export.");
			if (data.job_id) {
				startMonitoring(data.job_id);
				// toast.success("Export started! You can navigate away now.");
			}
		} catch (e) {
			setError(e.message ?? "Failed to start export.");
			updateStatus({ status: "failed", progress: "0 / 0" });
		} finally {
			setLoading(false);
		}
	}

	const isRunning = status === "pending" || status === "processing";

	const [current, total] = progress
		? progress.split(" / ").map((val) => parseInt(val, 10))
		: [0, 0];

	return (
		<div className="max-w-lg mx-auto py-10 px-4">
			{/* Header */}
			<div className="mb-8">
				<p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
					Recording Export
				</p>
				<h1 className="text-2xl font-medium text-gray-900">
					Download Device Data
				</h1>
			</div>

			{/* Unreachable devices warning */}
			{health.length > 0 && (
				<div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
					<span className="font-medium">
						{health.length} device{health.length > 1 ? "s" : ""} currently
						unreachable:
					</span>{" "}
					{health.map((d) => d.location).join(", ")}
				</div>
			)}

			{/* Form card */}
			<div className="rounded-xl border border-gray-200 bg-white p-5 mb-4">
				{/* Date */}
				<div className="mb-5">
					<label className="block text-xs text-gray-500 mb-2">Date</label>
					<div className="grid grid-cols-[1fr_2fr_1fr] gap-2">
						<div>
							<select
								value={clampedDay}
								onChange={(e) => setDay(Number(e.target.value))}
								className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
							>
								{Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
									(d) => (
										<option key={d} value={d}>
											{d}
										</option>
									),
								)}
							</select>
							<p className="text-center text-xs text-gray-400 mt-1">Day</p>
						</div>
						<div>
							<select
								value={month}
								onChange={(e) => setMonth(Number(e.target.value))}
								className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
							>
								{MONTHS.map((m, i) => (
									<option key={i + 1} value={i + 1}>
										{m}
									</option>
								))}
							</select>
							<p className="text-center text-xs text-gray-400 mt-1">Month</p>
						</div>
						<div>
							<input
								type="number"
								value={year}
								min={2000}
								max={2099}
								onChange={(e) => setYear(Number(e.target.value))}
								className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
							/>
							<p className="text-center text-xs text-gray-400 mt-1">Year</p>
						</div>
					</div>
				</div>

				{/* Period */}
				<div className="mb-5">
					<label className="block text-xs text-gray-500 mb-2">Period</label>
					<div className="grid grid-cols-4 gap-2">
						{PERIODS.map((p) => (
							<button
								key={p.value}
								onClick={() => setPeriod(p.value)}
								className={clsx(
									"py-2 text-sm rounded-md border transition-colors",
									period === p.value
										? "border-gray-400 bg-gray-100 font-medium text-gray-900"
										: "border-gray-200 bg-transparent text-gray-600 hover:bg-gray-50",
								)}
							>
								{p.label}
							</button>
						))}
					</div>
				</div>

				{/* Summary */}
				<div className="rounded-md bg-gray-50 px-4 py-3 mb-5 text-sm text-gray-500">
					Exporting{" "}
					<span className="font-medium text-gray-800">
						{PERIODS.find((p) => p.value === period)?.label}
					</span>{" "}
					of data from{" "}
					<span className="font-medium text-gray-800">
						{MONTHS[month - 1]} {clampedDay}, {year}
					</span>{" "}
					across all devices.
				</div>

				{/* Export button */}
				<button
					onClick={handleExport}
					disabled={isRunning || loading}
					className={clsx(
						"w-full py-2.5 text-sm font-medium rounded-md border transition-colors",
						isRunning || loading
							? "border-gray-200 text-gray-400 cursor-not-allowed"
							: "border-gray-300 text-gray-800 hover:bg-gray-50 active:bg-gray-100 cursor-pointer",
					)}
				>
					{loading ? "Starting…" : isRunning ? "Exporting…" : "Export Excel"}
				</button>
			</div>

			{/* Status card */}
			{status && (
				<div
					className={clsx(
						"rounded-xl border bg-white px-5 py-4",
						status === "done" && "border-green-200",
						status === "failed" && "border-red-200",
						(status === "pending" || status === "processing") &&
							"border-gray-200",
					)}
				>
					<div className="flex items-center justify-between mb-2">
						<div
							className={clsx(
								"text-sm font-medium",
								status === "done" && "text-green-600",
								status === "failed" && "text-red-500",
								(status === "pending" || status === "processing") &&
									"text-gray-500",
							)}
						>
							{status === "pending" && "Queued"}
							{status === "processing" && "Processing"}
							{status === "processing" && (
								<span className="opacity-75 ml-1">
									this may take a while •◡•
								</span>
							)}
							{status === "done" && "Done"}
							{status === "failed" && "Failed"}
						</div>
						{progress && (
							<span className="text-sm text-gray-400">{progress}</span>
						)}
					</div>

					{/* Progress bar */}
					{isRunning && progress && (
						<progress
							className="progress progress-primary w-full"
							value={current}
							max={total}
						></progress>
					)}

					{status === "done" && (
						<p className="text-sm text-green-600 mt-1.5">
							File ready — download starting automatically.
						</p>
					)}

					{status === "failed" && error && (
						<p className="text-sm text-red-500 mt-1.5">{error}</p>
					)}
				</div>
			)}
		</div>
	);
}
