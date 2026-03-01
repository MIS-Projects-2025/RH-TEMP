import React, { useState } from "react";
import { FaSave } from "react-icons/fa";
import { router, usePage } from "@inertiajs/react";
import { useMutation } from "@/Hooks/useMutation";
import { useToast } from "@/Hooks/useToast";

const HazardousWasteUpsert = () => {
    const toast = useToast();
    const { hazardWasteToBeEdit } = usePage().props;
    console.log(
        "🚀 ~ HazardousWasteUpsert ~ hazardWasteToBeEdit:",
        hazardWasteToBeEdit
    );
    const isEdit = !!hazardWasteToBeEdit;

    const [referenceNumber, setReferenceNumber] = useState(
        hazardWasteToBeEdit?.reference_no || ""
    );
    const [date, setDate] = useState(hazardWasteToBeEdit?.date);
    const [requestor, setRequestor] = useState(
        hazardWasteToBeEdit?.requestor || null
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
            reference_no: referenceNumber,
            date: date,
            requestor: requestor,
        };

        const url = isEdit
            ? route("api.hazardous-log-sheet.update", {
                  reference_no: hazardWasteToBeEdit.reference_no,
              })
            : route("api.hazardous-log-sheet.add");

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

            router.visit(route("hazardous-log-sheet.index"));
        } catch (err) {
            console.error("Upsert failed:", err.message);
            toast.error(err.message);
        }
    };

    const handleReset = () => {
        setReferenceNumber("");
        setDate("");
        setRequestor("");
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
                        <legend className="fieldset-legend">
                            Reference No.
                        </legend>
                        <input
                            type="text"
                            className="w-64 input input-bordered"
                            placeholder="Type Referebce No."
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            required
                        />
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Date</legend>
                        <input
                            type="datetime-local"
                            className="input"
                            onChange={(e) => setDate(e.target.value)}
                            value={date}
                            required
                        />
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            Requestor Emp ID
                        </legend>
                        <input
                            type="text"
                            className="input input-bordered w-44"
                            placeholder="Type Body Size"
                            value={requestor}
                            onChange={(e) => setRequestor(e.target.value)}
                            required
                        />
                        <p className="label">166</p>
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

export default HazardousWasteUpsert;
