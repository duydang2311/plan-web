/** @type {import('tailwindcss').Config} */
export default {
    theme: {
        extend: {
            typography: () => ({
                DEFAULT: {
                    css: {
                        h1: {
                            fontSize: 'var(--font-size-h1)'
                        },
                        h2: {
                            fontSize: 'var(--font-size-h2)'
                        },
                        h3: {
                            fontSize: 'var(--font-size-h3)'
                        },
                        h4: {
                            fontSize: 'var(--font-size-h4)'
                        },
                        h5: {
                            fontSize: 'var(--font-size-h5)'
                        },
                        h6: {
                            fontSize: 'var(--font-size-h6)'
                        },
                        a: {
                            textDecoration: 'inherit'
                        },
                        '--tw-prose-headings': 'var(--color-base-fg-1)',
                        '--tw-prose-body': 'var(--color-base-fg-2)',
                        '--tw-prose-bold': 'var(--color-base-fg-2)',
                        '--tw-prose-links': 'var(--color-info-1)',
                        '--tw-prose-hr': 'var(--color-base-border-2)',
                        '--tw-prose-code': 'var(--color-base-fg-1)',
                        '--tw-prose-pre-code': 'var(--color-base-fg-1)',
                        '--tw-prose-pre-bg': 'var(--color-base-3)',
                        '--tw-prose-quotes': 'var(--color-base-fg-4)',
                        '--tw-prose-quote-borders': 'var(--color-base-5)'
                    }
                }
            })
        }
    }
};
