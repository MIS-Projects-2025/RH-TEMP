export default function formatDateTime(date) {
	if (!date) return "";

	const d = date instanceof Date ? date : new Date(date);

	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	const year = d.getFullYear();
	const hours = String(d.getHours()).padStart(2, "0");
	const minutes = String(d.getMinutes()).padStart(2, "0");
	const seconds = String(d.getSeconds()).padStart(2, "0");

	return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}
