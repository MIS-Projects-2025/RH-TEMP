import NavBar from "@/Components/NavBar";
import Sidebar from "@/Components/Sidebar/SideBar";
import LoadingScreen from "@/Components/LoadingScreen";
import { Link, usePage, router } from "@inertiajs/react";
import axios from "axios";
import { useEffect, useState } from "react";

export default function AuthenticatedLayout({ header, children }) {
    const { url, props } = usePage();

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        authCheck();
    }, [url]);

    const authCheck = async () => {
        setIsLoading(true);

        // Check if the URL contains a query parameter "key" (token value): START
        const queryParams = new URLSearchParams(url.split("?")[1]);
        const queryToken = queryParams.get("key");

        if (queryToken) {
            localStorage.setItem("authify-token", queryToken);

            // Remove query params from the URL without reloading the page
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            router.post(route("setSession"), { queryToken });

            setIsLoading(false);
        }
        // Check if the URL contains a query parameter "key" (token value): END

        // Check if there is a token stored in localStorage, redirect to login if not: START
        const token = localStorage.getItem("authify-token");

        if (!token) {
            window.location.href = `http://192.168.2.221/authify/public/login?redirect=${encodeURIComponent(
                route("dashboard")
            )}`;
            return;
        }
        // Check if there is a token stored in localStorage, redirect to login if not: END

        // Check if the token is valid, redirect to login if not: START
        try {
            const isTokenValid = await axios.get(
                `http://192.168.2.221/authify/public/api/validate?token=${encodeURIComponent(
                    token
                )}`
            );

            if (isTokenValid.data.status !== "success") {
                localStorage.removeItem("authify-token");

                window.location.href = `http://192.168.2.221/authify/public/login?redirect=${encodeURIComponent(
                    route("dashboard")
                )}`;
                return;
            }
        } catch (error) {
            console.log("with error", error);
        }
        // Check if the token is valid, redirect to login if not: END

        setIsLoading(false);
    };

    return (
        <div className="flex flex-col">
            {isLoading && <LoadingScreen text="Please wait..." />}

            {/* <LoadingScreen text="Please wait..." /> */}
            <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="w-full ">
                    <NavBar />
                    <main className="h-screen px-6 py-6 pb-[70px] overflow-y-auto">
                        <div className="">{children}</div>
                    </main>
                </div>
            </div>
        </div>
    );
}
