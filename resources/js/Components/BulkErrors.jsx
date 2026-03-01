import { useId } from "react";

export default function BulkErrors({ errors }) {
	if (!errors || Object.keys(errors).length === 0) return null;

	const id = useId();

	const openModal = () => {
		document.getElementById(id)?.showModal();
	};

	return (
		<>
			<button type="button" className="btn btn-error" onClick={openModal}>
				{Object.keys(errors).length} Error/s (click to view)
			</button>

			<dialog id={id} className="modal">
				<div className="modal-box max-h-[70vh] overflow-y-auto">
					<h3 className="font-bold text-lg text-red-700 mb-2">
						{Object.keys(errors).length} Error/s
					</h3>

					<div className="space-y-4">
						{Object.entries(errors).map(([rowId, columnErrors]) => (
							<div key={rowId}>
								<p className="font-medium text-red-700">Row ID: {rowId}</p>

								<div className="ml-3 space-y-2">
									{Object.entries(columnErrors).map(([column, messages]) => (
										<div key={column}>
											<p className="text-sm font-semibold text-red-600">
												{column}
											</p>
											<ul className="list-disc list-inside space-y-1">
												{messages.map((msg, idx) => (
													<li key={idx}>{msg}</li>
												))}
											</ul>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>

				<form method="dialog" className="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
		</>
	);
}
