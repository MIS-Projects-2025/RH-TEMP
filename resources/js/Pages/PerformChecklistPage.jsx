import ChecklistItemsForm from "@/Components/ChecklistItemsForm";
import MultiSelectSearchableDropdown from "@/Components/MultiSelectSearchableDropdown";
import Steps from "@/Components/Steps";
import { useFetch } from "@/Hooks/useFetch";
import { useChecklistStore } from "@/Store/checklistStore";
import { router, usePage } from "@inertiajs/react";
import React, { useEffect, useState } from "react";
import { AiOutlineExclamationCircle } from "react-icons/ai";
import { MdDone } from "react-icons/md";

const performChecklistSteps = [
	"Pick a checklist",
	"Select an Equipment",
	"Fill up the items",
	"Review & Submit",
];

const assetModalID = "perform-checklist-assets-modal";
const checklistModalID = "perform-checklist-checklist-modal";
const maxItem = -1; // all

const PerformChecklistPage = () => {
	const { checklistsOverview } = usePage().props;

	// const { data: checklistsOverview, isLoading, fetchChecklists } = useChecklistStore();
	console.log("🚀 ~ PerformChecklistPage ~ checklists:", checklistsOverview);

	const {
		data: assets,
		isLoading: isLoadingAsset,
		errorMessage: errorMessageAssets,
		errorData: errorDataAssets,
		cancel: cancelAssets,
		fetch: fetchAssets,
	} = useFetch(route("api.checklist-assets.due-assets"), {
		auto: false,
	});

	const {
		data: checklistItems,
		isLoading: isLoadingChecklistItems,
		errorMessage: errorMessageChecklistItems,
		errorData: errorDataChecklistItems,
		cancel: cancelChecklistItems,
		fetch: fetchChecklistItems,
	} = useFetch(route("api.checklist-items.scheduled-check-items"), {
		auto: false,
	});

	const [assetSearchInput, setAssetSearchInput] = useState("");

	const [currentStep, setCurrentStep] = React.useState(0);
	const [selectedChecklist, setSelectedChecklist] = React.useState(null);
	const [assetDropdownTrigger, setAssetDropdownTrigger] = useState(0);
	const [selectedAssets, setSelectedAssets] = React.useState([]);
	const [isFormFilled, setIsFormFilled] = React.useState(false);

	useEffect(() => {
		if (selectedChecklist) setCurrentStep(1);
		if (selectedChecklist && selectedAssets.length > 0) setCurrentStep(2);
		if (isFormFilled) setCurrentStep(3);
	}, [selectedChecklist, selectedAssets, isFormFilled]);

	const handleAssetsChange = (asset) => {
		setSelectedAssets(asset);
	};

	useEffect(() => {
		fetchChecklistItems({
			assetId: selectedAssets[0]?.id,
			checklistId: selectedChecklist?.id,
		});
	}, [selectedAssets]);

	const onSubmit = () => {
		fetchAssets({
			search: assetSearchInput,
			checklistId: selectedChecklist?.id,
			perPage: maxItem,
		});
		router.reload();
	};

	const customChecklistListStyle = (option) => {
		const { value, label } = option || {};
		const {
			total_assets_count,
			total_assets_with_done,
			total_assets_with_due,
		} = option?.original || {};

		return (
			<div className="relative flex overflow-hidden text-ellipsis justify-between text-sm">
				<div className="">
					{value}
					<span className="opacity-60">{label ? `@${label}` : ""}</span>
				</div>
				<div className="text-sm absolute right-0">
					{(total_assets_with_due > 0 || total_assets_with_done > 0) && (
						<div className="flex gap-2">
							{total_assets_with_due > 0 && (
								<div className="flex items-center gap-1">
									<span className="text-base-content">
										{total_assets_with_due}
									</span>
									<span className="text-yellow-600">
										<AiOutlineExclamationCircle />
									</span>
								</div>
							)}
							{total_assets_with_done > 0 && (
								<div className="flex items-center gap-1">
									<span className="text-base-content">
										{total_assets_with_done}
									</span>
									<span className="text-green-600">
										<MdDone />
									</span>
								</div>
							)}
						</div>
					)}
					{total_assets_count === 0 && (
						<div className="text-xs opacity-50 z-50">No asset</div>
					)}
				</div>
			</div>
		);
	};

	const customAssetListStyle = (option) => {
		return (
			<div className="flex w-full justify-between text-sm">
				<span>
					{option?.value}
					<span className="opacity-60">
						{option?.label ? `@${option?.label}` : ""}
					</span>
				</span>
				<div className="text-sm">
					{option?.dueCheckItems > 0 ? (
						<div className="flex gap-2">
							<div className="flex items-center gap-1">
								<span className="text-base-content">
									{option?.dueCheckItems}
								</span>
								<span className="text-yellow-600">
									<AiOutlineExclamationCircle />
								</span>
							</div>
							<div className="flex items-center gap-1">
								<span className="text-base-content">
									{option?.doneCheckItems}
								</span>
								<span className="text-green-600">
									<MdDone />
								</span>
							</div>
						</div>
					) : option?.doneCheckItems > 0 ? (
						<span className="badge bg-green-600/75 text-neutral badge-sm">
							Complete
						</span>
					) : (
						<span className="text-muted-foreground">No items</span>
					)}
				</div>
			</div>
		);
	};

	return (
		<div className="flex md:flex-row flex-col gap-4 relative">
			<div className="h-20 md:h-50 sticky top-0">
				<Steps
					steps={performChecklistSteps}
					currentStep={currentStep}
					stepsClassName={"w-full md:steps-vertical z-0"}
				/>
			</div>

			<div className="flex-1 flex flex-col h-[calc(100vh-7rem)] bg-base-100 p-4 shadow-2xl">
				<div className="flex">
					<MultiSelectSearchableDropdown
						modalId={checklistModalID}
						options={
							checklistsOverview?.checklistArray?.map((checklist) => ({
								value: checklist.name,
								label: checklist.form_control_no,
								original: checklist,
							})) || []
						}
						onChange={(value) => {
							setSelectedChecklist(value[0]);
							setAssetDropdownTrigger((prev) => prev + 1);
							setSelectedAssets([]);
							setAssetSearchInput("");
							fetchAssets({
								search: assetSearchInput,
								checklistId: value[0]?.id,
								perPage: maxItem,
							});
						}}
						returnKey="original"
						defaultSelectedOptions={
							selectedChecklist?.name ? [selectedChecklist.name] : []
						}
						controlledSelectedOptions={
							selectedChecklist?.name ? [selectedChecklist.name] : []
						}
						customButtonLabel={({ selectedOptions }) => {
							return (
								<div>
									{selectedOptions.length > 0 ? (
										<div className="flex items-center justify-between w-full">
											<h1 className="flex gap-2 items-center w-full text-lg">
												<span className="text-sm font-normal text-base-content">
													Performing
												</span>
												<span>{selectedOptions[0]}</span>
											</h1>
										</div>
									) : (
										"Select a checklist to perform"
									)}
								</div>
							);
						}}
						isOpen={true}
						disableSelectedContainer
						disableClearSelection
						disableTooltip
						itemName="Checklist List"
						prompt="Select Checklist"
						contentClassName="h-120"
						buttonSelectorClassName="min-h-8 w-full h-auto btn-soft btn-primary text-left"
						singleSelect
					>
						{customChecklistListStyle}
					</MultiSelectSearchableDropdown>

					<MultiSelectSearchableDropdown
						modalId={assetModalID}
						options={
							assets?.assets?.map((item) => ({
								value: String(item.code),
								label: item?.location?.location_name,
								totalCheckItems: item?.total_items,
								dueCheckItems: item?.due_items,
								doneCheckItems: item?.done_items,
								original: item,
							})) || []
						}
						onChange={(value) => {
							handleAssetsChange(value);
						}}
						isOpen={selectedChecklist !== null}
						openTrigger={assetDropdownTrigger}
						itemName="Asset List"
						isLoading={isLoadingAsset}
						singleSelect
						disableTooltip
						disableSelectedContainer
						customButtonLabel={({ selectedOptions }) => {
							return (
								<div>
									{selectedOptions.length > 0 ? (
										<div className="flex items-left justify-between w-full">
											<h1 className="flex gap-2 items-center w-full text-lg">
												<span className="text-sm font-normal text-base-content">
													on equipment
												</span>
												<span>{selectedOptions[0]}</span>
											</h1>
										</div>
									) : (
										"Pick an Asset on this checklist"
									)}
								</div>
							);
						}}
						prompt="Select Asset"
						buttonSelectorClassName={
							"w-full min-h-8 h-auto btn-soft btn-primary text-left"
						}
						contentClassName={"h-120"}
						defaultSelectedOptions={
							selectedAssets?.name ? [selectedAssets.name] : []
						}
						returnKey={"original"}
					>
						{customAssetListStyle}
					</MultiSelectSearchableDropdown>
				</div>

				{selectedChecklist &&
					selectedAssets.length > 0 &&
					checklistItems.length > 0 && (
						<ChecklistItemsForm
							assetId={selectedAssets[0]?.id}
							checklist={selectedChecklist}
							items={checklistItems}
							isItemsLoading={isLoadingChecklistItems}
							// onValid={setIsFormFilled}
							onAnyFilled={setIsFormFilled}
							onSubmit={onSubmit}
						/>
					)}
			</div>
		</div>
	);
};

export default PerformChecklistPage;
