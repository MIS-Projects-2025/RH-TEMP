import ChemicalSDSForm from "@/Components/ChemicalSDSMonitoringForm";
import { usePage } from "@inertiajs/react";
import React from "react";

const PerformChemicalSDSPage = () => {
	const { chemicals: serverChemicals } = usePage().props;

	const onSubmit = (data) => {
		console.log(data);
	};

	return (
		<div className="flex w-full h-[calc(100vh-100px)] flex-col gap-4 relative p-1 shadow-lg">
			<h1 className="font-bold">Perform Chemical SDS Today</h1>
			<ChemicalSDSForm
				chemicals={serverChemicals}
				isLoadingChemicals={false}
				onSubmit={onSubmit}
			/>
		</div>
	);
};

export default PerformChemicalSDSPage;
