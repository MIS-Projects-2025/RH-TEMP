import clsx from "clsx";
import React, { useId } from "react";

const MaxItemDropdown = ({
	buttonClassname = "",
	maxItem,
	changeMaxItemPerPage,
	maxItems = [10, 25, 50, 100],
}) => {
	const id = useId();
	const popoverId = `popover-${id}`;
	const anchorName = `--anchor-${id}`;

	return (
		<>
			<button
				type="button"
				className={clsx("btn", buttonClassname)}
				popoverTarget={popoverId}
				style={{ anchorName }}
			>
				{`Show ${maxItem} items`}
			</button>

			<ul
				popover="auto"
				id={popoverId}
				style={{ positionAnchor: anchorName }}
				className="dropdown menu w-52 rounded-box bg-base-100 shadow-lg z-50"
			>
				{maxItems.map((item) => (
					<li key={item}>
						<button
							type="button"
							onClick={() => {
								changeMaxItemPerPage(item);
								document.getElementById(popoverId)?.hidePopover();
							}}
							className="flex items-center justify-between w-full"
						>
							{item}
							{maxItem === item && (
								<span className="font-bold text-green-500">✔</span>
							)}
						</button>
					</li>
				))}
			</ul>
		</>
	);
};

export default MaxItemDropdown;
