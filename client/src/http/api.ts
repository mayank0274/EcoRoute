import axios, { AxiosError } from "axios";
import { toast } from "sonner";

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

const getErrorMessage = (error: unknown) => {
    if (!axios.isAxiosError(error)) {
        return "Something went wrong. Please try again.";
    }

    const responseData = error.response?.data as
        | { error?: { message?: string }; message?: string }
        | undefined;

    return (
        responseData?.error?.message ||
        responseData?.message ||
        error.message ||
        "Something went wrong. Please try again."
    );
};

const getToastId = (error: AxiosError) => {
    const method = error.config?.method?.toUpperCase() ?? "REQUEST";
    const url = error.config?.url ?? "unknown-url";
    const status = error.response?.status ?? "unknown-status";

    return `api-error:${method}:${url}:${status}`;
};

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        toast.error(getErrorMessage(error), {
            id: getToastId(error),
        });
        return Promise.reject(error);
    },
);

export default api;
