import MultiSelectSearchableDropdown from "@/Components/MultiSelectSearchableDropdown";
import RestroomMonitoringForm from "@/Components/RestroomMonitoringForm";
import { router, usePage } from "@inertiajs/react";
import React from "react";
import { FaCaretDown } from "react-icons/fa6";

const restroomModalID = "restroom-monitoring-checklist-modal";

const PerformRestroomMonitoringPage = () => {
	const { selectedRestroom, restrooms } = usePage().props;
	console.log("🚀 ~ PerformRestroomMonitoringPage ~ restrooms:", restrooms);
	console.log(
		"🚀 ~ PerformRestroomMonitoringPage ~ selectedRestroom:",
		selectedRestroom,
	);

	const onSubmit = (data) => {
		console.log(data);
	};

	const reload = (selectedRestroomID) => {
		router.reload({
			data: {
				restroom_id: selectedRestroomID,
			},
			preserveState: true,
			preserveScroll: true,
		});
	};

	return (
		<div className="flex w-full h-[calc(100vh-100px)] flex-col gap-4 relative p-1 shadow-lg">
			<h1 className="font-bold">Perform Restroom Monitoring</h1>
			<MultiSelectSearchableDropdown
				modalId={restroomModalID}
				options={
					restrooms?.map((restroom) => ({
						value: restroom.restroom_name,
						original: restroom,
					})) || []
				}
				returnKey="original"
				onChange={(value) => {
					reload(value[0]?.id);
				}}
				defaultSelectedOptions={[
					restrooms.find((r) => r.id === selectedRestroom?.id)?.restroom_name,
				]}
				controlledSelectedOptions={[
					restrooms.find((r) => r.id === selectedRestroom?.id)?.restroom_name,
				]}
				customButtonLabel={({ selectedOptions }) => {
					return (
						<div>
							{selectedOptions.length > 0 ? (
								<div className="flex items-center justify-between w-full">
									<h1 className="w-full text-lg">{selectedOptions[0]}</h1>
									<FaCaretDown className="inline-block ml-2" />
								</div>
							) : (
								"Select Checklist"
							)}
						</div>
					);
				}}
				disableSelectedContainer
				disableClearSelection
				disableTooltip
				itemName="Restroom List"
				prompt="Select Restroom"
				contentClassName="h-50"
				buttonSelectorClassName="w-full min-h-8 h-auto btn-soft btn-primary text-left"
				singleSelect
			/>

			<RestroomMonitoringForm
				key={`${selectedRestroom?.id}-${selectedRestroom?.fixtures?.length}`}
				restroomId={selectedRestroom?.id}
				fixtures={selectedRestroom?.fixtures || []}
				onSubmit={onSubmit}
			/>
		</div>
	);
};

export default PerformRestroomMonitoringPage;
