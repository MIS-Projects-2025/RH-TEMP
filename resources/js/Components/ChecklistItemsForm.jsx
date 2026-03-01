import { useMutation } from "@/Hooks/useMutation";
import { formatTimestamp } from "@/Utils/formatISOTimestampToDate";
import clsx from "clsx";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FaCheckCircle } from "react-icons/fa";
import { GoAlert } from "react-icons/go";
import { TbAlertCircle } from "react-icons/tb";

export default function ChecklistItemsForm({
	assetId,
	checklist,
	items,
	isItemsLoading,
	onValid = () => {},
	onAnyFilled = () => {},
	onSubmit: onSubmitProp,
}) {
	console.log("🚀 ~ ChecklistItemsForm ~ checklist:", checklist);
	console.log("🚀 ~ ChecklistItemsForm ~ assetId:", assetId);
	console.log("🚀 ~ ChecklistItemsForm ~ items:", items);
	const { mutate, isLoading, errorMessage } = useMutation();

	const {
		register,
		control,
		handleSubmit,
		setValue,
		reset,
		watch,
		formState: { errors, isValid },
	} = useForm({
		defaultValues: {
			items: items.map((item) => ({
				checklist_item_id: item.id,
				item_status: "",
				remarks: "",
			})),
			notes: "",
		},
	});

	const { fields } = useFieldArray({
		control,
		name: "items",
	});

	const isAllDone = items.every((item) => item.is_due === 0);

	const watchItems = watch("items");

	console.log("🚀 ~ ChecklistItemsForm ~ watchItems:", watchItems);

	const hasAnyValue = watchItems.some(
		(item) => item.item_status && item.item_status.trim() !== "",
	);

	const onSubmit = async (data) => {
		try {
			await mutate(route("api.checklist-item-result.recordResult"), {
				body: {
					asset_id: assetId,
					checklist_id: checklist?.id,
					notes: data.notes,
					items: data.items,
				},
			});

			if (typeof onSubmitProp === "function") {
				onSubmitProp();
			}

			toast.success("Checklist submitted successfully!");
			// router.reload();
		} catch (error) {
			console.error(error);
			toast.error(error?.message);
		}
	};

	useEffect(() => {
		console.log("🚀 ~ ChecklistItemsForm ~ hasAnyValue:", hasAnyValue);

		onAnyFilled(hasAnyValue);
	}, [hasAnyValue]);

	useEffect(() => {
		console.log("🚀 ~ ChecklistItemsForm ~ isValid:", isValid);
		onValid(isValid);
	}, [isValid, onValid]);

	const gridClass = "grid grid-cols-[4fr_2fr_2fr_2fr_2fr] items-center";

	if (isItemsLoading) {
		return (
			<div className="w-full h-100 skeleton flex justify-center items-center">
				<span className="loading loading-spinner"></span>
			</div>
		);
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex-1 flex flex-col justify-between overflow-hidden"
		>
			{isAllDone && (
				<div
					role="alert"
					className="text-success-content bg-success mt-2 p-1 alert alert-outline alert-success"
				>
					<TbAlertCircle className="w-6 h-6" />
					All Items on this checklist are already done
				</div>
			)}
			<div className="overflow-y-auto min-h-0 flex-1">
				<div className={clsx(gridClass, "mt-4 mb-2 font-semibold")}>
					<div>Items to be checked</div>
					<div>Criteria</div>
					<div>Status</div>
					<div>Remarks</div>
					<div className="opacity-50 text-right">Checked Status</div>
				</div>
				<div>
					{fields.map((field, index) => {
						// const isDisabled = !items[index].is_due;
						const isDisabled = false;
						const name = items[index]?.name;
						const scheduleName = items[index]?.schedule_name;
						const inputType = items[index]?.input_type;
						const allowedValues = items[index]?.allowed_values;
						const criteria = items[index]?.criteria;
						const checkedAt = items[index]?.checked_at;
						const createdBy = items[index]?.created_by;
						const verifiedBy = items[index]?.verified_by;
						const hasNoSchedule = Boolean(items[index]?.is_no_schedule);
						console.log(
							"🚀 ~ ChecklistItemsForm ~ hasNoSchedule:",
							hasNoSchedule,
						);
						const isDue = items[index]?.is_due && !hasNoSchedule;

						return (
							<div
								className={clsx(gridClass, { "bg-base-200": index % 2 === 0 })}
								key={field.id}
							>
								<label className="flex flex-col py-1">
									<span>{name}</span>
									<span className="text-xs opacity-75">{scheduleName}</span>
								</label>

								<div className="">
									<span className="">{criteria}</span>
								</div>

								{/* hidden but submitted */}
								<input
									className="input bg-transparent"
									type="hidden"
									{...register(`items.${index}.checklist_item_id`)}
								/>

								{inputType === "select" ? (
									(() => {
										const popoverId = `popover-item-${index}`;
										const anchorName = `--anchor-item-${index}`;
										const watchedStatus = watchItems[index]?.item_status;

										return (
											<div className="relative">
												<button
													type="button"
													disabled={isDisabled}
													popoverTarget={popoverId}
													style={{ anchorName }}
													className="btn btn-sm border-0 w-full text-left"
												>
													{watchedStatus || (
														<span className="opacity-40">Select...</span>
													)}
												</button>

												<ul
													id={popoverId}
													popover="auto"
													style={{ positionAnchor: anchorName }}
													className="dropdown menu rounded-box bg-base-100 shadow-sm z-50 not-[&:popover-open]:hidden"
												>
													{(Array.isArray(allowedValues)
														? allowedValues
														: JSON.parse(allowedValues || "[]")
													).map((val) => (
														<li key={val}>
															<a
																onClick={() => {
																	setValue(`items.${index}.item_status`, val);
																	document
																		.getElementById(popoverId)
																		?.hidePopover?.();
																}}
															>
																{val}
															</a>
														</li>
													))}
												</ul>
											</div>
										);
									})()
								) : (
									<input
										disabled={isDisabled}
										className="input bg-transparent"
										type={inputType === "number" ? "number" : "text"}
										step={inputType === "number" ? "any" : undefined}
										{...register(`items.${index}.item_status`)}
									/>
								)}

								<input
									disabled={isDisabled}
									className="input bg-transparent"
									{...register(`items.${index}.remarks`, {})}
								/>

								<div className="flex flex-col text-[10px]">
									<div className="flex gap-1 justify-end">
										<div className="opacity-50 ">
											{formatTimestamp(checkedAt)}
										</div>

										<div className="">
											{!!isDue && <span className="text-yellow-600">due</span>}
											{!isDue && !!hasNoSchedule && (
												<span className="opacity-50">no schedule</span>
											)}
											{!isDue && !hasNoSchedule && (
												<FaCheckCircle className="text-green-600" />
											)}
										</div>

										{errors.items?.[index]?.item_status && (
											<p className="text-warning">
												{errors.items[index]?.item_status.message}
											</p>
										)}
										{errors.items?.[index]?.remarks && (
											<p className="text-warning">
												{errors.items[index]?.remarks.message}
											</p>
										)}
									</div>
									<div className="text-right  opacity-75 flex justify-end gap-1">
										<span>{createdBy?.FIRSTNAME || "unknown"}</span>
										<span className="opacity-50">|</span>
										<span>{verifiedBy?.FIRSTNAME || "unknown"}</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{checklist?.instruction && (
				<div>
					<div className="font-semibold">Instruction</div>
					<div className="mt-2">{checklist?.instruction}</div>
				</div>
			)}

			<div className="flex flex-col w-full shrink-0">
				<div className="font-semibold">Remarks</div>
				<textarea
					className="mt-2 textarea w-full"
					{...register("notes", {
						maxLength: {
							value: 500,
							message: "Maximum 500 characters",
						},
					})}
				/>

				{errorMessage && (
					<div className="text-error p-1 border border-error mt-1">
						<GoAlert /> {errorMessage}
					</div>
				)}

				<button
					className="btn btn-primary mt-4"
					type="submit"
					disabled={isLoading}
				>
					Submit
				</button>
			</div>
		</form>
	);
}
