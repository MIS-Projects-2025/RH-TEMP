import useCurrentDate from "@/Hooks/useCurrentDate";

export default function UpdateChecklist({ role }) {
    const date = useCurrentDate();

    if (role === "user") {
        const formattedDate = date.toLocaleString();
        return <span>{formattedDate}</span>;
    }
}
