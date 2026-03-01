import React, { useState } from "react";
import { FaSave } from "react-icons/fa";
import { router, usePage } from "@inertiajs/react";
import { useMutation } from "@/Hooks/useMutation";
import { useToast } from "@/Hooks/useToast";

const ChemicalUpsert = () => {
    const toast = useToast();
    const { toBeEdit } = usePage().props;
    const isEdit = !!toBeEdit;

    const [id, setID] = useState(toBeEdit?.id || "");
    const [name, setName] = useState(toBeEdit?.name || "");
    const [description, setDescription] = useState(
        toBeEdit?.description || null
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
            id: id,
            name: name,
            description: description,
        };

        const url = isEdit
            ? route("api.chemicals.update", {
                  id: toBeEdit.id,
              })
            : route("api.chemicals.add");

        const method = isEdit ? "PATCH" : "POST";

        try {
            const response = await mutate(url, {
                method,
                body: formData,
            });

            toast.success(
                isEdit
                    ? "Entry updated successfully!"
                    : "Entry created successfully!"
            );

            router.visit(route("chemicals.index"));
        } catch (err) {
            console.error("Upsert failed:", err.message);
            toast.error(err.message);
        }
    };

    const handleReset = () => {
        setID("");
        setName("");
        setDescription("");
    };

    return (
        <>
            <h1 className="text-base font-bold">
                {isEdit ? "Edit Entry" : "Add New Entry"}
            </h1>
            <div>
                <form
                    onSubmit={handleUpsert}
                    className="max-w-lg p-4 space-y-4 rounded-lg"
                    method="POST"
                >
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Name</legend>
                        <input
                            type="text"
                            className="input"
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            required
                        />
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            Description (optional)
                        </legend>
                        <textarea
                            className="textarea"
                            placeholder="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                    </fieldset>

                    {/* Buttons */}
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
                            {isEdit ? "Edit" : "Add"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default ChemicalUpsert;
