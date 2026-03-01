import clsx from "clsx";
import { FaTimes } from "react-icons/fa";
import { FaPencil } from "react-icons/fa6";

export const ClickableCell = ({
	value,
	onClick,
	deletable = false,
	onDelete,
	isEditable = true,
}) => {
	return (
		<div
			onClick={onClick}
			className={clsx(
				"cursor-pointer group hover:ring hover:ring-accent hover:bg-primary/50 w-full flex justify-between items-center px-2 relative",
				{ "text-xs text-base-content/50 italic": !value },
			)}
		>
			{isEditable && (
				<span className="text-primary drop-shadow-md/100 opacity-0 group-hover:opacity-100 transition-opacity top-0 right-0 translate-x-10/12 -translate-y-10/12 absolute">
					<FaPencil className="w-6 h-6" />
				</span>
			)}
			<span>{value ?? "none"}</span>
			{value && deletable && onDelete && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onDelete();
					}}
					className="btn w-4 h-4 btn-error btn-sm btn-circle absolute cursor-pointer right-1 opacity-0 group-hover:opacity-100 transition-opacity"
				>
					<FaTimes size={12} />
				</button>
			)}
		</div>
	);
};

export const createClickableCell = ({
	modalID,
	deletable = false,
	handleCellClick,
	isEditable = true,
	formatDisplayValue,
}) => {
	return ({ table, row, getValue, column }) => {
		const rawValue = getValue();

		const value = formatDisplayValue
			? formatDisplayValue({ row, rawValue, column })
			: rawValue;

		const onClick = () => {
			if (handleCellClick) {
				handleCellClick(row, value, column);
			}
			if (modalID) {
				document.getElementById(modalID)?.showModal();
			}
		};

		const onDelete = deletable
			? () => {
					const rootKey = column?.columnDef?.accessorKey?.split(".")[0];
					table.options.meta?.updateData(row.index, rootKey, null);
				}
			: null;

		return (
			<ClickableCell
				value={value}
				onClick={onClick}
				deletable={deletable}
				onDelete={onDelete}
				isEditable={isEditable}
			/>
		);
	};
};
