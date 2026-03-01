import React, { useState } from "react";
import { FaSave } from "react-icons/fa";
import { router, usePage } from "@inertiajs/react";
import { useMutation } from "@/Hooks/useMutation";
import { useToast } from "@/Hooks/useToast";
import MultiSelectSearchableDropdown from "@/Components/MultiSelectSearchableDropdown";
import { useFetch } from "@/Hooks/useFetch";

const ChemicalSDSUpsert = () => {
    const toast = useToast();
    const { toBeEdit } = usePage().props;
    const isEdit = !!toBeEdit;

    const [id, setID] = useState(toBeEdit?.id || "");
    const [chemicalID, setChemicalID] = useState(toBeEdit?.name || "");
    const [remarks, setRemarks] = useState(toBeEdit?.remarks || null);

    const {
        mutate,
        isLoading: isMutateLoading,
        errorMessage: mutateErrorMessage,
        cancel: mutateCancel,
    } = useMutation();

    const {
        data: chemicals,
        isLoading: isLoadingChemicals,
        errorMessage: errorMessageChemicals,
        errorData: errorDataChemicals,
        cancel: cancelChemicals,
        fetch: fetchChemicals,
    } = useFetch(route("api.chemicals.index"));

    // todo jan 2 continue chemical fetching
    console.log("🚀 ~ ChemicalSDSUpsert ~ chemicals:", chemicals);

    const handleUpsert = async (e) => {
        e.preventDefault();

        const formData = {
            id: id,
            chemical_id: chemicalID,
            check_date: new Date(), // today
            remarks: remarks,
        };

        const url = isEdit
            ? route("api.chemicals-sds.update", {
                  id: toBeEdit.id,
              })
            : route("api.chemicals-sds.add");

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

            router.visit(route("chemicals-sds.index"));
        } catch (err) {
            console.error("Upsert failed:", err.message);
            toast.error(err.message);
        }
    };

    const handleReset = () => {
        setID("");
        setChemicalID("");
        setRemarks("");
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
                        <legend className="fieldset-legend">Chemical</legend>
                        <input
                            type="text"
                            className="input"
                            onChange={(e) => setChemicalID(e.target.value)}
                            value={chemicalID}
                            required
                        />
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            Package Name
                        </legend>

                        <MultiSelectSearchableDropdown
                            options={
                                chemicals?.map((packageName) => ({
                                    value: packageName.package_name,
                                    label: null,
                                })) || []
                            }
                            onChange={(value) => {
                                setPackageName(value[0]);
                            }}
                            defaultSelectedOptions={
                                packageName ? [packageName] : []
                            }
                            isLoading={isLoadingPackageNames}
                            itemName="Package List"
                            prompt="Select packages"
                            contentClassName="w-52 h-50"
                            singleSelect
                        />
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Check Date</legend>
                        <input
                            type="datetime-local"
                            className="input"
                            disabled
                            value={date}
                            required
                        />
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            Remarks (optional)
                        </legend>
                        <textarea
                            className="textarea"
                            placeholder="Remarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
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

export default ChemicalSDSUpsert;
