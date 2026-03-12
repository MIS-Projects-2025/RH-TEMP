import { useState } from "react";

export default function DevicesSetup({ devices }) {
	const [selected, setSelected] = useState(devices[0]?.ip ?? null);

	const activeDevice = devices.find((d) => d.ip === selected);

	return (
		<div className="max-w-6xl mx-auto space-y-4">
			<div className="flex flex-wrap gap-2">
				{devices.map((device) => (
					<button
						key={device.id}
						className={`btn btn-sm ${selected === device.ip ? "btn-primary" : "btn-outline"}`}
						onClick={() => setSelected(device.ip)}
					>
						{device.location}
					</button>
				))}
			</div>

			{activeDevice ? (
				<div className="card bg-base-100 shadow">
					<div className="card-body p-4">
						<h2 className="card-title">{activeDevice.location}</h2>
						<iframe
							src={`http://${activeDevice.ip}/pIndex?pgNo=4`}
							width="100%"
							height="500px"
							className="rounded border border-base-300"
							title={activeDevice.location}
						/>
					</div>
				</div>
			) : (
				<div className="text-center text-base-content/50 py-16">
					No devices configured yet.
				</div>
			)}
		</div>
	);
}
