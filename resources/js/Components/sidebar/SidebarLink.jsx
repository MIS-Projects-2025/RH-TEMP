import React from "react";
import { Link, usePage } from "@inertiajs/react";
import clsx from "clsx";
import { useThemeStore } from "@/Store/themeStore";
import { DARK_THEME_NAME } from "@/Constants/colors";
import { Tooltip } from "react-tooltip";

const SidebarLink = ({
    isIconOnly,
    href,
    label,
    icon,
    notifications = null,
    isSub = false,
}) => {
    const { appName } = usePage().props;

    const { theme } = useThemeStore();
    const currentPath = window.location.pathname.replace(`/${appName}`, "");

    const pathTo = new URL(href, window.location.origin).pathname.replace(
        `/${appName}`,
        ""
    );
    const firstSegmentFrom = currentPath.split("/")[1];
    const firstSegmentTo = pathTo.split("/")[1];
    const isActive = firstSegmentFrom === firstSegmentTo;

    const isDark = theme === DARK_THEME_NAME;

    const hoverColor = isDark ? "hover:bg-base-200" : "hover:bg-base-300";
    const tooltipID = `tooltip-${label.replace(" ", "-").toLowerCase()}`;
    return (
        <>
            {isIconOnly && (
                <Tooltip
                    anchorSelect={`#${tooltipID}`}
                    place="left"
                    content={label}
                    noArrow
                />
            )}
            <div className="w-full">
                <Link
                    id={tooltipID}
                    href={href}
                    className={clsx(
                        `relative flex h-8 items-center justify-between px-2 py-1 pl-2.5 transition-colors duration-150 `,
                        hoverColor,
                        isActive
                            ? isDark
                                ? "bg-base-200 text-primary"
                                : "bg-base-300 text-primary"
                            : ""
                    )}
                >
                    <div
                        className={clsx(
                            "absolute w-0.5 ml-1.85 h-8",
                            isActive ? "bg-primary" : "bg-base-300",
                            {
                                hidden: isIconOnly || !isSub,
                            }
                        )}
                    ></div>
                    <div
                        className={clsx(
                            "flex items-center gap-2",
                            isSub && !isIconOnly && "pl-3"
                        )}
                    >
                        <span className="w-5 h-5">{icon}</span>
                        <p className={clsx("pt-px", isIconOnly && "hidden")}>
                            {label}
                        </p>
                    </div>
                    {notifications && (
                        <div
                            className={clsx(
                                "absolute rounded-full badge p-0.5 badge-xs badge-accent",
                                "right-0",
                                isIconOnly && "top-0"
                            )}
                        >
                            {notifications >= 99 ? "99+" : notifications}
                        </div>
                    )}
                </Link>
            </div>
        </>
    );
};

export default SidebarLink;
