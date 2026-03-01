import CancellableActionButton from "@/Components/CancellableActionButton";
import SmartCalendarContainer from "@/Components/DatePicker";
import Modal from "@/Components/Modal";
import Pagination from "@/Components/Pagination";
import { createClickableCell } from "@/Components/tanStackTable/ClickableCell";
import TanstackTable from "@/Components/tanStackTable/TanstackTable";
import { useEditableTable } from "@/Hooks/useEditableTable";
import { useMutation } from "@/Hooks/useMutation";
import formatDateTime from "@/Utils/formatDateTime";
import formatFriendlyDate from "@/Utils/formatFriendlyDate";
import { formatTimestamp } from "@/Utils/formatISOTimestampToDate";
import formatPastDateTimeLabel from "@/Utils/formatPastDateTimeLabel";
import { router, usePage } from "@inertiajs/react";
import clsx from "clsx";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MdVerified } from "react-icons/md";

const reviewResultsModalID = "checklist-instance-results-modal";
const maxItem = 30; // all

function RestroomMonitoringInstanceList() {
	const {
		restroomMonitoringInstance: serverRestroomMonitoringInstanceInstance,
		verified: serverVerified,
		createdAtStart: serverCreatedAtStart,
		createdAtEnd: serverCreatedAtEnd,
		perPage: serverPerPage,
		totalEntries,
	} = usePage().props;
	const [selectedInstance, setSelectedInstance] = useState([]);
	const [filterVerified, setFilterVerified] = useState(serverVerified);
	const [filterCreateDateStart, setFilterCreateDateStart] =
		useState(serverCreatedAtStart);
	const [filterCreateDateEnd, setFilterCreateDateEnd] =
		useState(serverCreatedAtEnd);

	const isMounted = useRef(false);

	useEffect(() => {
		if (!isMounted.current) {
			isMounted.current = true;
			return;
		}

		router.reload({
			data: {
				verified: filterVerified,
				createdAtStart: formatDateTime(filterCreateDateStart),
				createdAtEnd: formatDateTime(filterCreateDateEnd),
				perPage: serverPerPage,
			},
			preserveState: true,
			preserveScroll: true,
		});
	}, [filterVerified, filterCreateDateStart, filterCreateDateEnd]);

	const refresh = () => {
		router.reload({
			data: {
				createdAtStart: formatDateTime(filterCreateDateStart),
				createdAtEnd: formatDateTime(filterCreateDateEnd),
				perPage: maxItem,
			},
			preserveState: true,
			preserveScroll: true,
		});
	};

	function handleEditedItemClick(row, value, column) {
		setSelectedInstance(row.original);
	}

	const {
		mutate,
		isLoading: isMutateLoading,
		errorMessage: mutateErrorMessage,
		errorData: mutateErrorData,
		cancel: mutateCancel,
	} = useMutation();

	const columns = React.useMemo(
		() => [
			{
				header: "Results (click for more details)",
				accessorFn: (row) => {
					if (!row.results || row.results.length === 0) return "No results";

					return `review (${row.results.length}) item results`;
				},
				size: 250,
				cell: createClickableCell({
					modalID: reviewResultsModalID,
					handleCellClick: handleEditedItemClick,
					isEditable: false,
				}),
			},
			{
				header: "Verified",
				accessorKey: "verified_at",
				cell: ({ row }) => {
					const { verified_at, verified_by, verifier } = row.original;
					const notVerified = !verified_at && !verified_by;

					const verifierName = verifier
						? `${verifier.FIRSTNAME} ${verifier.LASTNAME}`
						: "unknown";

					return (
						<div className="flex flex-col px-1 gap-1 text-left w-full">
							<div className="text-xs">
								by:
								{verified_by ? (
									<span className="ml-1 badge badge-xs badge-soft badge-primary">
										{verifierName} ({verified_by})
									</span>
								) : (
									<span className="ml-1 opacity-50 text-xs">N/A</span>
								)}
							</div>
							<div
								className={clsx("text-xs", {
									"badge-success": !notVerified,
								})}
							>
								{formatPastDateTimeLabel(verified_at)}
								<span className="ml-1 opacity-50">
									{verified_at ? formatTimestamp(verified_at) : "pending"}
								</span>
							</div>
							<div
								className={clsx(
									"absolute -right-1 top-0 w-1 h-full",
									notVerified ? "bg-warning" : "bg-success",
								)}
							/>
						</div>
					);
				},
				size: 150,
			},
			{
				header: "Performed",
				accessorKey: "created_at",
				cell: ({ row }) => {
					const { created_at, created_by, creator } = row.original;
					console.log("🚀 ~ ChecklistInstanceList ~ created_at:", created_at);

					const creatorName = creator
						? `${creator.FIRSTNAME} ${creator.LASTNAME}`
						: "unknown";

					return (
						<div className="flex flex-col px-1 gap-1 w-full">
							<div className="text-xs">
								<div className="text-xs">
									by:
									{created_by ? (
										<span className="ml-1 badge badge-xs badge-soft badge-primary">
											{creatorName} ({created_by})
										</span>
									) : (
										<span className="ml-1 opacity-50 text-xs">N/A</span>
									)}
								</div>
							</div>
							<div className="text-xs w-full badge-secondary">
								{formatPastDateTimeLabel(created_at)}
								<span className="ml-1 opacity-50">
									{created_at
										? `${formatTimestamp(created_at)}`
										: "Not checked"}
								</span>
							</div>
						</div>
					);
				},
				size: 150,
			},
		],
		[],
	);

	const { table } = useEditableTable(
		serverRestroomMonitoringInstanceInstance.data || [],
		columns,
		{
			isMultipleSelection: true,
		},
	);

	const goToPage = (page) => {
		router.reload({
			data: {
				perPage: maxItem,
				page,
			},
			preserveState: false,
			preserveScroll: true,
		});
	};

	const handleDateFilterChange = (dates) => {
		const [start, end] = dates;
		setFilterCreateDateStart(start);
		setFilterCreateDateEnd(end);
	};

	const handleVerify = async (
		instances = Object.keys(table.getState().rowSelection),
	) => {
		if (instances.length === 0) {
			alert("No selected rows to verify.");
			return;
		}

		try {
			await mutate(route("api.restroom-monitoring-instance.verify"), {
				method: "PATCH",
				body: instances,
			});

			toast.success("Restroom Monitoring Checklist verified successfully!");
			table.resetRowSelection();
			refresh();
		} catch (error) {
			toast.error(error?.message);
			console.error(error);
		}
	};

	return (
		<div>
			<h1 className="text-lg font-semibold">Restroom Monitoring List</h1>
			<div className="flex">
				<fieldset className="fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4">
					<legend className="fieldset-legend">Filter Verified</legend>
					<label className="label">
						<input
							type="checkbox"
							checked={filterVerified}
							className="toggle border-warning-600 bg-warning-500 checked:border-success-500 checked:bg-success-400 checked:text-success"
							onChange={(e) => setFilterVerified(e.target.checked)}
						/>
						<span className="label-text">
							{filterVerified ? "Verified" : "Unverified"}
						</span>
					</label>
				</fieldset>

				<div className="flex flex-col w-full">
					<div>Date performed filter</div>

					<SmartCalendarContainer
						selectedDate={filterCreateDateStart}
						onChange={handleDateFilterChange}
						startDate={filterCreateDateStart}
						endDate={filterCreateDateEnd}
						props={{
							portalId: "root-portal",
							className: "w-120 input z-50",
							swapRange: true,
							selectsRange: true,
							isClearable: true,
							showTimeSelect: true,
							timeIntervals: 15,
							dateFormat: "yyyy-MM-dd HH:mm",
						}}
					/>
				</div>
			</div>
			<div className="flex gap-2 sticky right-0">
				<CancellableActionButton
					abort={mutateCancel}
					refetch={handleVerify}
					loading={isMutateLoading}
					buttonText="verify"
					loadingMessage="Verifying..."
					buttonClassName="btn-accent"
					disabled={Object.keys(table.getState().rowSelection).length === 0}
				/>
			</div>

			<Pagination
				links={serverRestroomMonitoringInstanceInstance?.links}
				currentPage={serverRestroomMonitoringInstanceInstance?.current_page}
				goToPage={goToPage}
				filteredTotal={serverRestroomMonitoringInstanceInstance?.total}
				overallTotal={totalEntries}
				start={serverRestroomMonitoringInstanceInstance?.from}
				end={serverRestroomMonitoringInstanceInstance?.to}
			/>

			<TanstackTable table={table} />

			<Modal
				id={reviewResultsModalID}
				title="Review Checklist"
				className="w-11/12 max-w-6xl"
			>
				<div className="flex justify-between items-center">
					<div className="leading-3 text-xs opacity-75">
						created{" "}
						<span className="font-semibold">
							{formatPastDateTimeLabel(selectedInstance?.created_at)}
						</span>{" "}
						({formatFriendlyDate(selectedInstance?.created_at, true)})
					</div>
				</div>
				<div className="mt-2 overflow-x-auto max-h-160">
					<table className="border border-base-content/10 table table-zebra w-full divide-y">
						<thead className="">
							<tr>
								<th className="px-4 py-2 text-left text-sm">Chemical Name</th>
								<th className="px-4 py-2 text-left text-sm">Status</th>
								<th className="px-4 py-2 text-left text-sm">Remarks</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{selectedInstance?.results?.length > 0 &&
								selectedInstance?.results.map((r) => (
									<tr key={r.id} className="">
										<td className={clsx("px-4 py-2 text-sm")}>
											{r?.restroom?.restroom_name || "N/A"}
										</td>
										<td className="px-4 py-2 text-sm ">{r.status || "N/A"}</td>
										<td className="px-4 py-2 text-sm ">{r.remarks || "N/A"}</td>
									</tr>
								))}

							{selectedInstance?.results?.length === 0 && (
								<tr>
									<td colSpan="5" className="px-4 py-2 text-sm text-center">
										No items
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
				<div className="flex justify-between border border-base-content/10 w-full p-2">
					<div>notes: {selectedInstance.notes || "N/A"}</div>
					{selectedInstance?.verified_at ? (
						<div>
							<MdVerified className="text-success inline mr-1" /> verified{" "}
							{formatPastDateTimeLabel(selectedInstance?.verified_at)} by
							<span className="px-1 text-primary">
								{selectedInstance?.verifier?.FIRSTNAME || "unkown"}
							</span>
							<span>({selectedInstance?.verifier?.EMPLOYID || "unkown"})</span>
						</div>
					) : (
						<button
							type="button"
							className="btn btn-primary"
							onClick={() => handleVerify([selectedInstance?.id])}
						>
							Verify
						</button>
					)}
				</div>
			</Modal>
		</div>
	);
}

export default RestroomMonitoringInstanceList;
