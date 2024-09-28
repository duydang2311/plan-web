import { app } from '~/lib/elysia_api/server';
import type { RequestHandler } from './$types';

export const fallback: RequestHandler = ({ request }) => app.handle(request);
