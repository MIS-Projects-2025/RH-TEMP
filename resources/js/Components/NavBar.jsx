import { Link, usePage, router } from "@inertiajs/react";
import { useState } from "react";

export default function NavBar() {
    const { emp_data } = usePage().props;

    const logout = () => {
        const token = localStorage.getItem("authify-token");
        localStorage.removeItem("authify-token");
        router.get(route("logout"));
        window.location.href = `http://192.168.2.221/authify/public/logout?key=${encodeURIComponent(
            token
        )}&redirect=${encodeURIComponent(route("dashboard"))}`;
    };

    return (
        <nav className="">
            <div className="px-4 mx-auto sm:px-6 lg:px-8">
                <div className="flex justify-end h-[50px] ">
                    <div className="items-center hidden mr-5 space-x-1 font-semibold md:flex">
                        <div className="dropdown dropdown-end">
                            <div
                                tabIndex={0}
                                role="button"
                                className="flex items-center m-1 space-x-2 cursor-pointer select-none"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="size-6"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span className="mt-[3px]">
                                    Hello, {emp_data?.emp_firstname}
                                </span>
                            </div>

                            <ul
                                tabIndex={0}
                                className="p-2 shadow-md dropdown-content menu bg-base-100 rounded-box z-1 w-52"
                            >
                                <li>
                                    <a href={route("profile.index")}>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.5"
                                            stroke="currentColor"
                                            className="w-5 h-5 size-6"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                            />
                                        </svg>

                                        <span className="mt-[3px]">
                                            Profile
                                        </span>
                                    </a>
                                </li>
                                <li>
                                    <button onClick={logout}>
                                        <svg
                                            className="w-5 h-5 size-6"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.5"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                                            />
                                        </svg>
                                        <span className="mt-[3px]">
                                            Log out
                                        </span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
