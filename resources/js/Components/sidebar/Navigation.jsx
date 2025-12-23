import Dropdown from "@/Components/sidebar/Dropdown";
import SidebarLink from "@/Components/sidebar/SidebarLink";
import { usePage } from "@inertiajs/react";
import {
    LuLayoutDashboard,
    LuListChecks,
    LuList,
    LuPackage,
} from "react-icons/lu";

export default function NavLinks({ isCollapse }) {
    const { emp_data } = usePage().props;
    return (
        <nav
            className="flex flex-col space-y-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
        >
            <SidebarLink
                href={route("dashboard")}
                label="Dashboard"
                icon={<LuLayoutDashboard className="w-full h-full" />}
                notifications={5}
                isIconOnly={isCollapse}
            />

            <Dropdown
                label="Dropdown"
                icon={<LuLayoutDashboard className="w-full h-full" />}
                links={[
                    {
                        href: route("admin"),
                        label: "Profile",
                        icon: <LuLayoutDashboard className="w-full h-full" />,
                    },
                    {
                        href: route("admin"),
                        label: "Account",
                        notification: 125,
                        icon: <LuLayoutDashboard className="w-full h-full" />,
                    },
                    {
                        href: route("dashboard"),
                        label: "No notifications",
                        icon: <LuLayoutDashboard className="w-full h-full" />,
                    },
                ]}
                isIconOnly={isCollapse}
                // notification={true}
            />

            <SidebarLink
                href={route("dashboard")}
                label="Dashboard"
                icon={<LuLayoutDashboard className="w-full h-full" />}
                notifications={5}
                isIconOnly={isCollapse}
            />

            <SidebarLink
                href={route("dashboard")}
                label="Dashboard"
                icon={<LuLayoutDashboard className="w-full h-full" />}
                notifications={5}
                isIconOnly={isCollapse}
            />

            {["superadmin", "admin"].includes(emp_data?.emp_system_role) && (
                <div>
                    <SidebarLink
                        href={route("admin")}
                        label="Administrators"
                        icon={<LuLayoutDashboard className="w-full h-full" />}
                        isIconOnly={isCollapse}
                        // notifications={5}
                    />
                </div>
            )}
        </nav>
    );
}
