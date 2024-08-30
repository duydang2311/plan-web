import type { Status } from './status';

export interface Issue {
    createdTime: string;
    updatedTime: string;
    id: string;
    authorId: string;
    orderNumber: number;
    title: string;
    description?: string;
    statusId?: number;
    status?: Status;
    orderByStatus: number;
}
