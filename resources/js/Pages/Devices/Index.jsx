import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { router } from "@inertiajs/react";
const EMPTY_INPUT = { id: null, ip: "", location: "" };
import { usePage } from "@inertiajs/react";

export default function DevicesIndex({ devices: initialDevices }) {
	console.log("🚀 ~ DevicesIndex ~ initialDevices:", initialDevices);
	const [devices, setDevices] = useState(initialDevices);
	console.log("🚀 ~ DevicesIndex ~ devices:", devices);

	const { flash } = usePage().props;

	useEffect(() => {
		setDevices(initialDevices);
	}, [initialDevices]);

	useEffect(() => {
		if (flash.success) toast.success(flash.success);
		if (flash.error) toast.error(flash.error);
	}, [flash]);

	const [input, setInput] = useState(EMPTY_INPUT);
	const [alert, setAlert] = useState({ messages: [], type: "success" });
	const [loading, setLoading] = useState(false);
	const [showExport, setShowExport] = useState(false);
	const [dateRange, setDateRange] = useState({
		from: new Date().toISOString().slice(0, 10),
		to: new Date().toISOString().slice(0, 10),
	});

	// Table state
	const [search, setSearch] = useState("");
	const [perPage, setPerPage] = useState(10);
	const [currentPage, setCurrentPage] = useState(0);
	const [sortKey, setSortKey] = useState("ip");
	const [sortAsc, setSortAsc] = useState(true);

	// --- filtering / sorting / pagination ---
	const filtered = useMemo(() => {
		const q = search.toLowerCase();
		return devices
			.filter(
				(d) =>
					d.ip.toLowerCase().includes(q) ||
					d.location.toLowerCase().includes(q),
			)
			.sort((a, b) => {
				const cmp = a[sortKey].localeCompare(b[sortKey]);
				return sortAsc ? cmp : -cmp;
			});
	}, [devices, search, sortKey, sortAsc]);

	const totalPages = Math.ceil(filtered.length / perPage);
	const paginated = filtered.slice(
		currentPage * perPage,
		(currentPage + 1) * perPage,
	);

	function toggleSort(key) {
		if (sortKey === key) setSortAsc((v) => !v);
		else {
			setSortKey(key);
			setSortAsc(true);
		}
		setCurrentPage(0);
	}

	// --- CRUD ---
	function handleStore() {
		setLoading(true);
		router.post(route("devices.store"), input, {
			onSuccess: () => clearInput(),
			onError: (errors) =>
				toast.error(`Error: ${Object.values(errors).flat().join(", ")}`),
			onFinish: () => setLoading(false),
		});
	}

	function handleUpdate() {
		setLoading(true);
		router.put(route("devices.update", input.id), input, {
			onSuccess: () => clearInput(),
			onError: (errors) =>
				toast.error(`Error: ${Object.values(errors).flat().join(", ")}`),
			onFinish: () => setLoading(false),
		});
	}

	function handleDelete(device) {
		if (!confirm("Are you sure you want to delete this device?")) return;
		setLoading(true);
		router.delete(route("devices.destroy", device.id), {
			onError: () => toast.error("Failed to delete device"),
			onFinish: () => setLoading(false),
		});
	}

	function setEditInput(device) {
		setInput({ id: device.id, ip: device.ip, location: device.location });
	}

	function clearInput() {
		setInput(EMPTY_INPUT);
	}

	function handleExport() {
		const params = new URLSearchParams(dateRange).toString();
		window.location.href = route("devices.export") + "?" + params;
	}

	return (
		<>
			<div className="max-w-5xl mx-auto space-y-6">
				{/* Alert */}
				{alert.messages.length > 0 && (
					<div
						className={`alert ${alert.type === "error" ? "alert-error" : "alert-success"}`}
					>
						{alert.messages.map((m, i) => (
							<span key={i}>{m}</span>
						))}
					</div>
				)}

				{/* Table Card */}
				<div className="card bg-base-100 shadow">
					<div className="card-body">
						<div className="flex items-center justify-between mb-4 flex-wrap gap-3">
							<h2 className="card-title">Devices</h2>
							<div className="flex gap-3 items-center flex-wrap">
								<input
									type="text"
									placeholder="Search..."
									className="input input-bordered input-sm w-48"
									value={search}
									onChange={(e) => {
										setSearch(e.target.value);
										setCurrentPage(0);
									}}
								/>
								<select
									className="select select-bordered select-sm"
									value={perPage}
									onChange={(e) => {
										setPerPage(Number(e.target.value));
										setCurrentPage(0);
									}}
								>
									{[5, 10, 25, 50, 100].map((n) => (
										<option key={n} value={n}>
											{n} / page
										</option>
									))}
								</select>
								<button
									type="button"
									className="btn btn-outline btn-sm gap-2"
									onClick={() => setShowExport(true)}
								>
									<i className="fa fa-download" /> Export Failed Logs
								</button>
							</div>
						</div>

						<div className="overflow-x-auto">
							<table className="table table-zebra w-full">
								<thead>
									<tr>
										{["ip", "location"].map((col) => (
											<th
												key={col}
												className="cursor-pointer select-none"
												onClick={() => toggleSort(col)}
											>
												{col.toUpperCase()}
												{sortKey === col && (
													<span className="ml-1">{sortAsc ? "↑" : "↓"}</span>
												)}
											</th>
										))}
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{paginated.length === 0 ? (
										<tr>
											<td
												colSpan={3}
												className="text-center text-base-content/50 py-8"
											>
												No devices found
											</td>
										</tr>
									) : (
										paginated.map((device) => (
											<tr key={device.id}>
												<td className="font-mono">{device.ip}</td>
												<td>{device.location}</td>
												<td className="flex gap-2">
													<button
														type="button"
														className="btn btn-ghost btn-xs gap-1"
														onClick={() => setEditInput(device)}
													>
														<i className="fa fa-edit" /> Edit
													</button>
													<button
														type="button"
														className="btn btn-ghost btn-xs text-error gap-1"
														onClick={() => handleDelete(device)}
													>
														<i className="fa fa-trash" /> Delete
													</button>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="join mt-4 flex justify-center">
								<button
									type="button"
									className="join-item btn btn-sm"
									onClick={() => setCurrentPage(0)}
								>
									«
								</button>
								<button
									type="button"
									className="join-item btn btn-sm"
									onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
								>
									‹
								</button>
								{Array.from({ length: totalPages }, (_, i) => (
									<button
										type="button"
										key={i}
										className={`join-item btn btn-sm ${currentPage === i ? "btn-active" : ""}`}
										onClick={() => setCurrentPage(i)}
									>
										{i + 1}
									</button>
								))}
								<button
									type="button"
									className="join-item btn btn-sm"
									onClick={() =>
										setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
									}
								>
									›
								</button>
								<button
									type="button"
									className="join-item btn btn-sm"
									onClick={() => setCurrentPage(totalPages - 1)}
								>
									»
								</button>
							</div>
						)}
					</div>
				</div>

				{/* Form Card */}
				<div className="card bg-base-100 shadow">
					<div className="card-body">
						<h2 className="card-title">
							{input.id ? "Edit Device" : "Add Device"}
						</h2>
						<div className="flex gap-4 flex-wrap items-end">
							<div className="form-control">
								<label className="label">
									<span className="label-text">IP</span>
								</label>
								<input
									type="text"
									className="input input-bordered"
									placeholder="192.168.1.1"
									value={input.ip}
									onChange={(e) =>
										setInput((p) => ({ ...p, ip: e.target.value }))
									}
								/>
							</div>
							<div className="form-control">
								<label className="label">
									<span className="label-text">Location</span>
								</label>
								<input
									type="text"
									className="input input-bordered"
									placeholder="Server Room A"
									value={input.location}
									onChange={(e) =>
										setInput((p) => ({ ...p, location: e.target.value }))
									}
								/>
							</div>
							<div className="flex gap-2">
								{input.id ? (
									<button
										type="button"
										className="btn btn-primary gap-2"
										onClick={handleUpdate}
										disabled={loading}
									>
										{loading ? (
											<span className="loading loading-spinner loading-sm" />
										) : (
											<i className="fa fa-save" />
										)}
										Save
									</button>
								) : (
									<button
										type="button"
										className="btn btn-primary gap-2"
										onClick={handleStore}
										disabled={loading}
									>
										{loading ? (
											<span className="loading loading-spinner loading-sm" />
										) : (
											<i className="fa fa-plus" />
										)}
										Insert
									</button>
								)}
								<button
									type="button"
									className="btn btn-ghost"
									onClick={clearInput}
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Export Modal */}
			{showExport && (
				<div className="modal modal-open">
					<div className="modal-box">
						<button
							type="button"
							className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
							onClick={() => setShowExport(false)}
						>
							✕
						</button>
						<h3 className="font-bold text-lg mb-4">
							Export Failed RH & Temperature Logs
						</h3>
						<div className="flex gap-4 flex-wrap mb-6">
							<div className="form-control">
								<label className="label">
									<span className="label-text">From</span>
								</label>
								<input
									type="date"
									className="input input-bordered"
									value={dateRange.from}
									onChange={(e) =>
										setDateRange((p) => ({ ...p, from: e.target.value }))
									}
								/>
							</div>
							<div className="form-control">
								<label className="label">
									<span className="label-text">To</span>
								</label>
								<input
									type="date"
									className="input input-bordered"
									value={dateRange.to}
									onChange={(e) =>
										setDateRange((p) => ({ ...p, to: e.target.value }))
									}
								/>
							</div>
						</div>
						<button
							type="button"
							className="btn btn-primary gap-2 w-full"
							onClick={handleExport}
						>
							<i className="fa fa-download" /> Extract to CSV
						</button>
					</div>
					<div
						className="modal-backdrop"
						onClick={() => setShowExport(false)}
					/>
				</div>
			)}
		</>
	);
}
