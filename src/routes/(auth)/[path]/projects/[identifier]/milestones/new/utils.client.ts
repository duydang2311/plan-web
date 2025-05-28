import { createQuery } from '@tanstack/svelte-query';
import { toStore } from 'svelte/store';
import type { ClientRuntime } from '~/lib/contexts/runtime.client';
import type { MilestoneStatus } from '~/lib/models/milestone';
import type { PaginatedList } from '~/lib/models/paginatedList';
import { QueryResponse } from '~/lib/utils/query';

export type LocalMilestoneStatus = Pick<
    MilestoneStatus,
    'id' | 'category' | 'rank' | 'value' | 'color' | 'icon' | 'description' | 'isDefault'
>;

export const createStatusListQuery = (api: ClientRuntime['api']) => (projectId: string) =>
    createQuery(
        toStore(() => ({
            queryKey: ['milestone-statuses', { projectId }],
            queryFn: async () => {
                const response = await QueryResponse.HTTP(() =>
                    api.get('milestone-statuses', {
                        query: {
                            projectId,
                            select: 'Id,Category,Rank,Value,Color,Icon,Description,IsDefault',
                            order: 'Rank'
                        }
                    })
                );
                return await QueryResponse.JSON(() =>
                    response.json<PaginatedList<LocalMilestoneStatus>>()
                );
            }
        }))
    );
