/**
 * Converts a Date object or date string (including "YYYY-MM-DD") into a human-readable format.
 * Example: "October 3, 2025" or "October 3, 2025 at 02:13:00 PM"
 * @param {Date|string} date - The date to format
 * @param {boolean} [includeTime=false] - Whether to include the time
 * @returns {string} Human-readable date
 */
function formatFriendlyDate(date, includeTime = false) {
	if (!date) return ""; // handle null or undefined

	let d;

	if (typeof date === "string") {
		// If format is YYYY-MM-DD, replace "-" with "/" for safe parsing in all browsers
		if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			d = new Date(date.replace(/-/g, "/"));
		} else {
			d = new Date(date);
		}
	} else if (date instanceof Date) {
		d = date;
	} else {
		return ""; // unsupported type
	}

	if (isNaN(d)) return ""; // handle invalid dates

	if (includeTime) {
		return d.toLocaleString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: true,
		});
	}

	return d.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export default formatFriendlyDate;
