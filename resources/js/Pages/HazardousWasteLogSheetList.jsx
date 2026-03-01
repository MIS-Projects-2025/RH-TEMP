import BulkErrors from "@/Components/BulkErrors";
import ChangeReviewModal from "@/Components/ChangeReviewModal";
import MaxItemDropdown from "@/Components/MaxItemDropdown";
import Modal from "@/Components/Modal";
import Pagination from "@/Components/Pagination";
import ReadOnlyColumns from "@/Components/tanStackTable/ReadOnlyColumn";
import TanstackTable from "@/Components/tanStackTable/TanstackTable";
import { useEditableTable } from "@/Hooks/useEditableTable";
import { useMutation } from "@/Hooks/useMutation";
import { useToast } from "@/Hooks/useToast";
import {
	DATE_ONLY_FORMAT,
	formatTimestamp,
} from "@/Utils/formatISOTimestampToDate";
import { Link, router, usePage } from "@inertiajs/react";
import React, { useEffect, useRef, useState } from "react";
import { FaEdit, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import SearchInput from "./SearchInput";

const saveChangeIDModal = "save_change_hazardous_waste_log_sheet_modal_id";

const HazardousWasteLogSheet = () => {
	const toast = useToast();

	const {
		hazardousWaste: serverHazardousWaste,
		search: serverSearch,
		perPage: serverPerPage,
		totalEntries,
	} = usePage().props;

	console.group("🚀 ~ UtilityTrashList ~ serverUtilityTrash");
	console.log(
		"🚀 ~ UtilityTrashList ~ serverUtilityTrash:",
		serverHazardousWaste,
	);
	console.log("🚀 ~ UtilityTrashList ~ serverSearch:", serverSearch);
	console.log("🚀 ~ UtilityTrashList ~ serverPerPage:", serverPerPage);
	console.log("🚀 ~ UtilityTrashList ~ totalEntries:", totalEntries);
	console.groupEnd();

	const deleteModalRef = useRef(null);
	const [searchInput, setSearchInput] = useState(serverSearch || "");

	const [maxItem, setMaxItem] = useState(serverPerPage || 100);
	const [selectedEntry, setSelectedEntry] = useState(null);
	const {
		mutate,
		isLoading: isMutateLoading,
		errorMessage: mutateErrorMessage,
		errorData: mutateErrorData,
		cancel: mutateCancel,
	} = useMutation();

	useEffect(() => {
		const timer = setTimeout(() => {
			router.reload({
				data: {
					search: searchInput,
					perPage: maxItem,
					page: 1,
				},
				preserveState: true,
				preserveScroll: true,
			});
		}, 700);

		return () => clearTimeout(timer);
	}, [searchInput]);

	const columns = React.useMemo(
		() => [
			ReadOnlyColumns({
				accessorKey: "id",
				header: "ID",
				options: { size: 60, enableHiding: false },
			}),
			{
				accessorKey: "reference_no",
				header: "Reference No.",
				options: { size: 60, enableHiding: false },
			},
			{
				accessorKey: "requestor",
				header: () => "Requestor (empid)",
				size: 250,
			},
			{
				header: "Audit Info",
				columns: [
					ReadOnlyColumns({
						accessorKey: "modified_by",
						header: "Modified By",
					}),
					ReadOnlyColumns({
						accessorKey: "modified_at",
						header: "Modified At",
						options: { size: 160 },
					}),
				],
			},
		],
		[],
	);

	const {
		table,
		editedRows,
		handleAddNewRow,
		handleResetChanges,
		getChanges,
		changes,
	} = useEditableTable(serverHazardousWaste.data || [], columns, {
		isMultipleSelection: false,
	});

	const goToPage = (page) => {
		router.reload({
			data: {
				search: searchInput,
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
				perPage: maxItem,
				page: 1,
			},
			preserveState: true,
			preserveScroll: true,
		});
		setMaxItem(maxItem);
	};

	const saveChanges = async () => {
		try {
			await mutate(route("api.hazardous-log-sheet.bulkUpdate"), {
				method: "PATCH",
				body: editedRows,
			});
			document.getElementById(saveChangeIDModal).close();

			toast.success("Changes updated successfully!");
			console.log("zzzzzzzz");

			refresh();
		} catch (error) {
			toast.error(error.message);
			console.error(error);
		}
	};

	const handleSaveClick = () => {
		const computedChanges = getChanges();

		if (computedChanges.length === 0) {
			alert("No changes to save.");
			return;
		}

		document.getElementById(saveChangeIDModal).showModal();
	};

	const refresh = () => {
		router.reload({
			data: {
				search: searchInput,
				perPage: maxItem,
				page: 1,
			},
			preserveState: true,
			preserveScroll: true,
		});
	};

	// const handleDelete = async () => {
	// 	try {
	// 		await mutate(
	// 			route("api.hazardous-log-sheet.delete", {
	// 				reference_no: selectedEntry.reference_no,
	// 			}),
	// 			{
	// 				method: "DELETE",
	// 				body: {
	// 					reference_no: selectedEntry.reference_no,
	// 				},
	// 			},
	// 		);

	// 		refresh();

	// 		deleteModalRef.current.close();
	// 		toast.success("Entry verified successfully!");
	// 	} catch (error) {
	// 		toast.error(mutateErrorMessage);
	// 		console.error(error);
	// 	}
	// };

	return (
		<>
			<div className="w-full px-4">
				<div className="flex flex-col">
					<h1 className="text-base font-bold">
						Hazardous Waste Material Turn-Over Logsheet
					</h1>
					{/* <Link
						href={route("hazardous-log-sheet.create")}
						className="btn btn-primary"
					>
						<FaPlus /> Add New
					</Link> */}
				</div>

				<div className="flex items-center justify-between py-4">
					<div className="dropdown dropdown-bottom">
						<div className="flex gap-2">
							<button
								type="button"
								className="btn btn-primary"
								onClick={() => handleAddNewRow()}
							>
								<FaPlus className="mr-2" />
								Add New Entry
							</button>
							<button
								type="button"
								className="btn btn-primary"
								onClick={handleSaveClick}
								disabled={Object.keys(editedRows).length === 0}
							>
								<FaSave className="mr-2" />
								Save Changes
							</button>
							<button
								type="button"
								className="btn btn-secondary"
								onClick={handleResetChanges}
							>
								Reset
							</button>
						</div>
						<MaxItemDropdown
							buttonClassname="mt-1"
							maxItem={maxItem}
							changeMaxItemPerPage={changeMaxItemPerPage}
						/>
					</div>

					<SearchInput
						placeholder="search by emp id or reference no."
						initialSearchInput={searchInput}
						onSearchChange={setSearchInput}
					/>
				</div>

				<div className="px-2 w-full">
					{<BulkErrors errors={mutateErrorData?.data || []} />}
				</div>

				<Pagination
					links={serverHazardousWaste?.links}
					currentPage={serverHazardousWaste?.current_page}
					goToPage={goToPage}
					filteredTotal={serverHazardousWaste?.total}
					overallTotal={totalEntries}
					start={serverHazardousWaste?.from}
					end={serverHazardousWaste?.to}
				/>

				<TanstackTable table={table} />

				<ChangeReviewModal
					modalID={saveChangeIDModal}
					changes={changes}
					onClose={() => document.getElementById(saveChangeIDModal).close()}
					onSave={saveChanges}
					isLoading={isMutateLoading}
				/>
			</div>
			{/* <Modal
				ref={deleteModalRef}
				id="deleteHazardousWasteEntryModal"
				title={`Delete ${
					selectedEntry?.performed_by?.EMPNAME
				} on ${formatTimestamp(selectedEntry?.date, DATE_ONLY_FORMAT)}`}
				onClose={() => deleteModalRef.current?.close()}
				className="max-w-lg"
			>
				<p className="px-2 pt-4">
					This action cannot be undone. Delete this entry?
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
							await handleDelete();
						}}
						disabled={isMutateLoading}
					>
						{isMutateLoading ? (
							<>
								<span className="loading loading-spinner"></span> Delete
							</>
						) : (
							"Confirm Delete"
						)}
					</button>

					<button
						className="btn btn-outline"
						onClick={() => deleteModalRef.current?.close()}
					>
						Cancel
					</button>
				</div>
			</Modal> */}
		</>
	);
};

export default HazardousWasteLogSheet;
