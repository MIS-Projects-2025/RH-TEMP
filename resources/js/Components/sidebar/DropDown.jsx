import { DARK_THEME_NAME } from "@/Constants/colors";
import { useThemeStore } from "@/Store/themeStore";
import { Transition } from "@headlessui/react";
import { usePage } from "@inertiajs/react";
import clsx from "clsx";
import { Fragment, useEffect, useMemo, useState } from "react";
import SidebarLink from "./SidebarLink";

export default function Dropdown({
	isIconOnly = false,
	label,
	icon = null,
	links = [],
	notification = null,
}) {
	const { appName } = usePage().props;
	const { theme } = useThemeStore();
	const currentPath = window.location.pathname.replace(`/${appName}`, "");

	const normalizePath = (href) => {
		try {
			const urlObj = new URL(href, window.location.origin);
			return urlObj.pathname;
		} catch {
			return href;
		}
	};

	const isActiveLink = (href) => {
		const firstSegmentFrom = currentPath.split("/")[1];
		const firstSegmentTo = new URL(href, window.location.origin).pathname
			.replace(`/${appName}`, "")
			.split("/")[1];

		return firstSegmentFrom === firstSegmentTo;
	};

	const hasActiveLink = useMemo(() => {
		return links.some((link) => isActiveLink(link.href));
	}, [currentPath, links]);

	const [open, setOpen] = useState(false);

	useEffect(() => {
		setOpen(hasActiveLink);
	}, [hasActiveLink]);

	const hoverColor =
		theme === DARK_THEME_NAME ? "hover:bg-base-200" : "hover:bg-base-300";

	return (
		<div className="">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className={clsx(
					`flex items-center cursor-pointer h-8 justify-between w-full px-2.5 py-2  ${hoverColor}`,
					{
						hidden: isIconOnly,
					},
				)}
			>
				<div className="relative flex items-center space-x-2">
					{icon && <span className="w-5 h-5">{icon}</span>}
					<span className="pr-1">{label}</span>

					{/* Dropdown notification */}
					{notification ? (
						typeof notification === "number" ? (
							<span className="ml-1 bg-accent text-content text-xs font-bold px-1.5 py-0.5 rounded-full">
								{notification > 99 ? "99+" : notification}
							</span>
						) : (
							<span className="w-2 h-2 rounded-full bg-accent"></span>
						)
					) : null}
				</div>

				<span
					className={`pt-0.75 transition-transform duration-300 ${
						open ? "rotate-180" : "rotate-0"
					}`}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth="1.5"
						stroke="currentColor"
						className="w-4 h-4"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M19.5 8.25L12 15.75 4.5 8.25"
						/>
					</svg>
				</span>
			</button>

			<Transition
				show={open || isIconOnly}
				enter="transition ease-out duration-200"
				enterFrom="opacity-0 scale-95"
				enterTo="opacity-100 scale-100"
				leave="transition ease-in duration-150"
				leaveFrom="opacity-100 scale-100"
				leaveTo="opacity-0 scale-95"
			>
				<div className={clsx("z-100", { "": isIconOnly })}>
					{links.map((link, index) => {
						return (
							<Fragment key={`${normalizePath(link.href)}-${index}`}>
								<SidebarLink
									href={link.href}
									label={link.label}
									icon={link.icon}
									notifications={link.notification}
									isIconOnly={isIconOnly}
									isSub={true}
								/>
							</Fragment>
						);
					})}
				</div>
			</Transition>
		</div>
	);
}
