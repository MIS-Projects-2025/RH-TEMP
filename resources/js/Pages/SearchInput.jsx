import clsx from "clsx";
import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";

const SearchInput = React.memo(function SearchInput({
    inputClassName = "",
    placeholder = "search",
    initialSearchInput,
    onSearchChange,
}) {
    const [searchInput, setSearchInput] = useState(initialSearchInput);

    useEffect(() => {
        const handler = setTimeout(() => {
            onSearchChange(searchInput);
        }, 300);

        return () => clearTimeout(handler);
    }, [searchInput, onSearchChange]);

    return (
        <label className={clsx("input h-7.5 ml-auto", inputClassName)}>
            <FaSearch className="mr-2" />
            <input
                type="text"
                placeholder={placeholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
            />
        </label>
    );
});

export default SearchInput;
