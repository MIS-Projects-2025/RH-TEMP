// Modal.jsx
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const Modal = forwardRef(
	(
		{
			id,
			title = "Modal Title",
			buttonText = "",
			children,
			buttonClass = "",
			className = "",
			onClose = () => {},
		},
		ref,
	) => {
		const modalRef = useRef(null);

		useImperativeHandle(ref, () => ({
			open: () => modalRef.current?.showModal(),
			close: () => modalRef.current?.close(),
		}));

		return (
			<>
				{buttonText && (
					<button
						type="button"
						className={buttonClass}
						onClick={() => modalRef.current?.showModal()}
					>
						{buttonText}
					</button>
				)}

				<dialog id={id} className="modal" ref={modalRef} onClose={onClose}>
					<div
						className={`border border-base-content/20 modal-box ${className}`}
					>
						<form method="dialog">
							<button
								type="button"
								className="absolute btn btn-sm btn-circle btn-ghost right-2 top-2"
								onClick={() => {
									modalRef.current?.close();
									onClose();
								}}
							>
								✕
							</button>
						</form>

						{title && <h3 className="text-base font-bold">{title}</h3>}

						<div>
							{typeof children === "function" ? children(modalRef) : children}
						</div>
					</div>

					<form method="dialog" className="modal-backdrop">
						<button>close</button>
					</form>
				</dialog>
			</>
		);
	},
);

export default Modal;
