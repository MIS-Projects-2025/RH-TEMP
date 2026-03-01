const DEFAULT_LOCALE = 'en-US';

export const DATE_ONLY_FORMAT = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
};

export const TIME_ONLY_FORMAT = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
};

export const DATE_TIME_FORMAT = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
};

export function formatTimestamp(
    timestamp,
    format = DATE_TIME_FORMAT,
    { timezone = 'local' } = {}
) {
    if (!timestamp) return '-';

    let date;

    // https://chatgpt.com/c/6981943e-2a48-8323-b57b-698e5a10da1e
    // if (typeof timestamp === 'string') {
    //     const normalized = timestamp.replace(' ', 'T');
    //     date = timezone === 'utc'
    //         ? new Date(normalized + 'Z')
    //         : new Date(normalized);
    // } else {
        date = new Date(timestamp);
    // }

    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleString('en-US', {
        ...format,
        ...(timezone === 'utc' && { timeZone: 'UTC' }),
    });
}

