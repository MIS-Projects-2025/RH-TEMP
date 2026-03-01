function isYesterday(date, now) {
	const yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);

	return (
		date.getFullYear() === yesterday.getFullYear() &&
		date.getMonth() === yesterday.getMonth() &&
		date.getDate() === yesterday.getDate()
	);
}

function formatTime(date) {
	return date
		.toLocaleTimeString([], {
			hour: "numeric",
			minute: "2-digit",
		})
		.toLowerCase();
}

export default function formatPastDateTimeLabel(dateInput) {
	if (!dateInput) return "";

	const date = new Date(dateInput);
	const now = new Date();

	const diffMs = now - date;
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHr = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHr / 24);
	const diffMonth = Math.floor(diffDay / 30);
	const diffYear = Math.floor(diffDay / 365);

	// Less than a minute
	if (diffSec < 60) return diffSec <= 1 ? "Just now" : `${diffSec} seconds ago`;

	// Less than an hour
	if (diffMin < 60)
		return diffMin === 1 ? "1 minute ago" : `${diffMin} minutes ago`;

	// Less than a day
	if (diffHr < 24) {
		const hours = diffHr;
		const minutes = diffMin % 60;

		if (minutes === 0) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;

		const hourLabel = hours === 1 ? "hr" : "hrs";
		const minuteLabel = minutes === 1 ? "min" : "mins";
		return `${hours} ${hourLabel} and ${minutes} ${minuteLabel} ago`;
	}

	// Yesterday
	if (isYesterday(date, now)) {
		return `Yesterday at ${formatTime(date)}`;
	}

	// This week (2–6 days)
	if (diffDay < 7) {
		const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
		return `Last ${weekday} at ${formatTime(date)}`;
	}

	// Less than a month
	if (diffDay < 30) {
		return diffDay === 1 ? "1 day ago" : `${diffDay} days ago`;
	}

	// Months + days + hours
	if (diffDay < 365) {
		const months = diffMonth;
		const days = diffDay % 30;
		const hours = diffHr % 24;

		const parts = [];
		if (months > 0) parts.push(months === 1 ? "1 month" : `${months} months`);
		if (days > 0) parts.push(days === 1 ? "1 day" : `${days} days`);
		if (hours > 0) parts.push(hours === 1 ? "1 hour" : `${hours} hours`);

		return `${parts.join(", ")} ago`;
	}

	// Years
	return diffYear === 1 ? "1 year ago" : `${diffYear} years ago`;
}
