const theme = localStorage.getItem('theme');
if (!theme || theme === 'system') {
	const prefers_dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	const theme = prefers_dark ? 'dark' : 'light';
	document.documentElement.setAttribute('data-theme', theme);
	if (!theme) {
		localStorage.setItem('theme', 'system');
	}
} else {
	document.documentElement.setAttribute('data-theme', theme);
}
