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
    dateTime: string | Date | DateTime,
    options?: ToRelativeOptions & { capitalize?: boolean }
) => {
    if (typeof dateTime === 'string') {
        dateTime = DateTime.fromISO(dateTime);
    } else if (dateTime instanceof Date) {
        dateTime = DateTime.fromJSDate(dateTime);
    }

    const now = DateTime.now();
    if (now.diff(dateTime, 'seconds').seconds <= 5) {
        return `${options?.capitalize ? 'J' : 'j'}ust now`;
    }
    if (now.diff(dateTime, 'minutes').minutes < 1) {
        return `${options?.capitalize ? 'L' : 'l'}ess than a minute ago`;
    }
    return dateTime.toRelative(options);
};

export const formatDurationUi = (a: string | Date | DateTime, b: string | Date | DateTime) => {
    if (typeof a === 'string') {
        a = DateTime.fromISO(a);
    } else if (a instanceof Date) {
        a = DateTime.fromJSDate(a);
    }

    if (typeof b === 'string') {
        b = DateTime.fromISO(b);
    } else if (b instanceof Date) {
        b = DateTime.fromJSDate(b);
    }

    return Object.entries(b.diff(a, ['months', 'days', 'hours', 'minutes', 'seconds']).toObject())
        .filter(([_, v]) => v > 0)
        .map(([k, v]) => `${Math.floor(v)} ${k}`)
        .join(', ');
};

export const formatTimeUi = (dateTime: string | Date | DateTime) => {
    if (typeof dateTime === 'string') {
        dateTime = DateTime.fromISO(dateTime);
    } else if (dateTime instanceof Date) {
        dateTime = DateTime.fromJSDate(dateTime);
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

export const formatDateUi = (dateTime: string | Date | DateTime, format?: string) => {
    if (typeof dateTime === 'string') {
        dateTime = DateTime.fromISO(dateTime);
    } else if (dateTime instanceof Date) {
        dateTime = DateTime.fromJSDate(dateTime);
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
    return format ? dateTime.toFormat(format) : dateTime.toLocaleString(DateTime.DATE_MED);
};

export const formatDateTimeUi = formatTimeUi;
