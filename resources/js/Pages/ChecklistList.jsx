import BulkErrors from "@/Components/BulkErrors";
import ChangeReviewModal from "@/Components/ChangeReviewModal";
import DeleteModal from "@/Components/DeleteModal";
import MultiSelectSearchableDropdown from "@/Components/MultiSelectSearchableDropdown";
import Pagination from "@/Components/Pagination";
import CheckBoxColumn from "@/Components/tanStackTable/CheckBoxColumn";
import ReadOnlyColumns from "@/Components/tanStackTable/ReadOnlyColumn";
import TanstackTable from "@/Components/tanStackTable/TanstackTable";
import { useEditableTable } from "@/Hooks/useEditableTable";
import { useFetch } from "@/Hooks/useFetch";
import { useMutation } from "@/Hooks/useMutation";
import { useChecklistStore } from "@/Store/checklistStore";
import getObjectChanges from "@/Utils/getObjectChanges";
import { router, usePage } from "@inertiajs/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaCaretDown, FaPen, FaPlus, FaSave, FaTimes } from "react-icons/fa";
import { MdOutlineDelete } from "react-icons/md";
import SearchInput from "./SearchInput";

const saveChangeIDModal = "save_change__checklist_item_modal_id";

const ChecklistList = () => {
	const {
		checklist: serverChecklists,
		search: serverSearch,
		perPage: serverPerPage,
		totalEntries,
	} = usePage().props;

	const [maxItem, setMaxItem] = useState(serverPerPage || 100);
	console.log("🚀 ~ ChecklistList ~ serverChecklists:", serverChecklists);
	const [selectedChecklist, setSelectedChecklist] = React.useState(null);
	const [searchInput, setSearchInput] = useState(serverSearch || "");

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
				accessorKey: "checklist_id",
				header: "Checklist ID",
				meta: { hidden: true },
				// cell: (info) => null,
			},
			{
				accessorKey: "name",
				header: () => "Name",
				size: 350,
			},
			{
				accessorKey: "form_control_no",
				header: () => "Form Control No.",
				size: 340,
			},
			{
				accessorKey: "description",
				header: () => "Description",
				size: 340,
			},
			{
				accessorKey: "instruction",
				header: () => "Instruction",
				size: 340,
				cell: ({ row, getValue, column, table }) => {
					const value = getValue();
					const updateData = (newValue) => {
						table.options.meta?.updateData(row.index, column.id, newValue);
					};

					return (
						<textarea
							value={value || ""}
							onChange={(e) => updateData(e.target.value)}
							style={{ width: "100%", minHeight: "60px" }}
						/>
					);
				},
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

	const {
		table,
		editedRows,
		handleAddNewRow,
		handleResetChanges,
		getChanges,
		changes,
	} = useEditableTable(serverChecklists.data || [], columns);

	const refresh = () => {
		router.reload();
	};

	const saveChanges = async () => {
		try {
			await mutate(route("api.checklists.bulkUpdate"), {
				method: "PATCH",
				body: editedRows,
			});

			document.getElementById(saveChangeIDModal).close();
			toast.success("Changes updated successfully!");
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

	return (
		<div>
			<div className="w-full">
				<div className="flex gap-2 sticky right-0 mb-4">
					<button
						type="button"
						className="btn btn-primary"
						onClick={() => handleAddNewRow()}
					>
						<FaPlus className="mr-2" />
						Add New Checklist
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

					<SearchInput
						inputClassName="w-100"
						placeholder="search by checklist name or form control no."
						initialSearchInput={searchInput}
						onSearchChange={setSearchInput}
					/>
				</div>

				<div className="px-2 w-full">
					{<BulkErrors errors={mutateErrorData?.data || []} />}
				</div>

				<Pagination
					links={serverChecklists?.links}
					currentPage={serverChecklists?.current_page}
					goToPage={goToPage}
					filteredTotal={serverChecklists?.total}
					overallTotal={totalEntries}
					start={serverChecklists?.from}
					end={serverChecklists?.to}
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
		</div>
	);
};

export default ChecklistList;
