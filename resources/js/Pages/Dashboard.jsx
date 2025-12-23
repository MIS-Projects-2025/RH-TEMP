import { Head, usePage } from "@inertiajs/react";

export default function Dashboard() {
    const props = usePage().props;

    return (
        <>
            <Head title="Dashboard" />

            <h1 className="text-2xl font-bold">Dashboard</h1>
        </>
    );
}
