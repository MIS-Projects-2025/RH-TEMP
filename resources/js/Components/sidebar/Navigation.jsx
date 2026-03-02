import Dropdown from "@/Components/sidebar/Dropdown";
import SidebarLink from "@/Components/sidebar/SidebarLink";
import { usePage } from "@inertiajs/react";
import { BiTask } from "react-icons/bi";
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

export default function NavLinks({ isCollapse }) {
	const { emp_data } = usePage().props;
	return (
		<nav
			className="flex flex-col space-y-1 overflow-y-auto"
			style={{ scrollbarWidth: "none" }}
		>
			<SidebarLink
				href={route("perform.checklist.index")}
				label="Perform checklist"
				icon={<FaPlay className="w-full h-full" />}
				isIconOnly={isCollapse}
				linkButtonClassName={"bg-primary btn text-white hover:bg-secondary"}
			/>

			<SidebarLink
				href={route("perform.sds-monitoring.index")}
				label="Monitor SDS"
				icon={<FaPlay className="w-full h-full" />}
				isIconOnly={isCollapse}
				linkButtonClassName={"btn-outline btn-primary btn hover:bg-secondary"}
			/>

			<SidebarLink
				href={route("perform.restroom-monitoring.index")}
				label="Monitor Restroom"
				icon={<FaPlay className="w-full h-full" />}
				isIconOnly={isCollapse}
				linkButtonClassName={"btn-outline btn-primary btn hover:bg-secondary"}
			/>

			<SidebarLink
				href={route("dashboard")}
				label="Dashboard"
				icon={<LuLayoutDashboard className="w-full h-full" />}
				isIconOnly={isCollapse}
			/>

			<SidebarLink
				href={route("asset-health")}
				label="Asset Health Board"
				icon={<LuLayoutDashboard className="w-full h-full" />}
				isIconOnly={isCollapse}
			/>

			<Dropdown
				label="Submitted Forms List"
				icon={<FaFileAlt className="w-full h-full" />}
				links={[
					{
						href: route("checklist-instance.index"),
						label: "Checklists",
						icon: <BiTask className="w-full h-full" />,
					},
					{
						href: route("chemicals-sds-instances.index"),
						label: "Chemical SDS",
						icon: <MdHealthAndSafety className="w-full h-full" />,
					},
					{
						href: route("restroom-monitoring-instances.index"),
						label: "Restroom Monitoring",
						icon: <GrRestroom className="w-full h-full" />,
					},
				]}
				isIconOnly={isCollapse}
			/>

			<SidebarLink
				href={route("utility-trash")}
				label="Utility Trash"
				// icon={<LuLayoutDashboard className="w-full h-full" />}
				icon={<FaTrash className="w-full h-full" />}
				isIconOnly={isCollapse}
			/>
			<Dropdown
				label="Settings"
				icon={<IoSettingsOutline className="w-full h-full" />}
				links={[
					{
						href: route("locations.index"),
						label: "Locations",
						icon: <FaLocationDot className="w-full h-full" />,
					},
					// checklist is editable for now.
					{
						href: route("checklist.index"),
						label: "Checklists",
						icon: <FaCheckCircle className="w-full h-full" />,
					},
					{
						href: route("checklist-items.index"),
						label: "Checklists' Items",
						icon: <MdChecklist className="w-full h-full" />,
					},
					{
						href: route("checklist-assets.index"),
						label: "Checklists' Assets",
						icon: <FaListAlt className="w-full h-full" />,
					},
					{
						href: route("check-items.index"),
						label: "Check Items",
						icon: <FaCubes className="w-full h-full" />,
					},
					{
						href: route("assets.index"),
						label: "List of Assets",
						icon: <FaCubes className="w-full h-full" />,
					},
					{
						href: route("asset-pm-schedule.index"),
						label: "Assets PM Schedule",
						icon: <FaTools className="w-full h-full" />,
					},
				]}
				isIconOnly={isCollapse}
				// notification={true}
			/>

			<Dropdown
				label="Chemicals"
				icon={<FaBiohazard className="w-full h-full" />}
				links={[
					{
						href: route("chemicals.index"),
						label: "Chemical Inventory",
						icon: <GiChemicalDrop className="w-full h-full" />,
					},
					{
						href: route("hazardous-log-sheet.index"),
						label: "Waste Turn-over",
						icon: <FaBiohazard className="w-full h-full" />,
					},
				]}
				isIconOnly={isCollapse}
				// notification={true}
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
