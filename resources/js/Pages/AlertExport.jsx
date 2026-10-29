import { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import clsx from "clsx";

const LEVEL_STYLES = {
	red: "border-red-200 bg-red-50 text-red-600",
	orange: "border-orange-200 bg-orange-50 text-orange-600",
	green: "border-green-200 bg-green-50 text-green-600",
};

function LevelBadge({ level }) {
	if (!level) return <span className="text-gray-300">–</span>;

	return (
		<span
			className={clsx(
				"inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
				LEVEL_STYLES[level],
			)}
		>
			{level}
		</span>
	);
}

export default function AlertExport({ filters, total, events }) {
	const { errors } = usePage().props;

	const [from, setFrom] = useState(filters.from);
	const [to, setTo] = useState(filters.to);
	const [loading, setLoading] = useState(false);

	// The download uses the filters the server applied, so what you see is what you get.
	const dirty = from !== filters.from || to !== filters.to;
	const canDownload = total > 0 && !dirty;

	function apply() {
		router.get(
			route("alerts.export"),
			{ from, to },
			{
				preserveState: true,
				preserveScroll: true,
				replace: true,
				onStart: () => setLoading(true),
				onFinish: () => setLoading(false),
			},
		);
	}

	const inputClass =
		"w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400";

	return (
		<div className="max-w-4xl mx-auto py-10 px-4">
			{/* Header */}
			<div className="mb-8">
				<p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
					Alert History
				</p>
				<h1 className="text-2xl font-medium text-gray-900">Export Alerts</h1>
			</div>

			{/* Filter card */}
			<div className="rounded-xl border border-gray-200 bg-white p-5 mb-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
					<div>
						<label className="block text-xs text-gray-500 mb-2">From</label>
						<input
							type="datetime-local"
							value={from}
							onChange={(e) => setFrom(e.target.value)}
							className={inputClass}
						/>
						{errors?.from && (
							<p className="text-xs text-red-500 mt-1">{errors.from}</p>
						)}
					</div>
					<div>
						<label className="block text-xs text-gray-500 mb-2">To</label>
						<input
							type="datetime-local"
							value={to}
							onChange={(e) => setTo(e.target.value)}
							className={inputClass}
						/>
						{errors?.to && (
							<p className="text-xs text-red-500 mt-1">{errors.to}</p>
						)}
					</div>
				</div>

				{/* Summary */}
				<div className="rounded-md bg-gray-50 px-4 py-3 mb-5 text-sm text-gray-500">
					<span className="font-medium text-gray-800">{total}</span>{" "}
					{total === 1 ? "alert" : "alerts"} between{" "}
					<span className="font-medium text-gray-800">
						{filters.from.replace("T", " ")}
					</span>{" "}
					and{" "}
					<span className="font-medium text-gray-800">
						{filters.to.replace("T", " ")}
					</span>
					.
					{dirty && (
						<span className="ml-1 text-yellow-700">
							Apply the new range to refresh.
						</span>
					)}
				</div>

				<div className="grid grid-cols-2 gap-2">
					<button
						onClick={apply}
						disabled={!dirty || loading}
						className={clsx(
							"py-2.5 text-sm font-medium rounded-md border transition-colors",
							!dirty || loading
								? "border-gray-200 text-gray-400 cursor-not-allowed"
								: "border-gray-300 text-gray-800 hover:bg-gray-50 active:bg-gray-100 cursor-pointer",
						)}
					>
						{loading ? "Loading…" : "Apply range"}
					</button>

					{canDownload ? (
						<a
							href={route("alerts.export.download", {
								from: filters.from,
								to: filters.to,
							})}
							className="py-2.5 text-sm font-medium rounded-md border border-gray-300 text-gray-800 text-center hover:bg-gray-50 active:bg-gray-100"
						>
							Export Excel
						</a>
					) : (
						<span className="py-2.5 text-sm font-medium rounded-md border border-gray-200 text-gray-400 text-center cursor-not-allowed">
							Export Excel
						</span>
					)}
				</div>
			</div>

			{/* Preview */}
			<div className="rounded-xl border border-gray-200 bg-white">
				<div className="px-5 py-3 border-b border-gray-100 text-sm text-gray-500">
					{total > events.length
						? `Showing the latest ${events.length} of ${total} alerts`
						: "Alerts in range"}
				</div>

				{events.length === 0 ? (
					<p className="px-5 py-8 text-sm text-gray-400 text-center">
						No orange or red alerts in this range.
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-xs text-gray-400">
									<th className="px-5 py-2 font-normal">Time</th>
									<th className="px-3 py-2 font-normal">Location</th>
									<th className="px-3 py-2 font-normal">Status</th>
									<th className="px-3 py-2 font-normal">Previous</th>
									<th className="px-3 py-2 font-normal text-right">Temp</th>
									<th className="px-5 py-2 font-normal text-right">RH</th>
								</tr>
							</thead>
							<tbody>
								{events.map((e) => (
									<tr key={e.id} className="border-t border-gray-100">
										<td className="px-5 py-2 text-gray-600 whitespace-nowrap">
											{e.alerted_at}
										</td>
										<td className="px-3 py-2 text-gray-900">{e.location}</td>
										<td className="px-3 py-2">
											<LevelBadge level={e.level} />
										</td>
										<td className="px-3 py-2">
											<LevelBadge level={e.previous_level} />
										</td>
										<td className="px-3 py-2 text-right whitespace-nowrap">
											{e.temp} °C
										</td>
										<td className="px-5 py-2 text-right whitespace-nowrap">
											{e.rh} %
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}