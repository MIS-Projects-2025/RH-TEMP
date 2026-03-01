import React, { useState } from "react";
import { FaSave } from "react-icons/fa";
import { router, usePage } from "@inertiajs/react";
import { useMutation } from "@/Hooks/useMutation";
import { useToast } from "@/Hooks/useToast";

const LocationUpsert = () => {
    const toast = useToast();
    const { selectedRawPackage: selectedLocation } = usePage().props;
    const isEdit = !!selectedLocation;

    const [location, setLocation] = useState(
        selectedLocation?.location_name || ""
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
            location_name: location,
        };

        const url = isEdit
            ? route("api.locations.update", {
                  id: selectedLocation.id,
              })
            : route("api.locations.store");

        const method = isEdit ? "PATCH" : "POST";

        try {
            const response = await mutate(url, {
                method,
                body: formData,
            });

            toast.success(
                isEdit
                    ? "Location updated successfully!"
                    : "Location created successfully!"
            );

            router.visit(route("locations.index"));
        } catch (err) {
            console.error("Upsert failed:", mutateErrorMessage);
            toast.error(err.message);
        }
    };

    const handleReset = () => {
        setLocation("");
    };

    return (
        <>
            <h1 className="text-base font-bold">
                {isEdit ? "Edit Location" : "Add New Location"}
            </h1>
            <div>
                <form
                    onSubmit={handleUpsert}
                    className="max-w-lg p-4 space-y-4 rounded-lg"
                    method="POST"
                >
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Location</legend>
                        <input
                            type="text"
                            className="w-64 input input-bordered"
                            placeholder="Type Location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required
                        />
                        <p className="label">e.g. Australia</p>
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
                            {isEdit ? "Edit Location" : "Add Location"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default LocationUpsert;
