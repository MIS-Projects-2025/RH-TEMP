import { toast } from "react-hot-toast";
import { FaCheckCircle, FaInfo, FaMinusCircle } from "react-icons/fa";

export function useToast() {
    const base =
        "alert shadow-lg rounded-lg w-fit max-w-sm font-medium transition-all duration-300";

    const variants = {
        success: "alert-success text-success-content text-sm",
        error: "alert-error text-error-content text-sm",
        info: "alert-info text-info-content text-sm",
        loading: "alert-info text-info-content text-sm",
    };

    const icons = {
        success: <FaCheckCircle size={18} />,
        error: <FaMinusCircle size={18} />,
        info: <FaInfo size={18} />,
        loading: <span className="loading loading-spinner" />,
    };

    const show = (type, message, opts = {}) => {
        toast.custom(
            (t) => (
                <div
                    className={`${base} ${variants[type]} ${
                        t.visible
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-2"
                    }`}
                >
                    {icons[type]}
                    <span>{message}</span>
                </div>
            ),
            {
                id: opts.id,
                duration: opts.duration ?? (type === "error" ? 5000 : 3000),
                position: opts.position ?? "top-right",
            }
        );
    };

    return {
        success: (msg, opts) => show("success", msg, opts),
        error: (msg, opts) => show("error", msg, opts),
        info: (msg, opts) => show("info", msg, opts),
        loading: (msg, opts) => show("loading", msg, opts),
    };
}
