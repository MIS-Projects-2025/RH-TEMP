import { useState, useRef, useEffect } from "react";
import { useToast } from "./useToast";

export function useMutation() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorData, setErrorData] = useState(null);
  const [data, setData] = useState(null);
  const abortControllerRef = useRef(null);

  const mutate = async (url, options = {}) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { method = "POST", body, isFormData = false, isContentTypeInclude = true } = options;
      console.log("🚀 ~ mutate ~ body:", JSON.stringify(body))
      const token = localStorage.getItem("authify-token");
      const response = await fetch(url, {
        method,
        headers: {
          ...(isContentTypeInclude && { "Content-Type": "application/json" }),
          "Accept": "application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? isFormData ? body : JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonErr) {
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
      
      setData(result);
      return result;
    } catch (error) {
      console.log("🚀 ~ mutate ~ error:", error.data)
      if (error.name !== "AbortError") {
        setErrorData(error.data);
        setErrorMessage(error.message);
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);


  const cancel = () => {
    abortControllerRef.current?.abort();
  };

  return { mutate, data, errorMessage, errorData, isLoading, cancel };
}
