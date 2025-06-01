import { DateTime, type DateTimeFormatOptions, type ToRelativeOptions } from 'luxon';

export const formatRelativeDateUi = (
    dateTime: DateTime,
    absoluteFormatOpts?: DateTimeFormatOptions
) => {
    const duration = dateTime.diffNow('days');
    const days = -duration.days;
    if (days < 1) {
        return 'Today';
    }
    if (days < 7) {
        return dateTime.toRelative();
    }
    return dateTime.toLocaleString(absoluteFormatOpts ?? DateTime.DATE_FULL);
};

export const formatRelativeDateTimeUi = (
    dateTime: string | DateTime,
    options?: ToRelativeOptions
) => {
    if (typeof dateTime === 'string') {
        dateTime = DateTime.fromISO(dateTime);
    }

    const now = DateTime.now();
    if (now.diff(dateTime, 'seconds').seconds <= 5) {
        return 'just now';
    }
    if (now.diff(dateTime, 'minutes').minutes < 1) {
        return 'less than a minute ago';
    }
    return dateTime.toRelative(options);
};

export const formatTimeUi = (dateTime: string | DateTime) => {
    if (typeof dateTime === 'string') {
        dateTime = DateTime.fromISO(dateTime);
    }

    const now = DateTime.now();
    if (dateTime.hasSame(now, 'day')) {
        return `Today, ${dateTime.toLocaleString(DateTime.TIME_SIMPLE)}`;
    }
    if (dateTime.hasSame(now.minus({ days: 1 }), 'day')) {
        return `Yesterday, ${dateTime.toLocaleString(DateTime.TIME_SIMPLE)}`;
    }
    if (dateTime.hasSame(now.plus({ days: 1 }), 'day')) {
        return `Tomorrow, ${dateTime.toLocaleString(DateTime.TIME_SIMPLE)}`;
    }
    return dateTime.toLocaleString(DateTime.DATETIME_MED);
};

export const formatDateUi = (dateTime: string | DateTime) => {
    if (typeof dateTime === 'string') {
        dateTime = DateTime.fromISO(dateTime);
    }

    const now = DateTime.now();
    if (dateTime.hasSame(now, 'day')) {
        return `Today`;
    }
    if (dateTime.hasSame(now.minus({ days: 1 }), 'day')) {
        return `Yesterday`;
    }
    if (dateTime.hasSame(now.plus({ days: 1 }), 'day')) {
        return `Tomorrow`;
    }
    return dateTime.toLocaleString(DateTime.DATE_MED);
};

export const formatDateTimeUi = formatTimeUi;
