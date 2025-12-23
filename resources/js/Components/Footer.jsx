import React from "react";

const Footer = () => {
    return (
        <div className="sticky bottom-0 bg-base-200 z-50 px-4 w-full mx-auto border-t border-base-100 sm:px-6 lg:px-8">
            <div className="flex justify-between  h-10 items-center">
                <div className="opacity-50 space-x-2">
                    <span className="font-bold pr-2">Copyright ©</span>All
                    rights reserved.
                </div>
                <div>Facility v2.0</div>
            </div>
        </div>
    );
};

export default Footer;
