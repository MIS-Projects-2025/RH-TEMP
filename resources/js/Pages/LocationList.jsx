import BulkErrors from "@/Components/BulkErrors";
import ChangeReviewModal from "@/Components/ChangeReviewModal";
import DeleteModal from "@/Components/DeleteModal";
import Pagination from "@/Components/Pagination";
import ReadOnlyColumns from "@/Components/tanStackTable/ReadOnlyColumn";
import TanstackTable from "@/Components/tanStackTable/TanstackTable";
import { useEditableTable } from "@/Hooks/useEditableTable";
import { useMutation } from "@/Hooks/useMutation";
import { router, usePage } from "@inertiajs/react";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaPlus, FaSave } from "react-icons/fa";
import { MdOutlineDelete } from "react-icons/md";
import SearchInput from "./SearchInput";

//This is a dynamic row height example, which is more complicated, but allows for a more realistic table.
//See https://tanstack.com/virtual/v3/docs/examples/react/table for a simpler fixed row height example.
function LocationList() {
	const deleteModalRef = useRef(null);

	// The virtualizer will need a reference to the scrollable container element
	const {
		locations: serverLocations,
		search: serverSearch,
		perPage: serverPerPage,
		totalEntries,
	} = usePage().props;
	console.log("🚀 ~ LocationList ~ serverLocations:", serverLocations);

	const [searchInput, setSearchInput] = useState(serverSearch || "");
	const [maxItem, setMaxItem] = useState(serverPerPage || 30);

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

	const handleDelete = async () => {
		try {
			await mutate(route("api.locations.massGenocide"), {
				body: {
					ids: Object.keys(table.getState().rowSelection),
				},
				method: "DELETE",
			});

			refresh();
			deleteModalRef.current.close();
			toast.success("Locations deleted successfully!");
		} catch (error) {
			toast.error(error?.message);
			console.error(error);
		}
	};

	const refresh = () => {
		router.reload();
	};

	const columns = React.useMemo(
		() => [
			ReadOnlyColumns({
				accessorKey: "id",
				header: "ID",
				options: { size: 60, enableHiding: false },
			}),
			{
				accessorKey: "location_name",
				header: () => "Location Name",
				size: 340,
			},
			{
				header: "Audit Info",
				columns: [
					ReadOnlyColumns({
						accessorKey: "created_at",
						header: "Created At",
						options: { size: 140 },
					}),
					ReadOnlyColumns({
						accessorKey: "created_by",
						header: "Created By",
						options: { size: 140 },
					}),
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
	} = useEditableTable(serverLocations.data || [], columns, {
		isMultipleSelection: false,
	});

	// const handleAddNewLocation = () => {
	//     router.visit(route("locations.create"));
	// };
	const saveChangeIDModal = "save_change_modal_id";

	const handleSaveClick = () => {
		const computedChanges = getChanges();

		if (computedChanges.length === 0) {
			alert("No changes to save.");
			return;
		}
		document.getElementById(saveChangeIDModal).showModal();
	};

	const saveChanges = async () => {
		try {
			await mutate(route("api.locations.bulkUpdate"), {
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

	// All important CSS styles are included as inline styles for this example. This is not recommended for your code.
	return (
		<div>
			{/* <pre>{JSON.stringify(table.getState().rowSelection, null, 2)}</pre>( */}
			{/* {data.length} rows) */}
			<h1 className="text-lg font-semibold">Location List</h1>
			<div className="flex gap-2 sticky right-0">
				<button
					type="button"
					className="btn btn-primary"
					onClick={() => handleAddNewRow()}
				>
					<FaPlus className="mr-2" />
					Add New Location
				</button>
				<SearchInput
					placeholder="search locations"
					initialSearchInput={searchInput}
					onSearchChange={setSearchInput}
				/>
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
				{/* <button
					type="button"
					className="btn btn-error btn-ghost btn-square"
					disabled={Object.keys(table.getState().rowSelection).length === 0}
					onClick={() => deleteModalRef.current.open()}
				>
					<MdOutlineDelete className="w-full h-full" />
				</button> */}
			</div>

			<div className="px-2 w-full">
				{<BulkErrors errors={mutateErrorData?.data || []} />}
			</div>

			<Pagination
				links={serverLocations?.links}
				currentPage={serverLocations?.current_page}
				goToPage={goToPage}
				filteredTotal={serverLocations?.total}
				overallTotal={totalEntries}
				start={serverLocations?.from}
				end={serverLocations?.to}
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
		</div>
	);
}

export default LocationList;
