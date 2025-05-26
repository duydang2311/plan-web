import path from 'node:path';

// @ts-ignore
import raw from './emoji.json' with { type: 'json' };

const emojis = raw as {
    unified: string;
    non_qualified: string | null;
    name: string;
    short_names: string[];
    category: string;
    sort_order: number;
}[];

const grouped = emojis
    .toSorted((a, b) => a.sort_order - b.sort_order)
    .reduce(
        (acc, { category, unified, non_qualified, name, short_names }) => {
            if (!acc[category]) acc[category] = [];
            acc[category].push({
                unicode: String.fromCodePoint(
                    ...(name === 'EYE IN SPEECH BUBBLE' ? non_qualified! : unified)
                        .split('-')
                        .map((a) => parseInt(a, 16))
                ),
                name,
                shortNames: short_names,
            });
            return acc;
        },
        {} as Record<string, { unicode: string; name: string; shortNames: string[]; }[]>
    );

Bun.write(path.join(__dirname, '../../../static/emojis.json'), JSON.stringify(grouped));
