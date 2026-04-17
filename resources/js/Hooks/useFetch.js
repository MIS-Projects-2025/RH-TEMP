import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { router } from "@inertiajs/react";

export function useFetch(url, options = {}) {
	const { params = {}, auto = true } = options;
	const memoParams = useMemo(() => params, [JSON.stringify(params)]);

	const [data, setData] = useState(null);
	const [isLoading, setIsLoading] = useState(auto);
	const [errorMessage, setErrorMessage] = useState(null);

	const fetchIdRef = useRef(0);
	const abortControllerRef = useRef(null);

	const fetchData = useCallback(
		async (currentParams = memoParams) => {
			const id = ++fetchIdRef.current;

			if (abortControllerRef.current) abortControllerRef.current.abort();
			const controller = new AbortController();
			abortControllerRef.current = controller;

			setIsLoading(true);
			setErrorMessage(null);

			try {
				const query = new URLSearchParams(currentParams).toString();
				const fetchUrl = query ? `${url}?${query}` : url;
				const token = localStorage.getItem("authify-token");

				const response = await fetch(fetchUrl, {
					signal: controller.signal,
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
						...(token && { Authorization: `Bearer ${token}` }),
					},
				});

				const result = await response.json();

				if (!response.ok) {
					const error = new Error(
						result?.message || `Error ${response.status}`,
					);
					error.status = response.status;
					error.data = result;
					throw error;
				}

				setData(result);
				return result;
			} catch (error) {
				if (error.name !== "AbortError") {
					setErrorMessage(error.message);
				}
			} finally {
				if (id === fetchIdRef.current) {
					setIsLoading(false);
				}
			}
		},
		[url, memoParams],
	);

	useEffect(() => {
		if (auto) fetchData();
		return () => abortControllerRef.current?.abort();
	}, [fetchData, auto]);

	return {
		data,
		isLoading,
		errorMessage,
		fetch: fetchData,
		abort: () => abortControllerRef.current?.abort(),
	};
}
