import { Link, usePage, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import Navigation from "@/Components/sidebar/Navigation";
import ThemeToggler from "@/Components/sidebar/ThemeToggler";
import { useThemeStore } from "@/Store/themeStore";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import clsx from "clsx";

export function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.innerWidth < breakpoint;
    });

    useEffect(() => {
        const onResize = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [breakpoint]);

    return isMobile;
}

export default function Sidebar() {
    const { display_name } = usePage().props;
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // for responsiveness
    const { theme, toggleTheme } = useThemeStore();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const isMobile = useIsMobile();

    const formattedAppName = display_name
        ?.split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    useEffect(() => {
        if (!isSidebarOpen) {
            setIsSidebarCollapsed(false);
        }
    }, [isSidebarOpen]);

    useEffect(() => {
        if (isMobile) {
            setIsSidebarCollapsed(false);
        } else {
            setIsSidebarOpen(true);
        }
    }, [isMobile]);

    return (
        <div
            className={clsx(
                "flex z-10 shadow-lg",
                isSidebarCollapsed ? "w-16" : "md:w-64"
            )}
        >
            {/* Mobile Hamburger */}
            <button
                className="btn absolute p-2 top-4 right-4 md:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                </svg>
            </button>

            <div
                className={`
                    fixed md:relative top-0 left-0 transition-transform transform
                    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    md:flex
                    flex-col min-h-screen w-62.5 space-y-6 px-4 pb-6 pt-4
                `}
                style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                }}
            >
                <div className={clsx("flex")}>
                    <Link
                        href={route("dashboard")}
                        className={clsx(
                            "flex-1 flex items-center pl-2.5 text-lg font-bold",
                            isSidebarCollapsed && "hidden"
                        )}
                    >
                        <p className="pt-0.5 pl-1">PPC Portal</p>
                    </Link>
                    <button
                        className={clsx("btn-square btn", isMobile && "hidden")}
                        onClick={() =>
                            setIsSidebarCollapsed(!isSidebarCollapsed)
                        }
                    >
                        {isSidebarCollapsed ? (
                            <GoSidebarCollapse className="w-6 h-6" />
                        ) : (
                            <GoSidebarExpand className="w-6 h-6" />
                        )}
                    </button>
                </div>
                <Navigation isCollapse={isSidebarCollapsed} />

                <ThemeToggler toggleTheme={toggleTheme} theme={theme} />
            </div>
        </div>
    );
}
