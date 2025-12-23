import React from "react";
import { Link } from "@inertiajs/react";
import { BiSolidErrorCircle } from "react-icons/bi";

export default function Forbidden() {
    return (
        <div className="flex flex-col text-center items-center justify-center h-180 my-auto px-6">
            <BiSolidErrorCircle className="text-9xl text-red-500" />
            <h1 className="text-[60pt] font-bold text-gray-800 dark:text-gray-100">
                403
            </h1>

            <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                Access denied.
            </p>

            <p className="text-lg">
                You don’t have permission to view this page.
            </p>

            <p>contact someone from the admin if you think this is a mistake</p>

            <Link
                href={route("dashboard")}
                className="inline-block px-6 py-2 mt-3 text-lg font-semibold text-secondary"
            >
                Go back
            </Link>
        </div>
    );
}
