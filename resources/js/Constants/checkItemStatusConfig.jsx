import { FaCheck } from "react-icons/fa";
import { FaPowerOff, FaRegCirclePause } from "react-icons/fa6";
import { GiAutoRepair, GiLeak } from "react-icons/gi";
import { IoSparklesSharp } from "react-icons/io5";
import { LuBug } from "react-icons/lu";
import { MdCancel, MdPlayCircle, MdWarning } from "react-icons/md";
import { SlLike } from "react-icons/sl";
import { TbBulb, TbBulbOff } from "react-icons/tb";

const STATUS_CONFIG = {
	running: {
		label: "Running",
		color: "#22c55e",
		bgClass: "bg-green-500/5",
		icon: MdPlayCircle,
	},
	"without lit": {
		label: "Without Lit",
		icon: TbBulbOff,
	},
	"with lit": {
		label: "With Lit",
		icon: TbBulb,
	},
	"stand by": {
		label: "Stand By",
		color: "#facc15",
		bgClass: "bg-yellow-400/5",
		icon: FaRegCirclePause,
	},
	"with leak": {
		label: "With Leak",
		color: "#38bdf8",
		bgClass: "bg-sky-400/5",
		icon: GiLeak,
	},
	"not functional": {
		label: "Not Functional",
		color: "#f87171",
		bgClass: "bg-red-400/5",
		icon: MdCancel,
	},
	good: {
		label: "Good",
		color: "#22c55e",
		bgClass: "bg-green-500/5",
		icon: SlLike,
	},
	done: {
		label: "Done",
		color: "#22c55e",
		bgClass: "bg-green-500/5",
		icon: FaCheck,
	},
	clean: {
		label: "Clean",
		color: "#FFFFE3",
		icon: IoSparklesSharp,
	},
	"with error": {
		label: "With Error",
		color: "#f87171",
		bgClass: "bg-red-400/5",
		icon: LuBug,
	},
	"no good": {
		label: "No Good",
		color: "#f87171",
		bgClass: "bg-red-400/5",
		icon: MdCancel,
	},
	"not working": {
		label: "Not Working",
		color: "#f87171",
		bgClass: "bg-red-400/5",
		icon: MdCancel,
	},
	"not done": {
		label: "Not Done",
		color: "#f87171",
		bgClass: "bg-red-400/5",
		icon: MdCancel,
	},
	"under repair": {
		label: "Under Repair",
		color: "#fb923c",
		bgClass: "bg-orange-400/5",
		icon: GiAutoRepair,
	},
	dirty: {
		label: "Dirty",
		color: "#a78bfa",
		bgClass: "bg-violet-400/5",
		icon: MdWarning,
	},
	off: {
		label: "Off",
		color: "#000",
		bgClass: "bg-black/5",
		icon: FaPowerOff,
	},
	on: {
		label: "On",
		color: "#22c55e",
		bgClass: "bg-green-500/5",
		icon: FaPowerOff,
	},
};

export default STATUS_CONFIG;
