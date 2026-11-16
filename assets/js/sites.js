/* Field sites map: dots on a map of Japan, a photo card on hover, a slideshow on click.
   Site data lives in assets/js/sites-data.js (window.FIELD_SITES). */
(function () {
	var sites = window.FIELD_SITES || [];
	var mapEl = document.getElementById('sites-map');
	if (!mapEl || !window.L || !sites.length) return;

	// Image paths are relative to the site root, so the map also works on /ja/.
	var script = document.currentScript;
	var root = script ? script.src.replace(/assets\/js\/sites\.js(\?.*)?$/, '') : '';

	// Japanese labels (assets/js/sites-ja.js) on pages with <html lang="ja">.
	var ja = document.documentElement.lang === 'ja' ? window.FIELD_SITES_JA : null;
	var T = ja ? ja.ui : { view: 'view photos', photo: 'Photo', by: 'Photo: ', sep: ', ' };
	var countLabel = ja ? function (n) { return '写真' + n + '枚 · クリックで表示'; } : function (n) { return n + ' photos · click to view'; };
	if (ja) {
		sites = sites.map(function (s) {
			var o = {};
			for (var k in s) o[k] = s[k];
			var tr = ja.sites[s.id] || {};
			for (var t in tr) o[t] = tr[t];
			o.photos = s.photos.map(function (p) {
				return { caption: ja.captions[p.caption] || p.caption, credit: p.credit, aerial: p.aerial };
			});
			return o;
		});
	}

	window.SITES_MAP = window.SITES_MAP || {};

	var base = function (site, file) { return root + 'images/sites/' + site.id + '/' + file; };
	var thumb = function (site, i) { return base(site, (i + 1) + '-s.jpg'); };
	var full = function (site, i) { return base(site, (i + 1) + '.jpg'); };

	// ---------- Map ----------
	var map = L.map(mapEl, { scrollWheelZoom: false, zoomSnap: 0.25, minZoom: 4, maxZoom: 10 });
	L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community',
		maxZoom: 10
	}).addTo(map);

	var bounds = L.latLngBounds(sites.map(function (s) { return [s.lat, s.lon]; }));
	var fit = function () { map.fitBounds(bounds, { padding: [24, 24] }); };
	fit();
	// Let people scroll the page past the map; enable wheel zoom once they click into it.
	map.on('click', function () { map.scrollWheelZoom.enable(); });
	mapEl.addEventListener('mouseleave', function () { map.scrollWheelZoom.disable(); });

	var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

	sites.forEach(function (s) {
		var marker = L.circleMarker([s.lat, s.lon], {
			radius: 8, weight: 2, color: '#ffffff', fillColor: s.tara ? '#00aaff' : '#ff7a45', fillOpacity: 0.95
		}).addTo(map);
		var cover = s.cover || 0;
		marker.bindTooltip(
			'<div class="site-card"><img src="' + thumb(s, cover) + '" alt="" width="240" height="160" loading="lazy" />' +
			'<strong>' + esc(s.name) + '</strong><span>' + esc(s.when) + (s.project ? ' · ' + esc(s.project) : '') + '</span>' +
			'<em>' + countLabel(s.photos.length) + '</em></div>',
			{ direction: 'top', offset: [0, -8], className: 'site-tooltip', opacity: 1 }
		);
		marker.on('mouseover', function () { marker.setStyle({ radius: 11 }); });
		marker.on('mouseout', function () { marker.setStyle({ radius: 8 }); });
		marker.on('click', function () { openViewer(s, 0); });
		// Keyboard access: each dot can be tabbed to and opened with Enter/Space.
		var el = marker.getElement();
		if (el) {
			el.setAttribute('tabindex', '0');
			el.setAttribute('role', 'button');
			el.setAttribute('aria-label', s.name + T.sep + s.when + ': ' + T.view);
			el.addEventListener('focus', function () { marker.openTooltip(); });
			el.addEventListener('blur', function () { marker.closeTooltip(); });
			el.addEventListener('keydown', function (e) {
				if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openViewer(s, 0); }
			});
		}
		s._marker = marker;
	});

	// ---------- Slideshow ----------
	var viewer = document.getElementById('site-viewer');
	var img = viewer.querySelector('.sv-image');
	var title = viewer.querySelector('.sv-title');
	var meta = viewer.querySelector('.sv-meta');
	var caption = viewer.querySelector('.sv-caption');
	var counter = viewer.querySelector('.sv-counter');
	var strip = viewer.querySelector('.sv-strip');
	var current = null, idx = 0, lastFocus = null;

	function show(i) {
		var n = current.photos.length;
		idx = (i + n) % n;
		var p = current.photos[idx];
		img.classList.add('loading');
		img.onload = function () { img.classList.remove('loading'); };
		img.src = full(current, idx);
		img.alt = p.caption || current.name;
		caption.textContent = (p.caption || '') + (p.credit ? ' · ' + T.by + p.credit : '');
		counter.textContent = (idx + 1) + ' / ' + n;
		Array.prototype.forEach.call(strip.children, function (b, j) { b.classList.toggle('active', j === idx); });
		var active = strip.children[idx];
		if (active) active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
		// preload neighbours
		[idx + 1, idx - 1].forEach(function (j) { new Image().src = full(current, (j + n) % n); });
	}

	function openViewer(site, i) {
		current = site; lastFocus = document.activeElement;
		if (site._marker) site._marker.closeTooltip();
		title.textContent = site.name;
		meta.textContent = site.when + (site.project ? ' · ' + site.project : '') + (site.note ? ' · ' + site.note : '');
		strip.innerHTML = '';
		site.photos.forEach(function (p, j) {
			var b = document.createElement('button');
			b.type = 'button'; b.setAttribute('aria-label', T.photo + ' ' + (j + 1));
			b.innerHTML = '<img src="' + thumb(site, j) + '" alt="" loading="lazy" />';
			b.addEventListener('click', function () { show(j); });
			strip.appendChild(b);
		});
		if (window.SITES_MAP.onOpen) window.SITES_MAP.onOpen(site);
		viewer.hidden = false;
		document.body.classList.add('sv-open');
		show(i);
		viewer.querySelector('.sv-close').focus();
	}

	function closeViewer() {
		viewer.hidden = true; img.src = '';
		document.body.classList.remove('sv-open');
		if (lastFocus) lastFocus.focus();
	}

	viewer.querySelector('.sv-close').addEventListener('click', closeViewer);
	viewer.querySelector('.sv-prev').addEventListener('click', function () { show(idx - 1); });
	viewer.querySelector('.sv-next').addEventListener('click', function () { show(idx + 1); });
	viewer.addEventListener('click', function (e) { if (e.target === viewer) closeViewer(); });
	document.addEventListener('keydown', function (e) {
		if (viewer.hidden) return;
		if (e.key === 'Escape') closeViewer();
		else if (viewer.classList.contains('sv-data-mode')) return;
		else if (e.key === 'ArrowRight') show(idx + 1);
		else if (e.key === 'ArrowLeft') show(idx - 1);
	});
	// swipe on touch screens
	var x0 = null;
	img.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
	img.addEventListener('touchend', function (e) {
		if (x0 === null) return;
		var dx = e.changedTouches[0].clientX - x0; x0 = null;
		if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
	});

	var reset = document.getElementById('sites-reset');
	if (reset) reset.addEventListener('click', fit);

	// Hook for field-panel.js (data tab, colour-by switch).
	window.SITES_MAP = window.SITES_MAP || {};
	window.SITES_MAP.map = map; window.SITES_MAP.sites = sites;
})();
