import type { RequestHandler } from './$types';

export const fallback: RequestHandler = () => {
    return Response.json(null);
};
