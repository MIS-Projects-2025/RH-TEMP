import BulkErrors from "@/Components/BulkErrors";
import ChangeReviewModal from "@/Components/ChangeReviewModal";
import DeleteModal from "@/Components/DeleteModal";
import MultiSelectSearchableDropdown from "@/Components/MultiSelectSearchableDropdown";
import Pagination from "@/Components/Pagination";
import CheckBoxColumn from "@/Components/tanStackTable/CheckBoxColumn";
import { createClickableCell } from "@/Components/tanStackTable/ClickableCell";
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
import { FaCaretDown, FaPlus, FaSave } from "react-icons/fa";
import { MdOutlineDelete } from "react-icons/md";
import SearchInput from "./SearchInput";

const assetModalID = "checklist-assets-assets-modal";
const checklistModalID = "checklist-assets-checklist-modal";
const saveChangeIDModal = "save_change__checklist_item_modal_id";

const ChecklistAssetList = () => {
	const { data: checklists, isLoading, fetchChecklists } = useChecklistStore();

	const {
		assets: serverAssets,
		search: serverSearch,
		perPage: serverPerPage,
		checklistId: serverChecklistId,
		totalEntries,
	} = usePage().props;

	console.log(
		"🚀 ~ ChecklistAssetList ~ serverChecklistId:",
		serverChecklistId,
	);
	console.log("🚀 ~ AssetList ~ serverAssets:", serverAssets);
	const [maxItem, setMaxItem] = useState(serverPerPage || 30);
	const selectedChecklist = serverChecklistId;
	const [searchInput, setSearchInput] = useState(serverSearch || "");
	const [selectedEditItem, setSelectedEditItem] = useState([[]]);
	const [selectedCell, setSelectedCell] = useState(null);
	const [checkItemSearchInput, setCheckItemSearchInput] = useState("");

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

	const {
		mutate,
		isLoading: isMutateLoading,
		errorMessage: mutateErrorMessage,
		errorData: mutateErrorData,
		cancel: mutateCancel,
	} = useMutation();

	const {
		data: assets,
		isLoading: isLoadingAsset,
		errorMessage: errorMessageAssets,
		errorData: errorDataAssets,
		cancel: cancelAssets,
		fetch: fetchAssets,
	} = useFetch(route("api.assets.index"), {
		// auto: false,
	});

	const handleEditedItemClick = React.useCallback((row, value, column) => {
		console.log("🚀 ~ handleEditedItemClick ~ value:", value);
		const rootKey = column?.columnDef?.accessorKey?.split(".")[0];
		setSelectedCell({ rootKey, row, value, column });
		setSelectedEditItem([value]);
	}, []);

	const handleEditAsset = (selected) => {
		if (selectedCell === null) return;
		updateData(selectedCell?.row?.index, "asset_id", selected[0].id);
		updateData(selectedCell?.row?.index, "asset", selected[0]);

		document.getElementById(assetModalID).close();
	};

	const assetsCell = React.useMemo(
		() =>
			createClickableCell({
				modalID: assetModalID,
				handleCellClick: handleEditedItemClick,
				formatDisplayValue: ({ row }) => row.original.asset?.code ?? "",
			}),
		[handleEditedItemClick],
	);

	const columns = React.useMemo(
		() => [
			ReadOnlyColumns({
				accessorKey: "id",
				header: "ID",
				options: { size: 60, enableHiding: false },
			}),
			{
				accessorKey: "asset_id",
				header: () => "Asset",
				size: 250,
				cell: assetsCell,
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
		updateData,
	} = useEditableTable(serverAssets.data || [], columns, {
		isMultipleSelection: true,
		createEmptyRow: () => ({
			checklist_id: selectedChecklist,
		}),
	});

	const handleEditModalSelect = (selected) => {
		console.log("🚀 ~ handleEditModalSelect ~ selected:", selected);

		if (selectedCell === null) return;
		updateData(selectedCell?.row?.index, selectedCell?.rootKey, selected[0]);

		closeModals();
	};

	const goToPageCheckItem = (page) => {
		fetchAssets({
			search: checkItemSearchInput,
			page: page,
			perPage: maxItem,
		});
	};

	const handleAssetSearchChange = useCallback((searchValue) => {
		fetchAssets({
			search: searchValue,
			page: 1,
			perPage: maxItem,
		});
		setCheckItemSearchInput(searchValue);
	}, []);

	const refresh = () => {
		router.reload();
	};

	const handleDelete = async () => {
		try {
			await mutate(route("api.checklist-assets.massGenocide"), {
				body: {
					ids: Object.keys(table.getState().rowSelection),
				},
				method: "DELETE",
			});

			refresh();
			deleteModalRef.current.close();
			toast.success("Checklist assets deleted successfully!");
		} catch (error) {
			toast.error(error?.message);
			console.error(error);
		}
	};

	const deleteModalRef = useRef(null);

	const saveChanges = async () => {
		try {
			await mutate(route("api.checklist-assets.bulkUpdate"), {
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

	const handleAddNewChecklist = () => {
		router.visit(route("checklist-items.create"));
	};

	const handleSaveClick = () => {
		const computedChanges = getChanges();
		if (computedChanges.length === 0) {
			alert("No changes to save.");
			return;
		}
		console.log("🚀 ~ handleSaveClick ~ changes:", computedChanges);
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

	const reload = (checklistId) => {
		console.log("🚀 ~ reload ~ checklistId:", checklistId);

		router.reload({
			data: {
				search: searchInput,
				perPage: maxItem,
				page: serverAssets?.current_page,
				checklistId: checklistId,
			},
			preserveState: true,
			preserveScroll: true,
		});
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
						Add New Asset
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
					<button
						type="button"
						className="btn btn-error btn-ghost btn-square"
						disabled={Object.keys(table.getState().rowSelection).length === 0}
						onClick={() => deleteModalRef.current.open()}
					>
						<MdOutlineDelete className="w-full h-full" />
					</button>

					<SearchInput
						initialSearchInput={searchInput}
						onSearchChange={setSearchInput}
					/>
				</div>

				<MultiSelectSearchableDropdown
					modalId={checklistModalID}
					options={
						checklists?.checklistArray?.map((checklist) => ({
							value: checklist.name,
							label: checklist.form_control_no,
							original: checklist,
						})) || []
					}
					onChange={(value) => {
						reload(value[0]?.id);
					}}
					returnKey="original"
					defaultSelectedOptions={
						selectedChecklist && !isLoading
							? [checklists?.checklistMap[selectedChecklist]?.name]
							: []
					}
					controlledSelectedOptions={
						selectedChecklist && !isLoading
							? [checklists?.checklistMap[selectedChecklist]?.name]
							: []
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
					isLoading={isLoading}
					itemName="Checklist List"
					prompt="Select Checklist"
					contentClassName="h-50"
					buttonSelectorClassName="w-full min-h-8 h-auto btn-soft btn-primary text-left"
					singleSelect
				/>

				<TanstackTable table={table} />

				<div className="px-2 w-full">
					{<BulkErrors errors={mutateErrorData?.data || []} />}
				</div>

				<Pagination
					links={serverAssets?.links}
					currentPage={serverAssets?.current_page}
					goToPage={goToPage}
					filteredTotal={serverAssets?.total}
					overallTotal={totalEntries}
					start={serverAssets?.from}
					end={serverAssets?.to}
				/>

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
					message="Are you sure you want to delete these locations?"
					errorMessage={mutateErrorMessage}
					isLoading={isMutateLoading}
					onDelete={handleDelete}
					onClose={() => deleteModalRef.current?.close()}
				/>
				<MultiSelectSearchableDropdown
					modalId={assetModalID}
					options={
						assets?.assets?.data?.map((item) => ({
							value: String(item.code),
							label: item?.location?.location_name,
							original: item,
						})) || []
					}
					onChange={handleEditAsset}
					onSearchChange={handleAssetSearchChange}
					links={assets?.assets?.links || null}
					currentPage={assets?.assets?.current_page || 1}
					goToPage={goToPageCheckItem}
					itemName="Asset List"
					isLoading={isLoadingAsset}
					prompt="Select Asset"
					contentClassName={"h-100"}
					paginated={true}
					{...commonEditModalConfig}
				/>
			</div>
		</div>
	);
};

export default ChecklistAssetList;
