import type { Status } from './status';

export interface Workspace {
    id: string;
    statuses?: Status[];
}
