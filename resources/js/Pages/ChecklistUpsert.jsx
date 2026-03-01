import React, { useState } from "react";
import { FaSave } from "react-icons/fa";
import { router, usePage } from "@inertiajs/react";
import { useMutation } from "@/Hooks/useMutation";
import { useToast } from "@/Hooks/useToast";

const ChecklistUpsert = () => {
    const toast = useToast();
    const { selectedChecklist: selectedChecklist } = usePage().props;
    const isEdit = !!selectedChecklist;

    const [checklistName, setChecklistName] = useState(
        selectedChecklist?.name || ""
    );
    const [description, setDescription] = useState(
        selectedChecklist?.description || ""
    );
    const [formControlNo, setFormControlNo] = useState(
        selectedChecklist?.form_control_no || ""
    );

    const {
        mutate,
        isLoading: isMutateLoading,
        errorMessage: mutateErrorMessage,
        cancel: mutateCancel,
    } = useMutation();

    const handleUpsert = async (e) => {
        e.preventDefault();

        const formData = {
            name: checklistName,
            description: description,
        };

        const url = isEdit
            ? route("api.checklists.update", {
                  id: selectedChecklist.id,
              })
            : route("api.checklists.add");

        const method = isEdit ? "PATCH" : "POST";

        try {
            const response = await mutate(url, {
                method,
                body: formData,
            });

            toast.success(
                isEdit
                    ? "Checklist updated successfully!"
                    : "Checklist created successfully!"
            );

            router.visit(route("checklist-items.index"));
        } catch (err) {
            console.error("Upsert failed:", mutateErrorMessage);
            toast.error(err.message);
        }
    };

    const handleReset = () => {
        setChecklistName("");
    };

    return (
        <>
            <h1 className="text-base font-bold">
                {isEdit ? "Edit Checklist" : "Add New Checklist"}
            </h1>
            <div>
                <form
                    onSubmit={handleUpsert}
                    className="max-w-lg p-4 space-y-4 rounded-lg"
                    method="POST"
                >
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            Checklist Name
                        </legend>
                        <input
                            type="text"
                            className="w-64 input input-bordered"
                            placeholder="Type Checklist Name"
                            value={checklistName}
                            onChange={(e) => setChecklistName(e.target.value)}
                            required
                        />
                        <p className="label">e.g. "Home", "Office", etc</p>
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Description</legend>
                        <input
                            type="text"
                            className="w-64 input input-bordered"
                            placeholder="Type Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                        <p className="label">optional</p>
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            Form Control No.
                        </legend>
                        <input
                            type="text"
                            className="w-64 input input-bordered"
                            placeholder="Type Form Control No."
                            value={formControlNo}
                            onChange={(e) => setFormControlNo(e.target.value)}
                            required
                        />
                        <p className="label">optional</p>
                    </fieldset>

                    <div className="flex mt-4 space-x-2">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="btn btn-outline btn-error"
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isMutateLoading}
                        >
                            {isMutateLoading ? (
                                <span className="loading loading-spinner"></span>
                            ) : (
                                <FaSave />
                            )}
                            {isEdit ? "Edit Checklist" : "Add Checklist"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default ChecklistUpsert;
