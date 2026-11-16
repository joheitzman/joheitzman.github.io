/* Page behaviour for the refreshed layout: mobile menu, active nav link,
   top-bar shadow and the back-to-top button. Replaces the theme's main.js. */
(function () {
	'use strict';
	var body = document.body;
	window.addEventListener('load', function () { body.classList.remove('is-preload'); });

	var bar = document.getElementById('topbar');
	var toggle = bar && bar.querySelector('.nav-toggle');
	var links = Array.prototype.slice.call(document.querySelectorAll('#nav a[href^="#"]'));
	var toTop = document.querySelector('.to-top');

	// Mobile menu
	var setOpen = function (open) {
		bar.classList.toggle('open', open);
		toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
	};
	if (toggle) {
		toggle.addEventListener('click', function () { setOpen(!bar.classList.contains('open')); });
		links.forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
		document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
		document.addEventListener('click', function (e) { if (!bar.contains(e.target)) setOpen(false); });
	}

	// Top-bar shadow and back-to-top visibility
	var onScroll = function () {
		var y = window.scrollY || window.pageYOffset;
		bar.classList.toggle('scrolled', y > 8);
		if (toTop) toTop.classList.toggle('show', y > window.innerHeight * 0.9);
	};
	window.addEventListener('scroll', onScroll, { passive: true });
	onScroll();

	// Highlight the nav link for the section in view
	if ('IntersectionObserver' in window) {
		var byId = {};
		links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
		var visible = {};
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
			var current = null;
			links.forEach(function (a) { var id = a.getAttribute('href').slice(1); if (visible[id] && !current) current = id; });
			links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href').slice(1) === current); });
		}, { rootMargin: '-45% 0px -50% 0px' });
		Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
	}
})();
