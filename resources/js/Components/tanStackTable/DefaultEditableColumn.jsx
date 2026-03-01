import React from "react";

const DefaultEditableColumn = {
    cell: ({ getValue, row: { index }, column, table }) => {
        const initialValue = getValue() ?? "";
		const [value, setValue] = React.useState(initialValue);

        const onBlur = () => {
            // if (value === initialValue) return;
            table.options.meta?.updateData(
                index,
                column?.columnDef.accessorKey,
                value,
            );
        };

        React.useEffect(() => {
            setValue(initialValue);
        }, [initialValue]);

        return (
            <input
                value={value}
                className="w-full hover:ring hover:ring-primary"
                onChange={(e) => setValue(e.target.value)}
                onBlur={onBlur}
            />
        );
    },
};

export default DefaultEditableColumn;
