import { useMutation } from "@/Hooks/useMutation";
import clsx from "clsx";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function ChemicalSDSForm({
	chemicals = [],
	isLoadingChemicals,
	onSubmit: onSubmitProp,
}) {
	const { mutate, isLoading, errorMessage } = useMutation();

	const {
		register,
		control,
		handleSubmit,
		watch,
		formState: { isValid },
	} = useForm({
		defaultValues: {
			items: chemicals.map((chem) => ({
				chemical_id: chem.id,
				status: "updated",
				remarks: "",
			})),
			notes: "",
		},
	});

	const { fields } = useFieldArray({ control, name: "items" });
	const watchItems = watch("items");

	const hasAnyValue = watchItems.some((item) => item.status);

	const onSubmit = async (data) => {
		try {
			await mutate(route("api.chemical-sds-result.recordResult"), {
				body: {
					notes: data.notes,
					items: data.items,
				},
			});
			toast.success("SDS checklist submitted successfully!");
			if (onSubmitProp) onSubmitProp();
		} catch (err) {
			toast.error(err?.message || "Error submitting SDS checklist");
		}
	};

	if (isLoadingChemicals) {
		return (
			<div className="skeleton h-32 w-full flex justify-center items-center">
				Loading...
			</div>
		);
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex h-[90%] w-full flex-col gap-2"
		>
			<div className="overflow-y-scroll w-full h-200 gap-10">
				<div className="grid z-10 py-2 bg-base-100 grid-cols-3 sticky top-0 font-semibold">
					<div>Chemical</div>
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
							{chemicals[index].name}
						</div>
						<div className="flex gap-4">
							<label
								className={`btn btn-primary transition-opacity ${
									watch(`items.${index}.status`) === "updated"
										? "opacity-100 btn-primary"
										: "opacity-50 btn-outline"
								}`}
							>
								<input
									type="radio"
									className="hidden"
									value="updated"
									{...register(`items.${index}.status`, { required: true })}
								/>
								Updated
							</label>

							<label
								className={`btn transition-opacity ${
									watch(`items.${index}.status`) === "obsolete"
										? "opacity-100 btn-primary"
										: "opacity-50 btn-outline"
								}`}
							>
								<input
									type="radio"
									className="hidden"
									value="obsolete"
									{...register(`items.${index}.status`, { required: true })}
								/>
								Obsolete
							</label>
						</div>

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
