import IndeterminateCheckbox from "../IndeterminateCheckbox";

const CheckBoxColumn = {
    id: "select",
    header: ({ table }) => {
        const rowModel = table?.getRowModel();
        if (!rowModel || !rowModel.rows) return null;

        return (
            <IndeterminateCheckbox
                checked={table.getIsAllRowsSelected()}
                indeterminate={table.getIsSomeRowsSelected()}
                onChange={table.getToggleAllRowsSelectedHandler()}
            />
        );
    },
    cell: ({ row }) => {
        if (!row) return null;

        return (
            <div className="items-center flex px-1">
                <IndeterminateCheckbox
                    checked={row.getIsSelected()}
                    disabled={!row.getCanSelect()}
                    indeterminate={row.getIsSomeSelected()}
                    onChange={row.getToggleSelectedHandler()}
                />
            </div>
        );
    },
    size: 40,
};

export default CheckBoxColumn;
