import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useExportStore = create(
	persist(
		(set) => ({
			activeJobId: null,
			progress: "0 / 0",
			status: "idle",
			fileUrl: null,

			startMonitoring: (id) =>
				set({ activeJobId: id, status: "processing", fileUrl: null }),

			updateStatus: (data) =>
				set({
					status: data.status,
					progress: data.progress,
					fileUrl: data.file_url || null,
				}),

			stopMonitoring: () =>
				set({
					activeJobId: null,
					status: "idle",
					fileUrl: null,
					progress: "0 / 0",
				}),
		}),
		{ name: "export-storage" },
	),
);
