import SmartCalendarContainer from "@/Components/DatePicker";
import MaxItemDropdown from "@/Components/MaxItemDropdown";
import Modal from "@/Components/Modal";
import Pagination from "@/Components/Pagination";
import TimeLine from "@/Components/TimeLine";
import TogglerButtons from "@/Components/TogglerButtons";
import { TOGGLE_UTILITY_TRASH_STATUS_BUTTONS } from "@/Constants/togglerButtons";
import { useMutation } from "@/Hooks/useMutation";
import { useToast } from "@/Hooks/useToast";
import formatDateTime from "@/Utils/formatDateTime";
import {
	DATE_ONLY_FORMAT,
	formatTimestamp,
	TIME_ONLY_FORMAT,
} from "@/Utils/formatISOTimestampToDate";
import { router, usePage } from "@inertiajs/react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import SearchInput from "../SearchInput";
import UpdateChecklist from "./UpdateChecklist";

const UtilityTrashList = () => {
	const toast = useToast();

	const {
		utilityTrash: serverUtilityTrash,
		isNotVerified: serverIsNotVerified,
		isVerified: serverIsVerified,
		startDate: serverStartDate,
		endDate: serverEndDate,
		search: serverSearch,
		perPage: serverPerPage,
		totalEntries,
	} = usePage().props;

	console.group("🚀 ~ UtilityTrashList ~ serverUtilityTrash");
	console.log(
		"🚀 ~ UtilityTrashList ~ serverUtilityTrash:",
		serverUtilityTrash,
	);
	console.log("🚀 ~ UtilityTrashList ~ serverSearch:", serverSearch);
	console.log("🚀 ~ UtilityTrashList ~ serverPerPage:", serverPerPage);
	console.log("🚀 ~ UtilityTrashList ~ totalEntries:", totalEntries);
	console.groupEnd();

	const verifyModalRef = useRef(null);
	const performChecklistModalRef = useRef(null);
	const [searchInput, setSearchInput] = useState(serverSearch || "");
	const [performDate, setPerformDate] = useState(null);
	const [statusFilters, setStatusFilters] = useState({
		not_verified: serverIsNotVerified,
		verified: serverIsVerified,
	});
	const [filterDateStart, setFilterDateStart] = useState(serverStartDate);
	const [filterDateEnd, setFilterDateEnd] = useState(serverEndDate);
	console.log("🚀 ~ UtilityTrashList ~ performDate:", performDate);

	const handleToggleStatus = (name, key) => {
		setStatusFilters((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const toggleAllStatus = () => {
		setStatusFilters((prev) => ({
			...prev,
			not_verified: true,
			verified: true,
		}));
	};

	const [maxItem, setMaxItem] = useState(serverPerPage || 100);
	const [selectedEntry, setSelectedEntry] = useState(null);

	const {
		mutate,
		isLoading: isMutateLoading,
		errorMessage: mutateErrorMessage,
		cancel: mutateCancel,
	} = useMutation();

	useEffect(() => {
		const timer = setTimeout(() => {
			router.reload({
				data: {
					search: searchInput,
					isNotVerified: statusFilters.not_verified,
					isVerified: statusFilters.verified,
					startDate: formatDateTime(filterDateStart),
					endDate: formatDateTime(filterDateEnd),
					perPage: maxItem,
					page: 1,
				},
				preserveState: true,
				preserveScroll: true,
			});
		}, 700);

		return () => clearTimeout(timer);
	}, [searchInput, statusFilters, maxItem, filterDateStart, filterDateEnd]);

	const goToPage = (page) => {
		router.reload({
			data: {
				search: searchInput,
				isNotVerified: statusFilters.not_verified,
				isVerified: statusFilters.verified,
				perPage: maxItem,
				page,
			},
			preserveState: true,
			preserveScroll: true,
		});
	};

	const changeMaxItemPerPage = (maxItem) => {
		router.reload({
			data: {
				search: searchInput,
				isNotVerified: statusFilters.not_verified,
				isVerified: statusFilters.verified,
				perPage: maxItem,
				page: 1,
			},
			preserveState: true,
			preserveScroll: true,
		});
		setMaxItem(maxItem);
	};

	const refresh = () => {
		router.reload({
			data: {
				search: searchInput,
				isNotVerified: statusFilters.not_verified,
				isVerified: statusFilters.verified,
				perPage: maxItem,
				page: 1,
			},
			preserveState: true,
			preserveScroll: true,
		});
	};

	const handlePerformChecklist = async () => {
		try {
			await mutate(route("api.utility-trash.perform"), {
				method: "POST",
				body: {
					date: performDate,
				},
			});

			refresh();
			performChecklistModalRef.current.close();
			toast.success("Checklist performed successfully!");
		} catch (error) {
			toast.error(mutateErrorMessage);
			console.error(error);
		}
	};

	const handleVerify = async () => {
		try {
			await mutate(
				route("api.utility-trash.verify", {
					id: selectedEntry.id,
				}),
				{
					method: "PATCH",
					body: {
						id: selectedEntry.id,
					},
				},
			);

			refresh();

			verifyModalRef.current.close();
			toast.success("Entry verified successfully!");
		} catch (error) {
			toast.error(mutateErrorMessage);
			console.error(error);
		}
	};

	const handleDateFilterChange = (dates) => {
		const [start, end] = dates;
		setFilterDateStart(start);
		setFilterDateEnd(end);
	};

	return (
		<>
			<div className="w-full px-4">
				<div className="flex items-center justify-between text-center">
					<h1 className="text-base font-bold">Utility Trash</h1>
				</div>

				<div className="flex items-center justify-between py-4">
					<div>
						<MaxItemDropdown
							maxItem={maxItem}
							changeMaxItemPerPage={changeMaxItemPerPage}
						/>

						<TogglerButtons
							id="toggle-performed-verified-all"
							toggleButtons={TOGGLE_UTILITY_TRASH_STATUS_BUTTONS}
							visibleBars={statusFilters}
							toggleBar={handleToggleStatus}
							toggleAll={toggleAllStatus}
						/>

						<div>Date performed filter</div>
						<SmartCalendarContainer
							selectedDate={filterDateStart}
							onChange={handleDateFilterChange}
							startDate={filterDateStart}
							endDate={filterDateEnd}
							props={{
								portalId: "root-portal",
								className: "w-80 input z-50",
								swapRange: true,
								selectsRange: true,
								isClearable: true,
								showTimeSelect: true,
								timeIntervals: 15,
								dateFormat: "yyyy-MM-dd HH:mm",
							}}
						/>
					</div>

					<label className="input">
						<svg
							className="h-[1em] opacity-50"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
						>
							<g
								strokeLinejoin="round"
								strokeLinecap="round"
								strokeWidth="2.5"
								fill="none"
								stroke="currentColor"
							>
								<circle cx="11" cy="11" r="8"></circle>
								<path d="m21 21-4.3-4.3"></path>
							</g>
						</svg>
						<SearchInput
							placeholder="Search"
							initialSearchInput={searchInput}
							onSearchChange={setSearchInput}
						/>
					</label>
				</div>

				<div className="w-full gap-2 justify-center h-20 flex items-center border border-primary bg-primary/10">
					<button
						type="button"
						className="btn btn-primary"
						onClick={() => {
							performChecklistModalRef.current.open();
							setPerformDate(new Date());
						}}
					>
						<span>Update checklist now</span>
					</button>
					<div className="w-40">
						<UpdateChecklist role={"user"} />
					</div>
				</div>

				<div className="w-full flex justify-center bg-base-300 px-2 border border-base-content-dim">
					<TimeLine
						ranges={[
							{
								startHour: 9,
								endHour: 9.5,
								color: "var(--color-primary)",
							},
							{
								startHour: 12.5,
								endHour: 13,
								color: "var(--color-primary)",
							},
							{
								startHour: 17,
								endHour: 17.5,
								color: "var(--color-primary)",
							},
							{
								startHour: 21,
								endHour: 21.5,
								color: "var(--color-primary)",
							},
							{
								startHour: 0.5,
								endHour: 1,
								color: "var(--color-primary)",
							},
							{
								startHour: 5,
								endHour: 5.5,
								color: "var(--color-primary)",
							},
						]}
					/>
				</div>

				<Pagination
					links={serverUtilityTrash?.links}
					currentPage={serverUtilityTrash?.current_page}
					goToPage={goToPage}
					filteredTotal={serverUtilityTrash?.total}
					overallTotal={totalEntries}
					start={serverUtilityTrash?.from}
					end={serverUtilityTrash?.to}
				/>

				<table className="table w-full table-auto table-xs">
					<thead>
						<tr>
							<th>ID</th>
							<th>Date</th>
							<th>Time</th>
							<th>Performed By</th>
							<th>Verified By</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{serverUtilityTrash.data.map((entry) => (
							<tr key={entry.id}>
								<td>{entry.id}</td>
								<td>{formatTimestamp(entry?.date, DATE_ONLY_FORMAT)}</td>
								<td>{formatTimestamp(entry?.date, TIME_ONLY_FORMAT)}</td>
								<td>
									{entry?.performed_by?.EMPNAME || "-"}

									<span className="pl-2 opacity-75">
										({entry?.performed_by?.EMPLOYID})
									</span>
								</td>
								<td>{entry?.verified_by?.EMPNAME || "-"}</td>
								{/* <Link
                                        href={route("partname.edit", {
                                            id: part.ppc_partnamedb_id,
                                            search: searchInput,
                                            perPage: maxItem,
                                            page: currentPage,
                                        })}
                                        className="btn btn-ghost btn-sm btn-primary"
                                    >
                                        <FaEdit />
                                    </Link>
                                    <a
                                        href="#"
                                        className="btn btn-ghost btn-sm text-error"
                                        onClick={() => {
                                            setSelectedPart(part);
                                            deleteModalRef.current.open();
                                        }}
                                    >
                                        <FaTrash />
                                    </a> */}
								<td className="flex flex-col lg:flex-row">
									{entry?.verified_by === null ? (
										<a
											href="#"
											className={clsx(
												"btn btn-secondary btn-sm",
												entry?.verified_by ? "hidden" : "",
											)}
											onClick={() => {
												setSelectedEntry(entry);
												console.log("🚀 ~ UtilityTrashList ~ entry:", entry);

												verifyModalRef.current.open();
											}}
										>
											Verify
										</a>
									) : (
										<span className="italic opacity-50">- Verified -</span>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<Modal
				ref={verifyModalRef}
				id="verifyUtilityTrashEntryModal"
				title={`Verify ${
					selectedEntry?.performed_by?.EMPNAME
				} on ${formatTimestamp(selectedEntry?.date, DATE_ONLY_FORMAT)}`}
				onClose={() => verifyModalRef.current?.close()}
				className="max-w-lg"
			>
				<p className="px-2 pt-4">
					This action cannot be undone. Verify this entry?
				</p>

				<p
					className="p-2 border rounded-lg bg-error/10 text-error"
					style={{
						visibility: mutateErrorMessage ? "visible" : "hidden",
					}}
				>
					{mutateErrorMessage || "placeholder"}
				</p>

				<div className="flex justify-end gap-2 pt-4">
					<button
						type="button"
						className="btn btn-error"
						onClick={async () => {
							await handleVerify();
						}}
						disabled={isMutateLoading}
					>
						{isMutateLoading ? (
							<>
								<span className="loading loading-spinner"></span> Verifying
							</>
						) : (
							"Confirm Verify"
						)}
					</button>

					<button
						className="btn btn-outline"
						onClick={() => verifyModalRef.current?.close()}
					>
						Cancel
					</button>
				</div>
			</Modal>

			<Modal
				ref={performChecklistModalRef}
				id="performUtilityTrashEntryModal"
				title={`Perform Utility Trash Checklist`}
				onClose={() => performChecklistModalRef.current?.close()}
				className="max-w-lg"
			>
				<p className="px-2 pt-4">
					Make sure this is the correct entry before proceeding. Or you can have
					a custom perform date by inputting the date below.
				</p>

				<input
					type="datetime-local"
					value={
						performDate
							? new Date(performDate).toLocaleDateString("en-CA") +
								"T" +
								new Date(performDate).toLocaleTimeString("it-IT", {
									hour: "2-digit",
									minute: "2-digit",
								})
							: ""
					}
					className="input w-full"
					onChange={(e) => setPerformDate(new Date(e.target.value))}
				/>

				<button
					type="button"
					className="btn mt-1 btn-secondary btn-outline w-full"
					onClick={() => setPerformDate(new Date())}
				>
					use current time
				</button>

				<p
					className="p-2 border rounded-lg bg-error/10 text-error"
					style={{
						visibility: mutateErrorMessage ? "visible" : "hidden",
					}}
				>
					{mutateErrorMessage || "placeholder"}
				</p>

				<div className="flex justify-end gap-2 pt-4">
					<button
						type="button"
						className="btn btn-error"
						onClick={async () => {
							await handlePerformChecklist();
						}}
						disabled={isMutateLoading}
					>
						{isMutateLoading ? (
							<>
								<span className="loading loading-spinner"></span> Adding entry
							</>
						) : (
							"Confirm Checklist"
						)}
					</button>

					<button
						type="button"
						className="btn btn-outline"
						onClick={() => performChecklistModalRef.current?.close()}
					>
						Cancel
					</button>
				</div>
			</Modal>
		</>
	);
};

export default UtilityTrashList;
