import clsx from "clsx";

const Pagination = ({
	showMeta = true,
	links,
	currentPage = 1,
	goToPage,
	filteredTotal = 0,
	overallTotal = 0,
	start = 0,
	end = 0,
	contentClassName = "bg-base-300",
}) => {
	return (
		<div
			className={clsx(
				"flex justify-between items-center w-full mt-4 sticky -bottom-8 inset-shadow-lg px-2 py-px",
				contentClassName,
			)}
		>
			{showMeta && (
				<div className="content-center my-2 sticky left-0 text-sm text-base-content/50">
					{`Showing ${start ?? 0} to ${
						end ?? 0
					} of ${filteredTotal.toLocaleString()} entries`}
					{overallTotal && overallTotal !== filteredTotal
						? ` (filtered from ${overallTotal.toLocaleString()} total entries)`
						: ""}
				</div>
			)}
			<div className="join sticky right-0 flex flex-wrap gap-1">
				{links?.map((link, index) => {
					const page = link.url
						? parseInt(new URL(link.url).searchParams.get("page"))
						: currentPage;

					return (
						<button
							type="button"
							key={index}
							className={`join-item btn btn-ghost btn-sm p-2 ${
								link.active || (page === currentPage && link.label !== "...")
									? "text-primary border-b-primary border-b-2"
									: "border-none"
							}`}
							dangerouslySetInnerHTML={{
								__html: link.label,
							}}
							onClick={(e) => {
								e.preventDefault();
								if (!link.url) return;
								goToPage(page);
							}}
							disabled={!link.url}
						/>
					);
				})}
			</div>
		</div>
	);
};

export default Pagination;
