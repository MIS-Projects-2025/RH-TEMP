import { create } from "zustand";

export const useLocationStore = create((set, get) => {
  let abortController = null;

  const buildUrlWithParams = (baseUrl, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
  };

  return {
    data: null,
    isLoading: false,
    errorMessage: null,

    async fetchLocations(params = {}) {
      if (abortController) {
        abortController.abort();
      }

      abortController = new AbortController();

      set({ isLoading: true, errorMessage: null });

      try {
        const url = buildUrlWithParams(route("api.locations.index"), params);
        const token = localStorage.getItem("authify-token");

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: abortController.signal,
        });

        let result;
        try {
          result = await response.json();
        } catch {
          const error = new Error("Invalid JSON response from server");
          error.status = response.status;
          throw error;
        }

        if (!response.ok || (result && result.status === "error")) {
          const error = new Error(result?.message || `HTTP error: ${response.status}`);
          error.status = response.status;
          error.data = result;
          throw error;
        }

        set({ data: result });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.log("❌ Fetch error:", error);
          set({ errorMessage: error.message });
        }
      } finally {
        set({ isLoading: false });
      }
    },

    abortFetch() {
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
    },
  };
});
