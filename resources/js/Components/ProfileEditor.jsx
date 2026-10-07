import { useForm } from "@inertiajs/react";

const Field = ({ label, field, data, setData, errors, type = "number" }) => (
	<div>
		<label className="block text-xs text-base-content mb-1">{label}</label>
		<input
			type={type}
			step="0.1"
			value={data[field]}
			onChange={(e) => setData(field, e.target.value)}
			className="w-full bg-base-100 border border-gray-700 text-base-content text-sm font-mono rounded px-3 py-2 focus:outline-none focus:border-blue-500"
		/>
		{errors[field] && (
			<p className="text-[10px] text-red-400 mt-1">{errors[field]}</p>
		)}
	</div>
);

export default function ProfileEditor({ profile = null }) {
	const { data, setData, put, post, processing, isDirty, errors } = useForm({
		name: profile?.name ?? "",
		temp_crit_min: profile?.temp_crit_min ?? "",
		temp_min: profile?.temp_min ?? "",
		temp_max: profile?.temp_max ?? "",
		temp_crit_max: profile?.temp_crit_max ?? "",
		rh_crit_min: profile?.rh_crit_min ?? "",
		rh_min: profile?.rh_min ?? "",
		rh_max: profile?.rh_max ?? "",
		rh_crit_max: profile?.rh_crit_max ?? "",
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		if (profile) {
			put(`/threshold-profiles/${profile.id}`);
		} else {
			post(`/threshold-profiles`);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="bg-base-100 border border-base-content rounded-lg p-5 space-y-4"
		>
			<div className="flex items-center justify-between">
				<h3 className="font-semibold text-base-content">
					{profile ? profile.name : "New Profile"}
				</h3>
				{isDirty && (
					<span className="text-xs text-yellow-400 font-mono">
						unsaved changes
					</span>
				)}
			</div>

			{!profile && (
				<Field label="Profile Name" field="name" type="text"
					data={data} setData={setData} errors={errors} />
			)}

			<div>
				<p className="text-xs uppercase tracking-widest text-base-content mb-2">
					Temperature (°C)
				</p>
				<div className="grid grid-cols-4 gap-2">
					<Field label="Red below" field="temp_crit_min" data={data} setData={setData} errors={errors} />
					<Field label="Green min" field="temp_min" data={data} setData={setData} errors={errors} />
					<Field label="Green max" field="temp_max" data={data} setData={setData} errors={errors} />
					<Field label="Red above" field="temp_crit_max" data={data} setData={setData} errors={errors} />
				</div>
			</div>

			<div>
				<p className="text-xs uppercase tracking-widest text-base-content mb-2">
					Humidity (%)
				</p>
				<div className="grid grid-cols-4 gap-2">
					<Field label="Red below" field="rh_crit_min" data={data} setData={setData} errors={errors} />
					<Field label="Green min" field="rh_min" data={data} setData={setData} errors={errors} />
					<Field label="Green max" field="rh_max" data={data} setData={setData} errors={errors} />
					<Field label="Red above" field="rh_crit_max" data={data} setData={setData} errors={errors} />
				</div>
			</div>

			<p className="text-xs text-base-content/60">
				Between a red limit and the green range the card turns orange.
				Leave red fields blank for no orange band.
			</p>

			<button
				type="submit"
				disabled={processing || !isDirty}
				className="w-full py-2 text-sm font-medium rounded btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
			>
				{processing ? "Saving…" : "Save Changes"}
			</button>
		</form>
	);
}
