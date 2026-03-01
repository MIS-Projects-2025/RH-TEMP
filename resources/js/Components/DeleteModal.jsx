import Modal from "@/Components/Modal";
import React, { forwardRef } from "react";

const DeleteModal = forwardRef(
	(
		{
			id,
			title = "Are you sure?",
			message = "This action cannot be undone. Delete selected rows?",
			errorMessage,
			isLoading = false,
			onDelete,
			onClose,
		},
		ref,
	) => {
		return (
			<Modal
				ref={ref}
				id={id}
				title={title}
				onClose={onClose}
				className="max-w-lg"
			>
				<div className="px-2 pt-4">{message}</div>

				<p
					className="p-2 border rounded-lg bg-error/10 text-error mt-4"
					style={{ visibility: errorMessage ? "visible" : "hidden" }}
				>
					{errorMessage || "placeholder"}
				</p>

				<div className="flex justify-end gap-2 pt-4">
					<button
						type="button"
						className="btn btn-error"
						onClick={async () => {
							await onDelete();
						}}
						disabled={isLoading}
					>
						{isLoading ? (
							<>
								<span className="loading loading-spinner"></span> Deleting
							</>
						) : (
							"Confirm Delete"
						)}
					</button>

					<button className="btn btn-outline" onClick={onClose}>
						Cancel
					</button>
				</div>
			</Modal>
		);
	},
);

DeleteModal.displayName = "DeleteModal";

export default DeleteModal;
