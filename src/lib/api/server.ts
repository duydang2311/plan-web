import { Hono } from 'hono';
import { hc } from 'hono/client';
import { install_base } from './middlewares/install_base';
import type { ApiClient } from '../services/api_client.server';
import type { HonoContext } from './services/hono_context';
import type { ManagedRuntime } from 'effect/ManagedRuntime';
import * as routes from './routes';

export const app = new Hono()
    // .use(install_base)
    .basePath('/api')
    // .route('/', routes.issues)
    // .route('/', routes.issueComments)
    // .route('/', routes.teamMembers)
    // .route('/', routes.users)
    // .route('/', routes.workspaces)
    .get('/hello', (c) => {
        return c.text('hello');
    });

export interface Environment {
    Variables?: {
        runtime: ManagedRuntime<ApiClient | HonoContext, never>;
    };
    Bindings?: object;
}

export type Api = typeof app;
export type Rpc = ReturnType<typeof hc<Api>>;
