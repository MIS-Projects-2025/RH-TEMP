import { useId } from "react";
import { FaChevronDown } from "react-icons/fa";
import { FaCheck } from "react-icons/fa6";

// options: [{ label: "Text", value: "text" }, ...]
// or just an array of strings: ["text", "number", "select"]
const DropdownCell = ({ row, getValue, table, column, options = [] }) => {
	const value = getValue() ?? "";
	const id = useId();
	const popoverId = `popover-${id}`;
	const anchorId = `--anchor-${id}`;

	const handleChange = (val) => {
		table.options.meta?.updateData(
			row.index,
			column?.columnDef.accessorKey,
			val,
		);
		document.getElementById(popoverId)?.hidePopover();
	};

	const normalizedOptions = options.map((o) =>
		typeof o === "string" ? { label: o, value: o } : o,
	);

	return (
		<>
			<button
				type="button"
				className="btn w-full"
				popoverTarget={popoverId}
				style={{ anchorName: anchorId }}
			>
				{value} <FaChevronDown />
			</button>

			<ul
				className="dropdown menu w-52 rounded-box bg-base-100 shadow-sm"
				popover="auto"
				id={popoverId}
				style={{ positionAnchor: anchorId }}
			>
				{normalizedOptions.map((o) => (
					<li
						key={o.value}
						onClick={() => handleChange(o.value)}
						onKeyDown={(e) => e.key === "Enter" && handleChange(o.value)}
					>
						<a>
							{o.label} {value === o.value && <FaCheck />}{" "}
						</a>
					</li>
				))}
			</ul>
		</>
	);
};

export default DropdownCell;
