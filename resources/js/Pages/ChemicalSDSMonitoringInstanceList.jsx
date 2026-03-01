import SmartCalendarContainer from "@/Components/DatePicker";
import Modal from "@/Components/Modal";
import Pagination from "@/Components/Pagination";
import { createClickableCell } from "@/Components/tanStackTable/ClickableCell";
import TanstackTable from "@/Components/tanStackTable/TanstackTable";
import { useEditableTable } from "@/Hooks/useEditableTable";
import formatDateTime from "@/Utils/formatDateTime";
import formatFriendlyDate from "@/Utils/formatFriendlyDate";
import { formatTimestamp } from "@/Utils/formatISOTimestampToDate";
import formatPastDateTimeLabel from "@/Utils/formatPastDateTimeLabel";
import { router, usePage } from "@inertiajs/react";
import clsx from "clsx";
import React, { useEffect, useState } from "react";

const reviewResultsModalID = "checklist-instance-results-modal";
const maxItem = 30; // all

function ChemicalSDSMonitoringInstanceList() {
	const {
		sdsInstance: serverSDSInstance,
		createdAtStart: serverCreatedAtStart,
		createdAtEnd: serverCreatedAtEnd,
		perPage: serverPerPage,
		totalEntries,
	} = usePage().props;

	const [selectedInstance, setSelectedInstance] = useState([]);

	const [filterCreateDateStart, setFilterCreateDateStart] =
		useState(serverCreatedAtStart);
	const [filterCreateDateEnd, setFilterCreateDateEnd] =
		useState(serverCreatedAtEnd);

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
		console.log("🚀 ~ handleEditedItemClick ~ row:", row);
		// const rootKey = column?.columnDef?.accessorKey?.split(".")[0];
		// setSelectedCell({ rootKey, row, value, column });
		// setSelectedEditItem([value]);
		setSelectedInstance(row.original);
	}

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

	const { table } = useEditableTable(serverSDSInstance.data || [], columns, {
		isMultipleSelection: false,
	});

	useEffect(() => {
		router.reload({
			data: {
				createdAtEnd: formatDateTime(filterCreateDateEnd),
				createdAtStart: formatDateTime(filterCreateDateStart),
				perPage: serverPerPage,
			},
			preserveState: true,
			preserveScroll: true,
		});
	}, [filterCreateDateStart, filterCreateDateEnd, serverPerPage]);

	const goToPage = (page) => {
		router.reload({
			data: {
				perPage: maxItem,
				page,
			},
			preserveState: true,
			preserveScroll: true,
		});
	};

	const handleDateFilterChange = (dates) => {
		const [start, end] = dates;
		setFilterCreateDateStart(start);
		setFilterCreateDateEnd(end);
	};

	return (
		<div>
			<h1 className="text-lg font-semibold">
				Performed Chemical SDS Monitoring List
			</h1>
			<div className="flex">
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

			<Pagination
				links={serverSDSInstance?.links}
				currentPage={serverSDSInstance?.current_page}
				goToPage={goToPage}
				filteredTotal={serverSDSInstance?.total}
				overallTotal={totalEntries}
				start={serverSDSInstance?.from}
				end={serverSDSInstance?.to}
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
				<div className="mt-2 overflow-x-auto max-h-100">
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
										<td
											className={clsx("px-4 py-2 text-sm", {
												"text-green-600": r?.status === "updated",
											})}
										>
											{r?.chemical?.name || "N/A"}
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
				</div>
			</Modal>
		</div>
	);
}

export default ChemicalSDSMonitoringInstanceList;
