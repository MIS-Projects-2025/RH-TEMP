import clsx from "clsx";
import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { BiSelectMultiple } from "react-icons/bi";
import { FaTimes, FaTrash } from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import Pagination from "./Pagination";

const MultiSelectSearchableDropdown = memo(
	function MultiSelectSearchableDropdown({
		modalId = "multiSelectSearchableDropdown-modal",
		formFieldName,
		options = [],
		onChange,
		defaultSelectedOptions = [],
		controlledSelectedOptions = [],
		isLoading = false,
		contentClassName = "",
		itemName = "options",
		prompt = "",
		debounceDelay = 500,
		singleSelect = false,
		disableSearch = false,
		disableTooltip = false,
		buttonSelectorClassName = "w-52",
		onFocus = () => {},
		onSearchChange,
		isOpen = undefined,
		useModal = false,
		modalRef = null,
		disableSelectedContainer = false,
		returnKey = "value",
		paginated = false,
		links = null,
		disableClearSelection = false,
		currentPage = null,
		customButtonLabel = null,
		children,
		openTrigger = 0,
		goToPage = () => {},
	}) {
		const id = useId();
		const popoverId = `popover-${id}`;
		const anchorName = `--anchor-${id}`;

		const wrapperRef = useRef(null);

		// const [open, setOpen] = useState(isOpen !== undefined ? isOpen : false);

		const [selectedOptions, setSelectedOptions] = useState(
			defaultSelectedOptions,
		);
		console.log(
			"🚀 ~ MultiSelectSearchableDropdown ~ selectedOptions:",
			selectedOptions,
		);
		const [searchInput, setSearchInput] = useState("");
		const [debouncedSearch, setDebouncedSearch] = useState("");

		useEffect(() => {
			if (isOpen === undefined) return;
			const el = document.getElementById(`popover-${id}`);
			if (!el) return;
			if (isOpen) el.showPopover?.();
			else el.hidePopover?.();
		}, [isOpen, id]);

		useEffect(() => {
			if (openTrigger === 0) return; // skip initial
			const el = document.getElementById(popoverId);
			el?.showPopover?.();
			// setOpen(true);
		}, [openTrigger, popoverId]);

		useEffect(() => {
			if (controlledSelectedOptions.length > 0) {
				setSelectedOptions(controlledSelectedOptions);
			}
		}, [controlledSelectedOptions]);

		useEffect(() => {
			const timer = setTimeout(() => {
				setDebouncedSearch(searchInput);
				onSearchChange?.(searchInput);
			}, debounceDelay);
			return () => clearTimeout(timer);
		}, [searchInput, debounceDelay, onSearchChange]);

		const getSelectedValues = (values) => {
			if (returnKey === "value") return values;
			return values.map((val) => {
				return options.find((opt) => opt.value === val)?.[returnKey];
			});
		};

		const handleChange = (e) => {
			const value = e.target.value;
			let updatedValues;
			if (singleSelect) {
				updatedValues = [value];
				// setOpen(false);
				document.getElementById(`popover-${id}`)?.hidePopover?.();
			} else {
				const isChecked = e.target.checked;
				updatedValues = isChecked
					? [...selectedOptions, value]
					: selectedOptions.filter((item) => item !== value);
			}
			setSelectedOptions(updatedValues);
			onChange(getSelectedValues(updatedValues));
		};

		const handleSelectAll = () => {
			const allValues = options.map((item) => item.value);
			setSelectedOptions(allValues);
			onChange(getSelectedValues(allValues));
		};

		const handleRemoveOption = (value) => {
			const updatedValues = selectedOptions.filter((item) => item !== value);
			setSelectedOptions(updatedValues);
			onChange(getSelectedValues(updatedValues));
		};

		const handleClearSelectionClick = (e) => {
			e.preventDefault();
			setSelectedOptions([]);
			onChange(getSelectedValues([]));
		};

		const isClearSelectionEnabled = selectedOptions.length > 0;

		const getButtonLabel = () => {
			if (typeof customButtonLabel === "function") {
				return customButtonLabel({
					selectedOptions,
				});
			}

			if (customButtonLabel) return customButtonLabel;

			const count = selectedOptions.length;
			if (count === 0) return prompt;
			if (singleSelect || count === 1) return selectedOptions[0];
			return `${selectedOptions[0]} and ${count - 1} more`;
		};

		const filteredOptions = useMemo(() => {
			if (onSearchChange) return options;
			if (!debouncedSearch.trim()) return options;
			const search = debouncedSearch.toLowerCase();
			return options.filter(
				(option) =>
					option.value.toLowerCase().includes(search) ||
					option.label?.toLowerCase().includes(search),
			);
		}, [debouncedSearch, options, onSearchChange]);

		const tooltipID = `${id}-${itemName}-tooltip`;

		const searchBar = () => (
			<>
				{!disableSearch && (
					<div className="relative w-full mb-2">
						<input
							type="text"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder="Search..."
							className="input input-sm w-full pr-8"
						/>
						{searchInput && (
							<button
								type="button"
								onMouseDown={(e) => {
									e.preventDefault();
									setSearchInput("");
								}}
								className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/70 hover:text-base-content"
							>
								<FaTimes />
							</button>
						)}
					</div>
				)}
			</>
		);

		const promptLabel = () => (
			<>
				{prompt && (
					<div className="font-semibold text-center mb-2">{prompt}</div>
				)}
			</>
		);

		const content = (showSearchInput = true) => (
			<>
				{showSearchInput && searchBar()}

				<div className="flex z-10 items-center mb-2 gap-2">
					{!disableClearSelection && (
						<button
							type="button"
							onClick={handleClearSelectionClick}
							onMouseDown={(e) => e.preventDefault()}
							disabled={!isClearSelectionEnabled}
							className="flex items-center gap-2 text-warning w-full px-2 py-1 rounded-lg hover:bg-primary/10 disabled:opacity-50"
						>
							<FaTrash />
							Clear selection
						</button>
					)}
					{!singleSelect && (
						<button
							type="button"
							onClick={handleSelectAll}
							onMouseDown={(e) => e.preventDefault()}
							className="flex items-center gap-2 text-primary w-full px-2 py-1 rounded-lg hover:bg-primary/10"
						>
							<BiSelectMultiple />
							Select All
						</button>
					)}
				</div>

				<div className={clsx("flex w-full", contentClassName)}>
					<div className="overflow-y-auto w-full flex flex-col">
						{filteredOptions.length === 0 ? (
							<div className="p-2 text-sm w-full text-gray-500">
								No matches found for {debouncedSearch}
							</div>
						) : (
							filteredOptions.map((option) => (
								<label
									key={option.value}
									className="flex items-center w-full cursor-pointer px-2 py-1 hover:bg-primary/10 rounded"
								>
									<input
										type={singleSelect ? "radio" : "checkbox"}
										name={formFieldName}
										value={option.value}
										checked={selectedOptions.includes(option.value)}
										onChange={handleChange}
										className={clsx(
											singleSelect
												? "radio radio-primary cursor-pointer"
												: "checkbox checkbox-sm checkbox-primary cursor-pointer",
										)}
									/>

									<div className="ml-2 flex-1">
										{typeof children === "function" ? (
											children(option)
										) : (
											<div className="flex w-full justify-between">
												<div>{option.value}</div>
												<div>{option.label}</div>
											</div>
										)}
									</div>
								</label>
							))
						)}
					</div>

					{!disableSelectedContainer && (
						<div className="w-full flex flex-col overflow-y-auto p-2">
							{selectedOptions.length === 0 ? (
								<div className="text-sm text-gray-500">
									currently none selected
								</div>
							) : (
								selectedOptions.map((option) => (
									<button
										type="button"
										key={option}
										onClick={() => handleRemoveOption(option)}
										onMouseDown={(e) => e.preventDefault()}
										className="text-left hover:text-error px-2 py-1 w-full rounded"
									>
										{option}
									</button>
								))
							)}
						</div>
					)}
				</div>
				{paginated && (
					<Pagination
						showMeta={false}
						links={links}
						currentPage={currentPage}
						goToPage={goToPage}
						filteredTotal={options.length || 0}
						contentClassName="bg-base-100 justify-center"
					/>
				)}
			</>
		);

		if (!useModal) {
			return (
				<div ref={wrapperRef} className="w-full" onFocus={onFocus}>
					{!disableTooltip && (
						<Tooltip
							id={tooltipID}
							className="custom-tooltip"
							hidden={selectedOptions.length === 0}
						>
							<div className="text-left p-2 flex flex-wrap gap-1">
								{selectedOptions.map((option) => (
									<span
										key={option}
										className="border border-neutral-content/40 px-1 rounded-lg"
									>
										{option}
									</span>
								))}
							</div>
						</Tooltip>
					)}

					<button
						type="button"
						data-tooltip-id={tooltipID}
						popoverTarget={popoverId}
						style={{ anchorName }}
						className={clsx(
							"btn border border-base-content/20",
							buttonSelectorClassName,
						)}
					>
						{getButtonLabel()}
					</button>

					<ul
						id={popoverId}
						popover="auto"
						style={{ positionAnchor: anchorName }}
						className="dropdown menu w-full flex flex-col bg-base-100 rounded-box p-2 shadow-sm not-[&:popover-open]:hidden"
						// onToggle={(e) => setOpen(e.newState === "open")}
					>
						{promptLabel()}
						{isLoading ? (
							<div className="flex justify-center gap-2 my-auto">
								<div className="loading loading-spinner"></div>
								<div>loading {itemName}</div>
							</div>
						) : (
							content()
						)}
					</ul>
				</div>
			);
		}

		return (
			<dialog ref={modalRef} onFocus={onFocus} id={modalId} className="modal">
				<div className="modal-box w-full">
					{selectedOptions.length > 0 && (
						<div className="flex justify-center items-center gap-2 my-1 text-center">
							<div>currently selected</div>
							{selectedOptions.map((option) => (
								<span
									key={option}
									className="border bg-primary/75 text-primary-content border-neutral-content/40 px-1"
								>
									{option}
								</span>
							))}
						</div>
					)}
					{promptLabel()}
					<div>
						{searchBar()}
						{isLoading ? (
							<div className="h-120 flex justify-center items-center flex-col gap-2">
								<div className="loading loading-spinner"></div>
								<div>loading {itemName}</div>
							</div>
						) : (
							content(false)
						)}
					</div>
				</div>

				<form method="dialog" className="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
		);
	},
);

export default MultiSelectSearchableDropdown;
