import BulkErrors from "@/Components/BulkErrors";
import ChangeReviewModal from "@/Components/ChangeReviewModal";
import DeleteModal from "@/Components/DeleteModal";
import CheckBoxColumn from "@/Components/tanStackTable/CheckBoxColumn";
import ReadOnlyColumns from "@/Components/tanStackTable/ReadOnlyColumn";
import TanstackTable from "@/Components/tanStackTable/TanstackTable";
import { useEditableTable } from "@/Hooks/useEditableTable";
import { useMutation } from "@/Hooks/useMutation";
import getObjectChanges from "@/Utils/getObjectChanges";
import { router, usePage } from "@inertiajs/react";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MdOutlineDelete } from "react-icons/md";

//This is a dynamic row height example, which is more complicated, but allows for a more realistic table.
//See https://tanstack.com/virtual/v3/docs/examples/react/table for a simpler fixed row height example.
function SchedulesList() {
	const deleteModalRef = useRef(null);

	// NOT IN USE
	// implementing a page for user to modify schedules would require a lot of work
	// implementing a page for user to modify schedules would require a lot of work
	// NOT IN USE
	// NOT IN USE
	// NOT IN USE
	// NOT IN USE
	// NOT IN USE

	const {
		mutate,
		isLoading: isMutateLoading,
		errorMessage: mutateErrorMessage,
		errorData: mutateErrorData,
		cancel: mutateCancel,
	} = useMutation();

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
			CheckBoxColumn,
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

	// The virtualizer will need a reference to the scrollable container element
	const { locations: serverLocations } = usePage().props;
	const [originalData, setOriginalData] = useState({});

	const { table, setData, editedRows, setEditedRows } = useEditableTable(
		serverLocations || [],
		columns,
	);

	const handleResetChanges = () => {
		if (Object.keys(editedRows).length === 0) {
			alert("No changes to reset.");
			return;
		}

		if (!confirm("Are you sure you want to discard all changes?")) return;

		setEditedRows({});

		const originalRows = Object.values(originalData);
		setData(originalRows);
	};

	useEffect(() => {
		const rows = serverLocations || [];
		setData(rows);

		const map = {};
		rows.forEach((row) => {
			map[row.id] = row;
		});
		setOriginalData(map);

		setEditedRows({});
	}, [serverLocations]);
	const [changesToReview, setChangesToReview] = useState([]);
	const handleAddNewLocation = () => {
		router.visit(route("locations.create"));
	};
	const saveChangeIDModal = "save_change_modal_id";

	const handleSaveClick = () => {
		const changes = getObjectChanges(editedRows, originalData);
		if (changes.length === 0) {
			alert("No changes to save.");
			return;
		}
		document.getElementById(saveChangeIDModal).showModal();
		setChangesToReview(changes);
	};

	const saveChanges = async () => {
		await mutate(route("api.locations.bulkUpdate"), {
			method: "PATCH",
			body: editedRows,
		});

		document.getElementById(saveChangeIDModal).close();

		toast.success("Changes updated successfully!");
		refresh();
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
					onClick={handleAddNewLocation}
				>
					Add New Location
				</button>
				<button
					type="button"
					className="btn btn-primary"
					onClick={handleSaveClick}
					disabled={Object.keys(editedRows).length === 0}
				>
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
			</div>

			<div className="px-2 w-full">
				{<BulkErrors errors={mutateErrorData?.data || []} />}
			</div>

			<TanstackTable table={table} />

			<ChangeReviewModal
				modalID={saveChangeIDModal}
				changes={changesToReview}
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

export default SchedulesList;
