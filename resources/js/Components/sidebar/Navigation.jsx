import Dropdown from "@/Components/sidebar/Dropdown";
import SidebarLink from "@/Components/sidebar/SidebarLink";
import { usePage } from "@inertiajs/react";
import { BiCalendar, BiTask } from "react-icons/bi";
import {
	FaCheckCircle,
	FaFileAlt,
	FaListAlt,
	FaTools,
	FaTrash,
} from "react-icons/fa";
import { FaBiohazard, FaCubes, FaLocationDot, FaPlay } from "react-icons/fa6";
import { GiChemicalDrop } from "react-icons/gi";
import { GrRestroom } from "react-icons/gr";
import { IoSettingsOutline } from "react-icons/io5";
import { LuLayoutDashboard } from "react-icons/lu";
import { MdChecklist, MdHealthAndSafety } from "react-icons/md";
import { TiLocationArrowOutline } from "react-icons/ti";
import { IoIosSettings } from "react-icons/io";

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
				isIconOnly={isCollapse}
			/>

			<SidebarLink
				href={route("devices.index")}
				label="Devices"
				icon={<TiLocationArrowOutline className="w-full h-full" />}
				isIconOnly={isCollapse}
			/>

			<SidebarLink
				href={route("devices.setup")}
				label="Setup"
				icon={<IoIosSettings className="w-full h-full" />}
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
