import { useState } from "react";
import { FaArrowRight, FaKey, FaPlus, FaTrash } from "react-icons/fa";

const JSONcell = ({ row, getValue, table, column }) => {
	const initialProps = getValue() || {};
	const [properties, setProperties] = useState(Object.entries(initialProps));

	const handleBlur = () => {
		table.options.meta?.updateData(
			row.index,
			column?.columnDef.accessorKey,
			Object.fromEntries(properties),
		);
	};

	const updateProperty = (index, type, newVal) => {
		setProperties((prev) => {
			const copy = [...prev];
			if (type === "key") copy[index][0] = newVal;
			else copy[index][1] = newVal;
			return copy;
		});
	};

	const deleteProperty = (index) => {
		setProperties((prev) => {
			const copy = [...prev];
			copy.splice(index, 1);

			table.options.meta?.updateData(
				row.index,
				column?.columnDef.accessorKey,
				Object.fromEntries(copy),
			);

			return copy;
		});
	};

	const addProperty = () => {
		setProperties((prev) => {
			const copy = [...prev, ["", ""]];
			return copy;
		});
	};

	return (
		<div className="flex w-full flex-col gap-2 border border-base-content/20">
			{properties.map(([key, value], index) => (
				<div key={index} className="flex items-center gap-2 group">
					<label className="input bg-base-100/20 flex-1">
						<FaKey className="opacity-25" />
						<input
							type="text"
							value={key}
							placeholder="Key"
							onChange={(e) => updateProperty(index, "key", e.target.value)}
							onBlur={handleBlur}
						/>
					</label>

					<label className="input bg-base-100/20 flex-1">
						<FaArrowRight className="opacity-25" />
						<input
							type="text"
							value={value}
							placeholder="Value"
							onChange={(e) => updateProperty(index, "value", e.target.value)}
							onBlur={handleBlur}
						/>
					</label>

					<button
						type="button"
						className="btn opacity-0 group-hover:opacity-100 btn-square"
						onClick={() => deleteProperty(index)}
					>
						<FaTrash className="opacity-25" />
					</button>
				</div>
			))}

			<button type="button" className="btn btn-sm" onClick={addProperty}>
				<FaPlus className="mr-1" /> Add Property
			</button>
		</div>
	);
};

export default JSONcell;
