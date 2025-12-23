import { usePage } from "@inertiajs/react";
import { MdOutlinePersonOutline } from "react-icons/md";
import { MdLogout } from "react-icons/md";

export default function NavBar() {
    const { emp_data } = usePage().props;

    const logout = () => {
        localStorage.clear();
        sessionStorage.clear();

        window.location.href = route("logout");
    };

    return (
        <nav className="">
            <div className="px-4">
                <div className="flex justify-end h-12.5">
                    <div className="items-center space-x-1 font-semibold md:flex">
                        <div className="dropdown dropdown-end">
                            <div
                                tabIndex={0}
                                role="button"
                                className="btn btn-sm"
                            >
                                Hello, {emp_data?.emp_firstname}
                            </div>
                            <ul
                                tabIndex="-1"
                                className="dropdown-content menu bg-base-100 z-1 w-52 p-2 shadow-sm"
                            >
                                <li className="flex flex-row">
                                    <a
                                        className="w-full"
                                        href={route("profile.index")}
                                    >
                                        <MdOutlinePersonOutline className="w-6 h-6 text-content" />
                                        Profile
                                    </a>
                                </li>
                                <li className="flex flex-row">
                                    <a className="w-full" onClick={logout}>
                                        <MdLogout className="w-6 h-6 text-content" />
                                        Log out
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
