import clsx from "clsx";
import React from "react";
import { flexRender } from "@tanstack/react-table";

export const TableHeader = ({ table }) => {
    return (
        <thead
            className=""
            style={{
                display: "grid",
                position: "sticky",
                top: 0,
                zIndex: 1,
            }}
        >
            {table.getHeaderGroups().map((headerGroup) => (
                <tr
                    key={headerGroup.id}
                    className="flex w-fit h-7.5 bg-base-200 sticky top-0"
                >
                    {headerGroup.headers.map((header) => (
                        <th
                            key={header.id}
                            colSpan={header.colSpan}
                            style={{ width: header.getSize() }}
                            className={clsx(
                                "group relative h-7.5 px-1 py-0.5 text-left font-bold border-r border-b border-base-300"
                            )}
                        >
                            {header.isPlaceholder
                                ? null
                                : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                  )}

                            {/* Resizer */}
                            <div
                                onDoubleClick={() => header.column.resetSize()}
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                className={clsx(
                                    "absolute top-0 right-0 h-full w-1.25 cursor-col-resize select-none touch-none bg-secondary opacity-0 group-hover:opacity-100",
                                    "bg-secondary-500 opacity-100" ===
                                        header.column.getIsResizing()
                                )}
                                style={{
                                    transform: header.column.getIsResizing()
                                        ? `translateX(1 * ${
                                              table.getState().columnSizingInfo
                                                  .deltaOffset ?? 0
                                          }px)`
                                        : undefined,
                                }}
                            />
                        </th>
                    ))}
                </tr>
            ))}
        </thead>
    );
};
