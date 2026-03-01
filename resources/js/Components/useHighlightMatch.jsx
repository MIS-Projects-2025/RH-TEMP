import { diffChars } from "diff";
import { useMemo } from "react";

const useHighlightMatch = (debouncedSearch) => {
    return useMemo(() => {
        return (option) => {
            if (!option) return null;

            const search = debouncedSearch.trim();
            if (!search) return option.value;

            const highlightText = (text) => {
                // diff between search and the text
                const diffs = diffChars(
                    text.toLowerCase(),
                    search.toLowerCase()
                );
                let cursor = 0;

                return diffs.map((part, i) => {
                    const start = cursor;
                    const end = start + part.value.length;
                    cursor = end;

                    // check if this part exists in search (added) or is part of original text
                    const isMatch =
                        !part.added &&
                        !part.removed &&
                        part.value.toLowerCase().includes(search.toLowerCase());
                    return (
                        <span
                            key={i}
                            style={{
                                fontWeight: isMatch ? "bold" : "normal",
                                backgroundColor: isMatch
                                    ? "yellow"
                                    : "transparent",
                            }}
                        >
                            {part.value}
                        </span>
                    );
                });
            };

            if (option.label && option.label !== option.value) {
                return (
                    <div>
                        <div>{highlightText(option.value)}</div>
                        <div className="opacity-75 text-xs">
                            {highlightText(option.label)}
                        </div>
                    </div>
                );
            }

            return <span>{highlightText(option.value)}</span>;
        };
    }, [debouncedSearch]);
};

export default useHighlightMatch;
