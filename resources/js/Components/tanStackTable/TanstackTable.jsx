import React from "react";
import TableBody from "./TableBody";
import { TableHeader } from "./TableHeader";

const TanstackTable = ({ table, isTableLoading, height="480px" }) => {
    const tableContainerRef = React.useRef(null);

    return (
        <div
            className="container border border-base-300 my-2"
            ref={tableContainerRef}
            style={{
                overflow: "auto",
                position: "relative",
                height: height,
            }}
        >
            <table
                className="border border-base-300 w-fit"
                style={{ width: table.getCenterTotalSize() }}
            >
                <TableHeader table={table} />
                <TableBody
                    table={table}
                    tableContainerRef={tableContainerRef}
                    isTableLoading={isTableLoading}
                />
            </table>
        </div>
    );
};

export default TanstackTable;
