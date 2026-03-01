import CheckBoxColumn from "@/Components/tanStackTable/CheckBoxColumn";
import DefaultEditableColumn from "@/Components/tanStackTable/defaultEditableColumn";
import updateNested from "@/Utils/updateNested";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * useEditableTable - reusable hook for editable React Table
 *
 * @param {Array} initialData - initial table data
 * @param {Array} columns - column definitions
 * @param {Object} options - optional settings
 *        options.defaultColumn - default column definition
 * 				options.isMultipleSelection - enable multiple selection
 *        options.onEdit - callback when a cell is edited
 *        options.createEmptyRow - callback to create an empty row
 *        options.columnVisibility - list of visible columns
 *        options.setColumnVisibility - callback to update column visibility
 * @returns {Object} table instance + state helpers
 */
export function useEditableTable(initialData = [], columns, options = {}) {
	const {
		defaultColumn = DefaultEditableColumn,
		isMultipleSelection = false,
		onEdit,
		createEmptyRow,
		columnVisibility,
		setColumnVisibility,
	} = options;

	const [data, setData] = useState(initialData);
	const [editedRows, setEditedRows] = useState({});
	console.log("🚀 ~ useEditableTable ~ data:", data);
	console.log("🚀 ~ useEditableTable ~ editedRows:", editedRows);
	const [originalData, setOriginalData] = useState({});
	const [changes, setChanges] = useState([]);

	useEffect(() => {
		const rows = initialData;
		setData(rows);

		const map = {};
		rows.forEach((row) => {
			map[row.id] = row;
		});
		setOriginalData(map);
		setEditedRows({});
	}, [initialData]);

	const updateData = useCallback(
		(rowIndex, accessorKey, value) => {
			setData((prevData) => {
				const row = prevData[rowIndex];
				const updatedRow = updateNested(row, accessorKey, value);

				console.log("🚀 ~ useEditableTable ~ row:", row);
				console.log("🚀 ~ useEditableTable ~ updatedRow:", updatedRow);

				if (JSON.stringify(row) === JSON.stringify(updatedRow)) return prevData;

				const newData = [...prevData];
				newData[rowIndex] = updatedRow;

				const rowId = row.id;
				setEditedRows((prev) => {
					return {
						...prev,
						[rowId]: updatedRow,
					};
				});

				return newData;
			});
		},
		[onEdit],
	);

	const derivedColumns = useMemo(() => {
		const visibleColumns = columns.filter((col) => !col.meta?.hidden);

		if (!isMultipleSelection) return visibleColumns;

		return [CheckBoxColumn, ...visibleColumns];
	}, [columns, isMultipleSelection, CheckBoxColumn]);

	const table = useReactTable({
		data,
		columns: derivedColumns,
		defaultColumn,
		getRowId: (row) => row.id.toString(),
		getCoreRowModel: getCoreRowModel(),
		columnResizeDirection: "ltr",
		columnResizeMode: "onChange",
		meta: {
			updateData,
		},
		...(columnVisibility &&
			setColumnVisibility && {
				state: { columnVisibility },
				onColumnVisibilityChange: setColumnVisibility,
			}),
	});

	const handleAddNewRow = useCallback(
		(overrides = {}) => {
			const newId = `new-${table.getRowCount() + 1}`;

			const baseRow =
				typeof createEmptyRow === "function" ? createEmptyRow() : {};

			const newRow = {
				id: newId,
				...baseRow,
				...overrides,
				isNew: true,
			};

			setData((prev) => [newRow, ...prev]);

			setEditedRows((prev) => ({
				[newId]: newRow,
				...prev,
			}));
		},
		[table, createEmptyRow],
	);

	const handleResetChanges = () => {
		if (Object.keys(editedRows).length === 0) {
			alert("No changes to reset.");
			return;
		}

		if (!confirm("Are you sure you want to discard all changes?")) return;

		setEditedRows({});
		setChanges([]);
		const originalRows = Object.values(originalData);
		setData(originalRows);
	};

	const getChanges = () => {
		const changes = [];

		for (const rowId in editedRows) {
			const original = originalData[rowId] || {};
			const edited = editedRows[rowId];

			for (const field in edited) {
				const before = original[field] || null;
				const after = edited[field];

				if (before !== after) {
					changes.push({
						rowId,
						field,
						before,
						after,
					});
				}
			}
		}

		setChanges(changes);
		return changes;
	};

	return {
		table,
		data,
		setData,
		editedRows,
		setEditedRows,
		handleAddNewRow,
		handleResetChanges,
		changes,
		getChanges,
		checkedRows: Object.keys(table.getState().rowSelection),
		updateData,
	};
}
