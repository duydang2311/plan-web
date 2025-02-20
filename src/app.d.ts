// See https://kit.svelte.dev/docs/types#app

import type { Layer } from 'effect/Layer';
import 'unplugin-icons/types/svelte';
import type { Api } from './lib/api/server';
import type { ApiClient } from './lib/services/api_client.server';
import type { Cloudinary } from './lib/services/cloudinary.server';
import type { HttpClient } from './lib/services/http_client';
import type { Effect, Exit } from 'effect';
import type { IconName } from './lib/components/Icon.svelte';
import type { SvelteComponent } from 'svelte';

// for information about these interfaces
declare global {
    type MaybePromise<T> = T | PromiseLike<T>;

    interface RouteMeta {
        title: string;
        href: string;
        navigation?: {
            label: string;
            entries: {
                label: string;
                href: string;
                icon: typeof SvelteComponent;
                activeIcon: typeof SvelteComponent;
            }[];
        };
    }

    type SvelteIconComponent = typeof import('~icons/*').default;

    namespace App {
        interface Error {
            code: string;
        }

        interface Locals {
            runtime: {
                runPromise<A, E, R>(
                    effect: Effect.Effect<A, E, R>,
                    options?: { readonly signal?: AbortSignal } | undefined
                ): Promise<A>;
                runPromiseExit<A, E, R>(
                    effect: Effect.Effect<A, E, R>,
                    options?: { readonly signal?: AbortSignal } | undefined
                ): Promise<Exit.Exit<A, E>>;
            };
            appLive: Layer<HttpClient | ApiClient | Cloudinary>;
            user: {
                id: string;
            };
            api: Api;
        }
        interface PageData {
            routes?: (
                | { breadcrumb?: never }
                | {
                      breadcrumb: true;
                      meta: RouteMeta;
                  }
            )[];
        }
        interface PageState {
            showInvitationDialog?: boolean;
        }
        // interface Platform {}
    }

    interface Body {
        json<T = unknown>(): Promise<T>;
    }

    interface FormData {
        get<T = FormDataEntryValue>(name: string): T | null;
        getAll<T = FormDataEntryValue>(name: string): T[];
    }

    namespace Belt {
        type UseMutableArrays = 1;
    }
}

declare module '@tiptap/core' {
    export interface EditorEvents {
        submit: undefined;
    }
}
