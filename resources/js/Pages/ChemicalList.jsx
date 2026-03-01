import MaxItemDropdown from "@/Components/MaxItemDropdown";
import Modal from "@/Components/Modal";
import Pagination from "@/Components/Pagination";
import { useMutation } from "@/Hooks/useMutation";
import { useToast } from "@/Hooks/useToast";
import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import SearchInput from "./SearchInput";

const ChemicalList = () => {
	const toast = useToast();

	const {
		chemicals: serverChemicals,
		search: serverSearch,
		perPage: serverPerPage,
		totalEntries,
	} = usePage().props;

	console.group("🚀 ~ Chemicallist ~ serverUtilityTrash");
	console.log("🚀 ~ Chemicallist ~ serverUtilityTrash:", serverChemicals);
	console.log("🚀 ~ Chemicallist ~ serverSearch:", serverSearch);
	console.log("🚀 ~ Chemicallist ~ serverPerPage:", serverPerPage);
	console.log("🚀 ~ Chemicallist ~ totalEntries:", totalEntries);
	console.groupEnd();

	const deleteModalRef = useRef(null);
	const [searchInput, setSearchInput] = useState(serverSearch || "");

	const [maxItem, setMaxItem] = useState(serverPerPage || 10);
	const [selectedEntry, setSelectedEntry] = useState(null);

	const {
		mutate,
		isLoading: isMutateLoading,
		errorMessage: mutateErrorMessage,
		cancel: mutateCancel,
	} = useMutation();

	useEffect(() => {
		const timer = setTimeout(() => {
			router.reload({
				data: {
					search: searchInput,
					perPage: maxItem,
					page: 1,
				},
				preserveState: true,
				preserveScroll: true,
			});
		}, 700);

		return () => clearTimeout(timer);
	}, [searchInput]);

	const goToPage = (page) => {
		router.reload({
			data: {
				search: searchInput,
				perPage: maxItem,
				page,
			},
			preserveState: true,
			preserveScroll: true,
		});
	};

	const changeMaxItemPerPage = (maxItem) => {
		router.reload({
			data: {
				search: searchInput,
				perPage: maxItem,
				page: 1,
			},
			preserveState: true,
			preserveScroll: true,
		});
		setMaxItem(maxItem);
	};

	const refresh = () => {
		router.reload({
			data: {
				search: searchInput,
				perPage: maxItem,
				page: 1,
			},
			preserveState: true,
			preserveScroll: true,
		});
	};

	const handleDelete = async () => {
		try {
			await mutate(
				route("api.chemicals.delete", {
					id: selectedEntry.id,
				}),
				{
					method: "DELETE",
					body: {
						id: selectedEntry.id,
					},
				},
			);

			refresh();

			deleteModalRef.current.close();
			toast.success("Entry verified successfully!");
		} catch (error) {
			toast.error(mutateErrorMessage);
			console.error(error);
		}
	};

	return (
		<>
			<div className="w-full px-4">
				<div className="flex items-center justify-between text-center">
					<h1 className="text-base font-bold">Chemical List</h1>
					<Link href={route("chemicals.create")} className="btn btn-primary">
						<FaPlus /> Add New
					</Link>
				</div>

				<div className="flex items-center justify-between py-4">
					<div>
						<MaxItemDropdown
							maxItem={maxItem}
							changeMaxItemPerPage={changeMaxItemPerPage}
						/>
					</div>

					<SearchInput
						placeholder="search by emp id or reference no."
						initialSearchInput={searchInput}
						onSearchChange={setSearchInput}
					/>
				</div>

				<table className="table w-full table-auto table-xs">
					<thead>
						<tr>
							<th>ID</th>
							<th>Name</th>
							<th>Description</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{serverChemicals.data.map((entry) => (
							<tr key={entry.id}>
								<td>{entry.id}</td>
								<td>{entry.name || "-"}</td>
								<td>{entry.description || "-"}</td>
								<td className="flex flex-col lg:flex-row">
									<Link
										href={route("chemicals.edit", {
											id: entry.id,
										})}
										className="btn btn-ghost btn-sm btn-primary"
									>
										<FaEdit />
									</Link>
									{/* <a
										href="#"
										className="btn btn-ghost btn-sm text-error"
										onClick={() => {
											setSelectedEntry(entry);
											deleteModalRef.current.open();
										}}
									>
										<FaTrash />
									</a> */}
								</td>
							</tr>
						))}
					</tbody>
				</table>

				<Pagination
					links={serverChemicals?.links}
					currentPage={serverChemicals?.current_page}
					goToPage={goToPage}
					filteredTotal={serverChemicals?.total}
					overallTotal={totalEntries}
					start={serverChemicals?.from}
					end={serverChemicals?.to}
				/>
			</div>
			<Modal
				ref={deleteModalRef}
				id="deleteChemicalsEntryModal"
				title={`Delete ${selectedEntry?.name}`}
				onClose={() => deleteModalRef.current?.close()}
				className="max-w-lg"
			>
				<p className="px-2 pt-4">
					This action cannot be undone. Delete this entry?
				</p>

				<p
					className="p-2 border rounded-lg bg-error/10 text-error"
					style={{
						visibility: mutateErrorMessage ? "visible" : "hidden",
					}}
				>
					{mutateErrorMessage || "placeholder"}
				</p>

				<div className="flex justify-end gap-2 pt-4">
					<button
						type="button"
						className="btn btn-error"
						onClick={async () => {
							await handleDelete();
						}}
						disabled={isMutateLoading}
					>
						{isMutateLoading ? (
							<>
								<span className="loading loading-spinner"></span> Delete
							</>
						) : (
							"Confirm Delete"
						)}
					</button>

					<button
						type="button"
						className="btn btn-outline"
						onClick={() => deleteModalRef.current?.close()}
					>
						Cancel
					</button>
				</div>
			</Modal>
		</>
	);
};

export default ChemicalList;
