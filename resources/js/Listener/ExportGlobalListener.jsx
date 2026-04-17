import { useExportStore } from "@/Store/useExportStore";
import { useEffect } from "react";

export default function ExportGlobalListener() {
	const { activeJobId, status, updateStatus } = useExportStore();

	useEffect(() => {
		console.log("🚀 ~ ExportGlobalListener ~ activeJobId:", activeJobId);
		if (!activeJobId || status === "done" || status === "failed") return;

		const poll = async () => {
			try {
				const res = await fetch(`/export/${activeJobId}/status`);
				const data = await res.json();
				console.log("🚀 ~ poll ~ data:", data);

				updateStatus(data);

				if (data.status !== "done" && data.status !== "failed") {
					setTimeout(poll, 3000);
				}
			} catch (e) {
				console.error("Polling failed", e);
			}
		};

		poll();
	}, [activeJobId]);

	return null;
}
