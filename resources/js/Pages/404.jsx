import React from "react";
import { Link } from "@inertiajs/react";

export default function NotFound() {
    return (
        <div className="flex items-center justify-center h-188 px-6 bg-base-200">
            <div className="text-center">
                <h1 className="text-[60pt] font-bold text-base-content">404</h1>
                <p className="text-2xl font-bold text-base-content">
                    Page not found.
                </p>
                <p className="text-lg text-base-content">
                    Sorry, the page you are looking for doesn’t exist or has
                    been moved.
                </p>

                <Link
                    href={route("dashboard")}
                    className="inline-block px-6 py-2 mt-3 text-lg font-semibold text-blue-600"
                >
                    Go Back
                </Link>
            </div>
        </div>
    );
}
