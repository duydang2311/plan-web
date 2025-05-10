import { DateTime, type DateTimeFormatOptions } from 'luxon';

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
