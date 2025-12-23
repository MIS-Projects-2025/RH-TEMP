import NavBar from "@/Components/NavBar";
import Sidebar from "@/Components/Sidebar/SideBar";
import { usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Footer from "@/Components/Footer";

export default function AuthenticatedLayout({ header, children }) {
    const { url } = usePage();
    const { emp_data } = usePage().props;

    const [hasUserFetched, setHasUserFetched] = useState(false);

    useEffect(() => {
        if (!emp_data || hasUserFetched) return;

        setHasUserFetched(true);
    }, [emp_data, hasUserFetched]);

    return (
        <div className="flex bg-base-200 h-screen text-sm">
            <Sidebar />
            <div className="h-full flex flex-col flex-1 overflow-y-hidden">
                <NavBar />
                <div className="px-4 py-8 flex-1 w-full relative overflow-y-auto">
                    <div className="w-full">{children}</div>
                </div>
                <Footer />
            </div>
        </div>
    );
}
