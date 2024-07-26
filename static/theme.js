const theme = localStorage.getItem('theme');
if (!theme || theme === 'system') {
	const prefers_dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	document.documentElement.setAttribute('data-theme', prefers_dark ? 'dark' : 'light');
} else {
	document.documentElement.setAttribute('data-theme', theme);
}
