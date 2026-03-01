import { FaPlus, FaTrash } from "react-icons/fa";

const ArrayCell = ({ row, getValue, table, column }) => {
	const items = Array.isArray(getValue()) ? getValue() : [];
	const commit = (updated) => {
		table.options.meta?.updateData(
			row.index,
			column?.columnDef.accessorKey,
			updated,
		);
	};

	const update = (index, val) => {
		const copy = [...items];
		copy[index] = val;
		table.options.meta?.updateData(
			row.index,
			column?.columnDef.accessorKey,
			copy,
		);
	};

	const remove = (index) => {
		const copy = items.filter((_, i) => i !== index);
		table.options.meta?.updateData(
			row.index,
			column?.columnDef.accessorKey,
			copy,
		);
	};

	const add = () => {
		table.options.meta?.updateData(row.index, column?.columnDef.accessorKey, [
			...items,
			"",
		]);
	};

	return (
		<div className="flex flex-col gap-1 p-1 w-full">
			{items.map((item, index) => (
				<div key={index} className="relative flex items-center gap-1 group">
					<input
						type="text"
						className="input input-sm bg-base-100/20 flex-1"
						value={item}
						placeholder={`Option ${index + 1}`}
						onChange={(e) => update(index, e.target.value)}
						onBlur={() => commit(items)}
					/>
					<button
						type="button"
						className="absolute right-1 btn btn-xs btn-ghost btn-square opacity-0 group-hover:opacity-100"
						onClick={() => remove(index)}
					>
						<FaTrash className="opacity-50" />
					</button>
				</div>
			))}
			<button type="button" className="btn btn-xs btn-ghost" onClick={add}>
				<FaPlus className="mr-1" /> Add Option
			</button>
		</div>
	);
};

export default ArrayCell;
