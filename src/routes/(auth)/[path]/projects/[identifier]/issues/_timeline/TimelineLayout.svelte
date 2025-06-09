<script lang="ts">
    import { browser } from '$app/environment';
    import { parse, wcagContrast } from 'culori';
    import { DateTime } from 'luxon';
    import type { IdType } from 'vis-timeline';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { watch, type AsyncRef, type Ref } from '~/lib/utils/runes.svelte';
    import type { Attempt } from '~/lib/utils/try';
    import type { LocalTimelineIssue, LocalTimelineMilestone } from '../+page.server';

    const {
        workspacePath,
        projectIdentifier,
        issueListRef,
        milestoneListRef
    }: {
        workspacePath: string;
        projectIdentifier: string;
        issueListRef: AsyncRef<Attempt<PaginatedList<LocalTimelineIssue>, unknown> | undefined>;
        milestoneListRef: Ref<Attempt<PaginatedList<LocalTimelineMilestone>, unknown> | undefined>;
    } = $props();

    type VisModule = typeof import('vis-timeline/standalone');
    let importVis: Promise<VisModule>;
    let visModule: VisModule;
    let timeline = $state.raw<import('vis-timeline/standalone').Timeline>();

    if (browser) {
        importVis = import('vis-timeline/standalone').then((a) => {
            visModule = a;
            return a;
        });
    }

    watch(() => [issueListRef.value, timeline])(() => {
        if (!issueListRef.value || issueListRef.value.failed || !timeline) {
            return;
        }

        timeline.setItems(
            issueListRef.value.data.items
                .filter((a) => a.startTime != null)
                .map((a) => ({
                    id: a.id,
                    content: a.title,
                    group: a.id,
                    orderNumber: a.orderNumber,
                    start: a.startTime
                        ? DateTime.fromISO(a.startTime, { zone: a.timelineZone }).toJSDate()
                        : (undefined as never),
                    end: a.endTime
                        ? DateTime.fromISO(a.endTime, { zone: a.timelineZone }).toJSDate()
                        : (undefined as never),
                    type: a.endTime == null ? 'point' : (undefined as never)
                }))
        );
        timeline.setGroups(
            issueListRef.value.data.items.map((a) => ({
                id: a.id,
                content: a.title,
                startTime: a.startTime,
                timelineZone: a.timelineZone,
                orderNumber: a.orderNumber
            }))
        );
    });

    watch(() => [milestoneListRef.value, timeline])(() => {
        if (!milestoneListRef.value || milestoneListRef.value.failed || !timeline) {
            return;
        }

        const currentTimeline = timeline;
        const ids: IdType[] = [];

        for (const milestone of milestoneListRef.value.data.items) {
            const id = currentTimeline.addCustomTime(
                DateTime.fromISO(milestone.endTime, { zone: milestone.endTimeZone }).toJSDate(),
                `m-${milestone.id}`
            );
            ids.push(id);
            // @ts-ignore
            currentTimeline.setCustomTimeMarker(milestone.title, id, false);
            requestAnimationFrame(() => {
                const el = document.querySelector(
                    `.vis-custom-time.${id}`
                ) as HTMLDivElement | null;
                if (el) {
                    el.removeChild(el.children[0]); // remove drag handle
                }
            });
        }

        const styleEl = document.createElement('style');
        styleEl.textContent = milestoneListRef.value.data.items
            .map(
                (a) =>
                    `.vis-custom-time.m-${a.id} { --_bg: ${a.color}; --_text: ${pickTextColor(a.color)}; }`
            )
            .join('\n');
        document.head.appendChild(styleEl);

        return () => {
            for (const id of ids) {
                currentTimeline.removeCustomTime(id);
            }
            document.head.removeChild(styleEl);
        };
    });

    const pickTextColor = (color: string): string => {
        const parsed = parse(color);
        if (!parsed) {
            return 'black';
        }
        const blackContrast = wcagContrast(parsed, 'black');
        const whiteContrast = wcagContrast(parsed, 'white');
        return blackContrast > whiteContrast ? 'black' : 'white';
    };
</script>

<div
    class="h-full px-4"
    {@attach (node) => {
        importVis.then((a) => {
            timeline = new a.Timeline(node, [], {
                height: '100%',
                maxHeight: '100%',
                showCurrentTime: true,
                groupOrder: (a, b) => {
                    if (a.startTime == null && b.startTime == null) {
                        return 0;
                    }
                    if (a.startTime == null) {
                        return 1;
                    }
                    if (b.startTime == null) {
                        return -1;
                    }

                    const adt = DateTime.fromISO(a.startTime, { zone: a.timelineZone }).toMillis();
                    const bdt = DateTime.fromISO(b.startTime, { zone: b.timelineZone }).toMillis();
                    return adt - bdt;
                },
                groupTemplate: function (group) {
                    const container = document.createElement('div');
                    const anchor = document.createElement('a');
                    anchor.href = `/${workspacePath}/projects/${projectIdentifier}/issues/${group.orderNumber}`;
                    anchor.className = 'absolute inset-0';
                    anchor.ariaLabel = group.content;
                    container.appendChild(anchor);
                    container.appendChild(document.createTextNode(group.content));
                    return container;
                },
                template: function (item) {
                    const el = document.createElement('a');
                    el.href = `/${workspacePath}/projects/${projectIdentifier}/issues/${item.orderNumber}`;
                    el.className = 'flex items-center p-1 w-full';
                    el.textContent = item.content;
                    return el;
                }
            });
        });
    }}
    style="border-radius: 2rem;"
></div>

<style>
    :global(.vis-item .vis-item-overflow) {
        overflow: visible !important;
    }

    :global(.vis-item) {
        background-color: var(--color-base-1) !important;
        border-color: var(--color-base-border-2) !important;
        border-radius: var(--radius-md) !important;
        @variant dark {
            background-color: var(--color-base-3) !important;
        }

        &:hover {
            color: var(--color-base-fg-1) !important;
            border-color: var(--color-base-border-1) !important;
            @variant dark {
                background-color: var(--color-base-3) !important;
            }
        }
    }

    :global(.vis-label, .vis-text, .vis-item) {
        color: var(--color-base-fg-2) !important;
    }

    :global(.vis-timeline) {
        border-radius: var(--radius-lg);
        border-color: var(--color-base-border-2) !important;
    }

    :global(.vis-group, .vis-label, .vis-panel, .vis-vertical) {
        border-color: var(--color-base-border-3) !important;
    }

    :global(.vis-group) {
        background-color: var(--color-base-2) !important;
        @variant dark {
            background-color: var(--color-base-1) !important;
        }
    }

    :global(.vis-item-content) {
        padding: 0 !important;
        display: flex !important;
    }

    :global(.vis-labelset .vis-label.vis-group-level-0) {
        display: flex !important;
        align-items: center !important;

        &:hover {
            color: var(--color-base-fg-1) !important;
            background-color: var(--color-base-2) !important;
            @variant dark {
                background-color: var(--color-base-3) !important;
            }
        }
    }

    :global(.vis-labelset .vis-label.vis-group-level-0 .vis-inner) {
        width: 100%;
    }

    :global(.vis-custom-time) {
        cursor: default !important;
    }

    :global(.vis-custom-time) {
        background-color: color-mix(in oklch, var(--_bg) 100%, transparent) !important;
    }

    :global(.vis-custom-time > .vis-custom-time-marker) {
        color: var(--_text) !important;
        font-weight: 500;
    }
</style>
