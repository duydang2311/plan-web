import type { RequestHandler } from './$types';

export const fallback: RequestHandler = async ({ request, locals: { api } }) => api.fetch(request);
