import { env } from '$env/dynamic/private';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, fetch }) => {
    const json = await request.json<{ title: string; description?: string }>();
    const prompt =
        `I'll give you a task title and an optional description.
Your job is to generate a checklist of clear, actionable steps.
Make sure the checklist is in the same language as the provided title and description.
Don't include numbering or ordering.
Title: ${json.title}.` + (json.description ? ` Description: ${json.description}` : '').trim();

    return fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
            method: 'POST',
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'ARRAY',
                        items: {
                            type: 'STRING'
                        }
                    }
                }
            })
        }
    );
};
