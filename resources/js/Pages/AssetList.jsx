import BulkErrors from "@/Components/BulkErrors";
import ChangeReviewModal from "@/Components/ChangeReviewModal";
import DeleteModal from "@/Components/DeleteModal";
import MultiSelectSearchableDropdown from "@/Components/MultiSelectSearchableDropdown";
import Pagination from "@/Components/Pagination";
import { createClickableCell } from "@/Components/tanStackTable/ClickableCell";
import JSONcell from "@/Components/tanStackTable/JSONCell";
import ReadOnlyColumns from "@/Components/tanStackTable/ReadOnlyColumn";
import TanstackTable from "@/Components/tanStackTable/TanstackTable";
import { useEditableTable } from "@/Hooks/useEditableTable";
import { useFetch } from "@/Hooks/useFetch";
import { useMutation } from "@/Hooks/useMutation";
import { router, usePage } from "@inertiajs/react";
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import toast from "react-hot-toast";
import { FaPlus, FaSave } from "react-icons/fa";
import { MdOutlineDelete } from "react-icons/md";
import SearchInput from "./SearchInput";

const locationModalID = "asset-schedule-modal";
const saveChangeIDModal = "save_change__checklist_item_modal_id";

const AssetList = () => {
	const {
		assets: serverAssets,
		search: serverSearch,
		perPage: serverPerPage,
		totalEntries,
	} = usePage().props;

	const [maxItem, setMaxItem] = useState(serverPerPage || 30);
	const [searchInput, setSearchInput] = useState(serverSearch || "");
	const [selectedEditItem, setSelectedEditItem] = useState([[]]);
	const [selectedCell, setSelectedCell] = useState(null);
	const [locationSearchInput, setLocationSearchInput] = useState("");

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
	}, [searchInput, maxItem]);

	const {
		mutate,
		isLoading: isMutateLoading,
		errorMessage: mutateErrorMessage,
		errorData: mutateErrorData,
		cancel: mutateCancel,
	} = useMutation();

	const {
		data: locations,
		isLoading: isLoadingLocation,
		errorMessage: errorMessageLocations,
		errorData: errorDataLocations,
		cancel: cancelLocations,
		fetch: fetchLocations,
	} = useFetch(route("api.locations.index"), {
		// auto: false,
	});
	console.log("🚀 ~ AssetList ~ locations:", locations);

	const closeModals = () => {
		document.getElementById(locationModalID).close();
	};

	const handleLocationSearchChange = useCallback((searchValue) => {
		fetchLocations({
			search: searchValue,
			page: 1,
			perPage: maxItem,
		});
		setLocationSearchInput(searchValue);
	}, []);

	const handleEditedItemClick = useCallback((row, value, column) => {
		const rootKey = column?.columnDef?.accessorKey?.split(".")[0];
		// React 18 batches these automatically, but be explicit
		React.startTransition(() => {
			setSelectedCell({ rootKey, row, value, column });
			setSelectedEditItem([value]);
		});
	}, []);

	// const handleEditedItemClick = useCallback((row, value, column) => {
	// 	const rootKey = column?.columnDef?.accessorKey?.split(".")[0];
	// 	setSelectedCell({ rootKey, row, value, column });
	// 	setSelectedEditItem([value]);
	// }, []);

	const columns = React.useMemo(
		() => [
			ReadOnlyColumns({
				accessorKey: "id",
				header: "ID",
				options: { size: 60, enableHiding: false },
			}),
			{
				accessorKey: "code",
				header: () => "Code",
				size: 250,
			},
			{
				accessorKey: "location.location_name",
				header: "Location",
				accessorFn: (row) => row.location?.location_name,
				size: 200,
				cell: createClickableCell({
					modalID: locationModalID,
					deletable: true,
					handleCellClick: handleEditedItemClick,
				}),
			},
			{
				accessorKey: "properties",
				header: () => "Properties",
				size: 500,
				cell: JSONcell,
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
		[handleEditedItemClick],
	);

	const {
		table,
		editedRows,
		handleAddNewRow,
		handleResetChanges,
		getChanges,
		changes,
	} = useEditableTable(serverAssets.data || [], columns, {
		isMultipleSelection: true,
	});

	const handleEditModalSelect = (selected) => {
		console.log("🚀 ~ TRIGGER handleEditModalSelecthandleEditModalSelect");
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

	const goToPageCheckItem = (page) => {
		fetchLocations({
			search: locationSearchInput,
			page: page,
			perPage: maxItem,
		});
	};

	const refresh = () => {
		router.reload();
	};

	const handleDelete = async () => {
		try {
			await mutate(route("api.assets.massGenocide"), {
				body: {
					ids: Object.keys(table.getState().rowSelection),
				},
				method: "DELETE",
			});

			refresh();
			deleteModalRef.current.close();
			toast.success("Assets deleted successfully!");
		} catch (error) {
			toast.error(error?.message);
			console.error(error);
		}
	};

	const deleteModalRef = useRef(null);

	const saveChanges = async () => {
		console.log("🚀 ~ saveChanges ~ editedRows:", editedRows);
		const payload = Object.entries(editedRows).map(([rowId, row]) => {
			const { location, ...rest } = row;
			return {
				...rest,
				id: rowId,
				location_id: location?.id ?? null,
			};
		});
		console.log("🚀 ~ saveChanges ~ payload:", payload);

		try {
			await mutate(route("api.assets.bulkUpdate"), {
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

	const handleAddNewChecklist = () => {
		router.visit(route("checklist-items.create"));
	};

	const handleSaveClick = () => {
		const computedChanges = getChanges();

		if (computedChanges.length === 0) {
			alert("No changes to save.");
			return;
		}

		document.getElementById(saveChangeIDModal).showModal();
	};

	const commonEditModalConfig = useMemo(
		() => ({
			defaultSelectedOptions: [selectedEditItem],
			controlledSelectedOptions: selectedEditItem,
			returnKey: "original",
			singleSelect: true,
			disableTooltip: true,
			disableClearSelection: true,
			useModal: true,
			disableSelectedContainer: true,
			paginated: true,
		}),
		[selectedEditItem],
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
						placeholder="search by code"
						initialSearchInput={searchInput}
						onSearchChange={setSearchInput}
					/>
				</div>

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
					message="Are you sure you want to delete these locations?"
					errorMessage={mutateErrorMessage}
					isLoading={isMutateLoading}
					onDelete={handleDelete}
					onClose={() => deleteModalRef.current?.close()}
				/>
				<MultiSelectSearchableDropdown
					modalId={locationModalID}
					options={
						locations?.locations?.data?.map((item) => ({
							value: String(item.location_name),
							label: null,
							original: item,
						})) || []
					}
					onChange={handleEditModalSelect}
					onSearchChange={handleLocationSearchChange}
					links={locations?.locations?.links || null}
					currentPage={locations?.locations?.current_page || 1}
					goToPage={goToPageCheckItem}
					itemName="Location List"
					isLoading={isLoadingLocation}
					prompt="Select Location"
					contentClassName={"h-100"}
					paginated={true}
					{...commonEditModalConfig}
				/>
			</div>
		</div>
	);
};

export default AssetList;
