// See https://kit.svelte.dev/docs/types#app

import type { Effect, Exit, Context } from 'effect';
import type { Layer } from 'effect/Layer';
import type { SvelteComponent } from 'svelte';
import 'unplugin-icons/types/svelte';
import type { Asset } from './lib/models/asset';
import type { ApiClient } from './lib/services/api_client.server';
import type { Cloudinary } from './lib/services/cloudinary.server';
import type { HttpClient } from './lib/services/http_client';
import type { PermissionService } from './lib/services/permission_service.server';

// for information about these interfaces
declare global {
    type MaybePromise<T> = T | PromiseLike<T>;

    type OneOf<A, B> =
        | ({ [key in keyof A]: A[key] } & { [key in keyof B]?: never })
        | ({ [key in keyof A]?: never } & { [key in keyof B]: B[key] });

    type SvelteIconComponent = typeof import('~icons/*').default;

    interface RouteMeta {
        title: string;
        href: string;
        navigation?: {
            label: string;
            entries: {
                label: string;
                href: string;
                icon: SvelteIconComponent;
                activeIcon: SvelteIconComponent;
            }[];
        };
    }

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
            appLive: Layer<ApiClient | Cloudinary | PermissionService>;
            user: {
                id: string;
                email: string;
                profile?: {
                    name: string;
                    displayName: string;
                    image?: Asset;
                };
            };
            api: Context.Tag.Service<HttpClient>;
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
        submit: void;
    }
}
