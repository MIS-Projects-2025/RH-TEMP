import clsx from "clsx";
import { useState } from "react";
import { FaTimesCircle } from "react-icons/fa";

const CancellableActionButton = ({
	abort,
	refetch,
	loading = false,
	disabled = false,
	loadingMessage = "Loading",
	buttonText = "Apply Filter",
	buttonClassName = "btn-primary",
}) => {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<button
			type="button"
			className={clsx(
				"btn relative overflow-hidden transition-all duration-300",
				loading ? "btn-secondary" : "",
				disabled && "opacity-50 cursor-not-allowed",
				loading && isHovered && "ring-error ring-4",
				buttonClassName,
			)}
			onClick={async () => {
				if (disabled) return;
				try {
					if (loading) {
							await abort();
					} else {
							await refetch();
					}
				} catch (err) {
					console.error(err);
				}
			}}
			disabled={disabled}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div className="flex gap-2 items-center relative h-5">
				<div
					className={clsx(
						"absolute left-0 right-0 flex items-center justify-center transition-all duration-400",
						loading
							? isHovered
								? "opacity-100 translate-y-0"
								: "opacity-0 -translate-y-full"
							: "opacity-0 -translate-y-full",
					)}
					style={{
						transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
					}}
				>
					<FaTimesCircle className="w-3 h-3 mr-1" /> cancel
				</div>

				<div
					className={clsx(
						"flex items-center justify-center transition-all duration-400",
						loading
							? isHovered
								? "opacity-0 translate-y-full"
								: "opacity-100 translate-y-0"
							: "translate-y-0",
					)}
				>
					{loading && (
						<span className="loading loading-spinner loading-xs mr-1"></span>
					)}
					{loading ? loadingMessage : buttonText}
				</div>
			</div>
		</button>
	);
};

export default CancellableActionButton;
