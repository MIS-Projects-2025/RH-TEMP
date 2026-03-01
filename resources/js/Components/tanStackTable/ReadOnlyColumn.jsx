const ReadOnlyColumns = ({ accessorKey, header, options = {}, formatter }) => ({
    accessorKey,
    header,
    ...options,
    cell: ({ getValue }) => {
        const value = getValue();
        const displayValue = formatter ? formatter(value) : value ?? "-";
        return (
            <span className="opacity-60 flex items-center cursor-not-allowed">
                {displayValue}
            </span>
        );
    },
});

export default ReadOnlyColumns;
