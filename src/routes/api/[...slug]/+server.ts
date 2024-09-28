import type { RequestHandler } from './$types';

// export const fallback: RequestHandler = async ({ request, locals: { api } }) => api.handle(request);
export const fallback: RequestHandler = ({ request, locals: { api } }) => {
    return new Response('hello', { status: 200 });
};
