import { diffWords } from "diff";
import { FaArrowRight } from "react-icons/fa";

export default function ChangeReviewModal({
	modalID,
	changes,
	onClose,
	onSave,
	isLoading,
}) {
	const groupedChanges = changes.reduce((acc, change) => {
		if (!acc[change.rowId]) acc[change.rowId] = [];
		acc[change.rowId].push(change);
		return acc;
	}, {});

	return (
		<dialog id={modalID} className="modal">
			<div className="modal-box w-11/12 max-w-5xl">
				<h2 className="text-center text-lg divider m-0 font-semibold mb-4">
					Review Changes
				</h2>

				<div className="space-y-2 max-h-[70vh] overflow-y-auto">
					<li className="flex p-3 justify-between  items-center rounded ">
						<span className="font-medium w-4/12">Keyfield</span>
						<div className="flex items-center gap-2 w-8/12">
							<span className="text-right w-1/2">Original</span>
							<span>
								<FaArrowRight className="opacity-0" />
							</span>
							<span className="text-green-500 text-left w-1/2">After</span>
						</div>
					</li>
					{Object.entries(groupedChanges).map(([rowId, rowChanges]) => {
						const hasIsNew = rowChanges.some(c => c?.field === "isNew");

						return (
							<div
								key={rowId}
								className={`border border-base-content/25 p-3 ${
									hasIsNew ? "bg-yellow-100/25" : ""
								}`}
							>
								<div className="font-medium mb-2 flex items-center gap-2">Row ID: {rowId}
									{hasIsNew && <span className="badge font-light badge-soft bg-yellow-300/20 border-yellow-300/50">new</span>}
								</div>
								<ul className="space-y-1">
									{rowChanges.map((c, idx) => {
										if (c?.field === "isNew") return null;

										return (<li
											key={`${idx}-${c.field}-${c.before}-${c.after}`}
											className="flex bg-base-300/75 justify-between items-center"
										>
											<span className="font-medium w-4/12">{c.field}</span>
											<div className="flex justify-between gap-2 w-8/12">
												<span className="text-right w-1/2">
													<KeyValueRenderer data={c.before} beforeData={c.before} />
												</span>
												<span>
													<FaArrowRight className="opacity-50" />
												</span>
												<span className="text-left w-1/2">
													<KeyValueRenderer data={c.after} beforeData={c.before} />
												</span>
											</div>
										</li>)
									})}
								</ul>
							</div>
						);
					})}
				</div>

				<div className="mt-4 flex justify-end space-x-2">
					<button
						type="button"
						className="btn px-4 py-2 btn-secondary btn-outline"
						onClick={onClose}
					>
						Cancel
					</button>
					<button
						type="button"
						className="btn px-4 py-2 btn-primary"
						onClick={onSave}
						disabled={isLoading}
					>
						{isLoading && <span className="loading loading-spinner"></span>}
						<span className="pl-1">Save Changes</span>
					</button>
				</div>
			</div>

			<form method="dialog" className="modal-backdrop">
				<button>close</button>
			</form>
		</dialog>
	);
}

function highlightDiff(before, after) {
	if (!before) before = "";
	if (!after) after = "";

	before = before.toString();
	after = after.toString();

	const diffs = diffWords(before, after);
	return (
		<>
			{diffs.map((part, i) => {
				if (part.added) {
					return (
						<span
							key={i}
							className="border border-green-200 text-green-600 bg-green-200/20"
						>
							{part.value}
						</span>
					);
				} else if (part.removed) {
					return (
						<span
							key={i}
							className="border border-red-200 text-red-300 bg-red-200/20 opacity-75"
						>
							{part.value}
						</span>
					);
				} else {
					return <span key={i}>{part.value}</span>;
				}
			})}
		</>
	);
}

function KeyValueRenderer({ data, beforeData = null, indent = 0 }) {
	const indentationClass = `ml-${indent * 4}`;

	if (data === null || data === undefined)
		return (
			<div className="text-base-content font-extralight opacity-50">empty</div>
		);

	if (typeof data === "object" && !Array.isArray(data)) {
		return (
			<div>
				{Object.entries(data).map(([key, value]) => {
					const beforeValue = beforeData?.[key] ?? null;
					return (
						<div key={key} className={`${indentationClass} mb-1`}>
							{typeof value === "object" && value !== null ? (
								<div>
									<div className="text-left opacity-75">{key}:</div>
									<KeyValueRenderer
										data={value}
										beforeData={beforeValue}
										indent={indent + 1}
									/>
								</div>
							) : (
								<div className="flex justify-between">
									<span className="opacity-75">{key}</span>
									<span>{highlightDiff(beforeValue ?? "", value ?? "")}</span>
								</div>
							)}
						</div>
					);
				})}
			</div>
		);
	}

	if (Array.isArray(data)) {
		return (
			<div>
				{data.map((item, index) => (
					<KeyValueRenderer
						key={index}
						data={item}
						beforeData={Array.isArray(beforeData) ? beforeData[index] : null}
						indent={indent}
					/>
				))}
			</div>
		);
	}

	return <>{highlightDiff(beforeData ?? "", data)}</>;
}
