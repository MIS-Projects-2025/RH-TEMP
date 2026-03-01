import { useMutation } from "@/Hooks/useMutation";
import clsx from "clsx";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function RestroomMonitoringForm({
	restroomId,
	fixtures = [],
	onSubmit: onSubmitProp,
}) {
	console.log("🚀 ~ RestroomMonitoringForm ~ fixtures:", fixtures)
	const { mutate, isLoading, errorMessage } = useMutation();

	const {
		register,
		control,
		handleSubmit,
		watch,
		reset,
		formState: { isValid },
	} = useForm({
		defaultValues: {
			items: fixtures.map((fixture) => ({
				fixture_id: fixture.id,
				status: "",
				remarks: "",
			})),
			notes: "",
		},
	});

	const { fields } = useFieldArray({ control, name: "items" });
	console.log("🚀 ~ RestroomMonitoringForm ~ fields:", fields)
	const watchItems = watch("items");

	const hasAnyValue = watchItems.some((item) => item.status);

	const onSubmit = async (data) => {
		try {
			await mutate(route("api.restroom-monitoring-result.recordResult"), {
				body: {
					notes: data.notes,
					items: data.items,
					restroom_id: restroomId
				},
			});
			toast.success("Restroom checklist submitted successfully!");
			if (onSubmitProp) onSubmitProp();
		} catch (err) {
			toast.error(err?.message || "Error submitting SDS checklist");
		}
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex h-[90%] w-full flex-col gap-2"
		>
			<div className="overflow-y-scroll w-full h-200 gap-10">
				<div className="grid z-10 py-2 bg-base-100 grid-cols-3 sticky top-0 font-semibold">
					<div>Fixtures</div>
					<div>Status</div>
					<div>Remarks</div>
				</div>

				{fields.map((field, index) => (
					<div
						key={field.id}
						className={clsx("grid grid-cols-3 gap-2 items-center", {
							"bg-base-100": index % 2 === 0,
						})}
					>
						<div
							className={clsx("transition-colors", {
								"text-error font-semibold":
									watch(`items.${index}.status`) === "obsolete",
							})}
						>
							{fixtures[index]?.fixture_name}
						</div>

						<input
							type="text"
							value={watch(`items.${index}.status`)}
							{...register(`items.${index}.status`, { required: true })}
						/>

						<input
							type="text"
							className="input w-full"
							{...register(`items.${index}.remarks`)}
						/>
					</div>
				))}
			</div>

			{errorMessage && (
				<div className="text-red-600 p-2 border border-red-500">
					{errorMessage}
				</div>
			)}

			<div className="flex items-center gap-2">
				<input
					type="text"
					className="input w-full"
					{...register("notes")}
					placeholder="Notes"
				/>
			</div>

			<button
				type="submit"
				className="btn btn-primary mt-4"
				disabled={isLoading || !hasAnyValue || !isValid}
			>
				Submit
			</button>
		</form>
	);
}
