import { usePage } from "@inertiajs/react";
import {
	MdOutlinePersonOutline,
	MdLogout,
	MdFileDownload,
} from "react-icons/md";
import { useExportStore } from "@/Store/useExportStore";
import clsx from "clsx";

export default function NavBar() {
	const { emp_data } = usePage().props;

	// const { status, progress, fileUrl, stopMonitoring } = useExportStore();

	// // Parse progress string "2 / 32 devices"
	// const [current, total] = progress
	// 	? progress.split(" / ").map((val) => parseInt(val, 10))
	// 	: [0, 0];
	// const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

	const logout = () => {
		localStorage.clear();
		sessionStorage.clear();
		window.location.href = route("logout");
	};

	return (
		<nav className="border-b border-base-200">
			<div className="px-4">
				<div className="flex justify-end items-center h-12.5 space-x-4">
					{/* --- EXPORT PROGRESS SECTION --- */}
					{/* {status !== "idle" && (
						<div className="flex items-center">
							<button
								type="button"
								className="btn btn-ghost"
								popoverTarget="export-popover"
								style={{ anchorName: "--export-anchor" }}
							>
								<div
									className={`radial-progress text-primary transition-all ${status === "done" ? "text-success" : ""}`}
									style={{
										"--value": percentage,
										"--size": "2.5rem",
										"--thickness": "3px",
									}}
									role="progressbar"
								>
									<span className="text-[10px] font-bold text-base-content">
										{percentage}%
									</span>
								</div>
							</button>

							<ul
								className="dropdown menu w-64 rounded-box bg-base-100 shadow-xl border border-base-200 p-2"
								popover="auto"
								id="export-popover"
								style={{ positionAnchor: "--export-anchor" }}
							>
								<h3 className="font-bold text-sm mb-1">Export Status</h3>
								<li className="text-xs opacity-70">Progress: {progress}</li>

								{status === "processing" && (
									<div className="mt-2 border-t flex gap-2 items-center pt-1">
										<div className="text-[10px] text-gray-400">
											Taking too long?
										</div>
										<button
											onClick={() => stopMonitoring()}
											className="btn btn-xs btn-outline btn-error"
										>
											Stop Tracking
										</button>
									</div>
								)}

								{status === "done" && fileUrl ? (
									<li>
										<a
											href={fileUrl}
											download
											className="mt-1 btn btn-success btn-sm text-neutral flex items-center justify-center"
											onClick={() => stopMonitoring()}
										>
											<MdFileDownload className="w-5 h-5" />
											Download File
										</a>
									</li>
								) : (
									<div
										className={clsx(
											"py-2 text-center mt-1 text-xs rounded-lg text-warning animate-pulse",
											{
												"border border-error": status === "failed",
												"border border-warning bg-warning text-warning-content":
													status === "processing",
											},
										)}
									>
										{status === "failed"
											? "Export Failed"
											: "Preparing file..."}
									</div>
								)}
							</ul>
						</div>
					)} */}

					{/* --- USER DROPDOWN SECTION --- */}
					<div className="dropdown dropdown-end">
						<div tabIndex={0} role="button" className="btn btn-sm">
							Hello, {emp_data?.emp_firstname}
						</div>
						<ul
							tabIndex={0}
							className="dropdown-content menu bg-base-100 z-1 w-52 p-2 shadow-sm border border-base-200 mt-2"
						>
							<li>
								<a href={route("profile.index")}>
									<MdOutlinePersonOutline className="w-5 h-5" /> Profile
								</a>
							</li>
							<li>
								<a onClick={logout} className="text-error">
									<MdLogout className="w-5 h-5" /> Log out
								</a>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</nav>
	);
}
