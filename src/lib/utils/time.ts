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
