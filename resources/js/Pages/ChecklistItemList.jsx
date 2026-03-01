import BulkErrors from "@/Components/BulkErrors";
import ChangeReviewModal from "@/Components/ChangeReviewModal";
import DeleteModal from "@/Components/DeleteModal";
import MultiSelectSearchableDropdown from "@/Components/MultiSelectSearchableDropdown";
import ArrayCell from "@/Components/tanStackTable/ArrayCell";
import { createClickableCell } from "@/Components/tanStackTable/ClickableCell";
import DropdownCell from "@/Components/tanStackTable/DropDownCell";
import ReadOnlyColumns from "@/Components/tanStackTable/ReadOnlyColumn";
import TanstackTable from "@/Components/tanStackTable/TanstackTable";
import { useEditableTable } from "@/Hooks/useEditableTable";
import { useFetch } from "@/Hooks/useFetch";
import { useMutation } from "@/Hooks/useMutation";
import { router, usePage } from "@inertiajs/react";
import React, { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaCaretDown, FaPlus, FaSave } from "react-icons/fa";

const perPageF3RawPackage = 30;
const checkItemListModalID = "checklist-item-modal";
const scheduleModalID = "schedule-modal";
const saveChangeIDModal = "save_change__checklist_item_modal_id";

const ChecklistItemList = () => {
	const { checklists, selectedChecklist } = usePage().props;
	const checklistItems = selectedChecklist?.checklist_items;
	console.log("🚀 ~ ChecklistItemList ~ selectedChecklist:", selectedChecklist);
	console.log("🚀 ~ ChecklistItemList ~ checklists:", checklists);
	console.log("🚀 ~ ChecklistItemList ~ checklistItems:", checklistItems);

	const [selectedEditItem, setSelectedEditItem] = useState([[]]);
	const [selectedCell, setSelectedCell] = useState(null);
	const [checkItemSearchInput, setCheckItemSearchInput] = useState("");

	const {
		mutate,
		isLoading: isMutateLoading,
		errorMessage: mutateErrorMessage,
		errorData: mutateErrorData,
		cancel: mutateCancel,
	} = useMutation();

	const {
		data: checkItems,
		isLoading: isLoadingCheckItems,
		errorMessage: errorMessageCheckItems,
		errorData: errorDataCheckItems,
		cancel: cancelCheckItems,
		fetch: fetchCheckItems,
	} = useFetch(route("api.check-items.index"), {
		auto: false,
	});

	const closeModals = () => {
		document.getElementById(checkItemListModalID).close();
		document.getElementById(scheduleModalID).close();
	};

	const handleEditModalSelect = (selected) => {
		console.log("🚀 ~ handleEditModalSelect ~ selectedCell:", selectedCell);
		if (selectedCell === null) return;

		console.log(
			"🚀 ~ handleEditModalSelect ~ tedCell?.row?.index,:",
			selectedCell?.row?.index,
		);
		console.log(
			"🚀 ~ handleEditModalSelect ~ selectedCell?.rootKey:",
			selectedCell?.rootKey,
		);
		console.log("🚀 ~ handleEditModalSelect ~ selected[0]:", selected[0]);
		table.options.meta?.updateData(
			selectedCell?.row?.index,
			selectedCell?.rootKey,
			selected[0],
		);

		closeModals();
	};

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
			},
			{
				accessorKey: "item.name",
				header: () => "Action/Check Item",
				accessorFn: (row) => row.item?.name ?? null,
				size: 340,
				cell: createClickableCell({
					modalID: checkItemListModalID,
					handleCellClick: handleEditedItemClick,
				}),
			},
			{
				accessorKey: "criteria",
				header: () => "Value/Criteria",
				size: 340,
			},
			{
				accessorKey: "input_type",
				header: () => "Input Type",
				size: 140,
				cell: (props) => (
					<DropdownCell {...props} options={["text", "number", "select"]} />
				),
			},
			{
				accessorKey: "allowed_values",
				header: "Allowed Values",
				size: 140,
				cell: (props) => {
					const inputType = props.row.original.input_type;

					if (inputType !== "select") {
						return (
							<span className="opacity-30 text-xs px-2 cursor-not-allowed">
								—
							</span>
						);
					}

					return <ArrayCell {...props} />;
				},
			},
			{
				accessorKey: "schedule.schedule_name",
				header: "Schedule",
				accessorFn: (row) => row.schedule?.schedule_name,
				size: 340,
				cell: createClickableCell({
					modalID: scheduleModalID,
					deletable: true,
					handleCellClick: handleEditedItemClick,
				}),
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
	} = useEditableTable(checklistItems || [], columns, {
		isMultipleSelection: false,
		createEmptyRow: () => ({
			checklist_id: selectedChecklist?.id,
			input_type: "text",
			allowed_values: [],
		}),
	});

	const {
		data: schedules,
		isLoading: isLoadingSchedules,
		errorMessage: errorMessageSchedules,
		errorData: errorDataSchedules,
		cancel: cancelSchedules,
		fetch: fetchSchedules,
	} = useFetch(route("api.schedules.index"), {
		// auto: false,
	});

	const goToPageCheckItem = (page) => {
		fetchCheckItems({
			search: checkItemSearchInput,
			page: page,
			perPage: perPageF3RawPackage,
		});
	};

	const handleCheckItemsSearchChange = useCallback((searchValue) => {
		fetchCheckItems({
			search: searchValue,
			page: 1,
			perPage: perPageF3RawPackage,
		});
		setCheckItemSearchInput(searchValue);
	}, []);

	const refresh = () => {
		router.reload();
	};

	const handleDelete = async () => {
		try {
			await mutate(route("api.checklist-items.massGenocide"), {
				body: {
					ids: Object.keys(table.getState().rowSelection),
				},
				method: "DELETE",
			});

			toast.success("Checklist items deleted successfully!");
			refresh();
			deleteModalRef.current.close();
		} catch (error) {
			toast.error(error?.message);
			console.error(error);
		}
	};

	function handleEditedItemClick(row, value, column) {
		const rootKey = column?.columnDef?.accessorKey?.split(".")[0];
		setSelectedCell({ rootKey, row, value, column });
		setSelectedEditItem([value]);
	}

	console.log("🚀 ~ ChecklistList ~ selectedChecklist:", selectedChecklist);
	const deleteModalRef = useRef(null);

	const saveChanges = async () => {
		console.log("🚀 ~ saveChanges ~ editedRows:", editedRows);
		const payload = Object.entries(editedRows).map(([rowId, row]) => {
			const { schedule, item, ...rest } = row;
			return {
				...rest,
				id: rowId,
				item_id: item?.id ?? null,
				schedule_id: schedule?.id ?? null,
				checklist_id: selectedChecklist?.id,
			};
		});

		try {
			await mutate(route("api.checklist-items.bulkUpdate"), {
				method: "PATCH",
				body: payload,
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
		const changes = getChanges();
		if (changes.length === 0) {
			alert("No changes to save.");
			return;
		}
		document.getElementById(saveChangeIDModal).showModal();
	};

	const commonEditModalConfig = {
		defaultSelectedOptions: [selectedEditItem],
		controlledSelectedOptions: selectedEditItem,
		returnKey: "original",
		singleSelect: true,
		disableTooltip: true,
		disableClearSelection: true,
		useModal: true,
		disableSelectedContainer: true,
		paginated: true,
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
						Add New Checklist Item
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

				<div className="flex gap-4">
					<MultiSelectSearchableDropdown
						options={
							checklists?.map((checklist) => ({
								value: checklist.name,
								label: checklist.form_control_no,
								original: checklist,
							})) || []
						}
						onChange={(value) => {
							console.log("🚀 ~ ChecklistList ~ value:", value);
							router.reload({
								data: {
									checklist_id: value[0]?.id,
								},
								preserveState: true,
								preserveScroll: true,
							});
						}}
						returnKey="original"
						defaultSelectedOptions={
							selectedChecklist?.name ? [selectedChecklist.name] : []
						}
						controlledSelectedOptions={
							selectedChecklist?.name ? [selectedChecklist.name] : []
						}
						customButtonLabel={({ selectedOptions }) => {
							return (
								<div>
									{selectedOptions.length > 0 ? (
										<div className="flex items-center justify-between w-full">
											<h1 className="w-full text-lg">
												Checklist of {selectedOptions[0]}
											</h1>
											<FaCaretDown className="inline-block ml-2" />
										</div>
									) : (
										"Select Checklist"
									)}
								</div>
							);
						}}
						disableSelectedContainer
						disableClearSelection
						disableTooltip
						itemName="Checklist List"
						prompt="Select Checklist"
						contentClassName="h-50"
						buttonSelectorClassName="w-full h-auto btn-soft btn-primary text-left"
						singleSelect
					/>
				</div>

				<div className="px-2 w-full">
					{<BulkErrors errors={mutateErrorData?.data || []} />}
				</div>

				<TanstackTable table={table} />

				<ChangeReviewModal
					modalID={saveChangeIDModal}
					changes={changes}
					onClose={() => document.getElementById(saveChangeIDModal).close()}
					onSave={saveChanges}
					isLoading={isMutateLoading}
				/>
				<DeleteModal
					ref={deleteModalRef}
					id="locationDeleteModal"
					message="Are you sure you want to delete these checklist items?"
					errorMessage={mutateErrorMessage}
					isLoading={isMutateLoading}
					onDelete={handleDelete}
					onClose={() => deleteModalRef.current?.close()}
				/>
				<MultiSelectSearchableDropdown
					modalId={checkItemListModalID}
					options={
						checkItems?.checkItems.data?.map((item) => ({
							value: String(item.name),
							label: null,
							original: item,
						})) || []
					}
					onChange={handleEditModalSelect}
					onSearchChange={handleCheckItemsSearchChange}
					links={checkItems?.checkItems?.links || null}
					currentPage={checkItems?.checkItems?.current_page || 1}
					goToPage={goToPageCheckItem}
					itemName="Check Item List"
					isLoading={isLoadingCheckItems}
					prompt="Select Check Item"
					contentClassName={"h-100"}
					paginated={true}
					{...commonEditModalConfig}
				/>

				<MultiSelectSearchableDropdown
					modalId={scheduleModalID}
					options={
						schedules?.schedules?.map((item) => ({
							value: String(item.schedule_name),
							label: null,
							original: item,
						})) || []
					}
					onChange={handleEditModalSelect}
					itemName="Schedule List"
					isLoading={isLoadingSchedules}
					prompt="Select Schedule"
					contentClassName={"h-150"}
					disableSearch={false}
					{...commonEditModalConfig}
				/>
			</div>
		</div>
	);
};

export default ChecklistItemList;
