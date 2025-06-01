import { StatusCategory, type Status } from '~/lib/models/status';

export const getStatusCategoryColor = (category: StatusCategory) => {
    switch (category) {
        case StatusCategory.Pending:
            return 'var(--color-status-pending)';
        case StatusCategory.Ongoing:
            return 'var(--color-status-ongoing)';
        case StatusCategory.Completed:
            return 'var(--color-status-completed)';
        case StatusCategory.Canceled:
            return 'var(--color-status-canceled)';
    }
};

export const getStatusColor = (status: Pick<Status, 'color' | 'category'>) => {
    return status.color || getStatusCategoryColor(status.category);
}