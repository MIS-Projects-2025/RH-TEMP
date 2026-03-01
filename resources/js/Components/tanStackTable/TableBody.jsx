import { flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";

// taken from tanStack Docs
export default function TableBody({
	table,
	tableContainerRef,
	isTableLoading,
}) {
	const { rows } = table.getRowModel();

	// Important: Keep the row virtualizer in the lowest component possible to avoid unnecessary re-renders.
	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		estimateSize: () => 27, //estimate row height for accurate scrollbar dragging
		getScrollElement: () => tableContainerRef.current,
		//measure dynamic row height, except in firefox because it measures table border height incorrectly
		measureElement:
			typeof window !== "undefined" &&
			navigator.userAgent.indexOf("Firefox") === -1
				? (element) => element?.getBoundingClientRect().height
				: undefined,
		overscan: 5,
	});

	return (
		<tbody
			className="mb-40"
			style={{
				display: "grid",
				height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
				position: "relative", //needed for absolute positioning of rows
			}}
		>
			{rowVirtualizer.getVirtualItems().map((virtualRow) => {
				const row = rows[virtualRow.index];
				return (
					<TableBodyRow
						rowIndex={virtualRow.index}
						key={row.id}
						row={row}
						virtualRow={virtualRow}
						rowVirtualizer={rowVirtualizer}
						isLoading={isTableLoading}
					/>
				);
			})}
			{isTableLoading && (
				<span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 loading loading-spinner loading-md"></span>
			)}
		</tbody>
	);
}

function TableBodyRow({
	rowIndex,
	row,
	virtualRow,
	rowVirtualizer,
	isLoading,
}) {
	return (
		<tr
			className={clsx("hover:outline outline-secondary/50", {
				"ring ring-yellow-200/75 bg-yellow-100/10": row.original?.isNew,
				"bg-base-300": !row.original?.isNew && rowIndex % 2 === 0,
			})}
			data-index={virtualRow.index}
			ref={(node) => rowVirtualizer.measureElement(node)}
			key={row.id}
			style={{
				display: "flex",
				position: "absolute",
				transform: `translateY(${virtualRow.start}px)`,
				width: "100%",
			}}
		>
			{row.getVisibleCells().map((cell, cellIndex) => {
				return (
					<td
						className={clsx({
							"animate-hehe bg-base-300 w-full text-[0px]": isLoading,
						})}
						key={cell.id}
						style={{
							display: "flex",
							width: cell.column.getSize(),
							animationDelay: `-${(cellIndex + rowIndex) * 0.05}s`,
						}}
					>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</td>
				);
			})}
		</tr>
	);
}
