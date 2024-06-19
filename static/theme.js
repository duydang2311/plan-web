const theme = localStorage.getItem('theme');
if (theme === 'dark' || theme === 'light') {
	document.documentElement.setAttribute('data-theme', theme);
} else {
	const prefers_dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	const theme = prefers_dark ? 'dark' : 'light';
	document.documentElement.setAttribute('data-theme', theme);
	localStorage.setItem('theme', 'system');
}
