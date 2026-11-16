/* Field data for the site map: a "Field data" tab in the photo viewer (fieldwork, corals recorded,
   seafloor cover, CTD, Shidagaura monitoring chart) and a "Colour by" switch for the map dots.
   Data: assets/js/sites-field.js (window.SITE_FIELD) and, optionally, the unpublished TARA-JAMBIO
   results in assets/js/sites-field-unpublished.js (window.SITE_FIELD_UNPUBLISHED). */
(function () {
	'use strict';
	var M = window.SITES_MAP, F = window.SITE_FIELD;
	if (!M || !F) return;
	var U = window.SITE_FIELD_UNPUBLISHED || {};
	var JA = document.documentElement.lang === 'ja';

	var S = JA ? {
		photos: '写真', data: 'フィールドデータ', fieldwork: '調査内容', corals: '確認されたサンゴ', cover: '海底の被度', ctd: '水質（CTD観測）',
		monitoring: '長期モニタリング：志田ヶ浦', unpublished: '未発表データ・プレビュー', noCorals: 'この地点のサンゴの記録はまだありません。',
		unidentified: '同定していないサンゴ', quadrats: function (q, p) { return '方形枠 ' + q + ' 個・' + p.toLocaleString() + ' 点の点数法'; },
		stations: 'CTD観測点', temp: '水温', sal: '塩分（中央値）', chl: 'クロロフィル（中央値）', processing: 'データ整理中',
		colourBy: '色分け：', byProject: 'プロジェクト', byCorals: 'サンゴの属数', byCover: 'サンゴ被度',
		tara: 'TARA-JAMBIO ブルーカーボン調査', other: 'その他の調査地', noData: 'データなし', genera: function (n) { return n + ' 属'; },
		coverNote: '* 下田は志田ヶ浦の長期モニタリングの平均値', credit: '下田臨海実験センターによる月例モニタリング（永久方形枠）',
		series: { coral: '健全なサンゴ', gelidium: 'マクサ（<em>Gelidium</em>）', disease: 'サンゴの病気' }, pct: '被度（%）',
		months: function (d) { return d.getFullYear() + '年' + (d.getMonth() + 1) + '月'; }
	} : {
		photos: 'Photos', data: 'Field data', fieldwork: 'Fieldwork', corals: 'Corals recorded', cover: 'Seafloor cover', ctd: 'Water column (CTD)',
		monitoring: 'Long-term monitoring: Shidagaura', unpublished: 'Unpublished · preview only', noCorals: 'No coral records for this site yet.',
		unidentified: 'unidentified corals', quadrats: function (q, p) { return q + ' photo quadrats · ' + p.toLocaleString() + ' points'; },
		stations: 'CTD stations', temp: 'Temperature', sal: 'Salinity (median)', chl: 'Chlorophyll (median)', processing: 'data in processing',
		colourBy: 'Colour by:', byProject: 'Project', byCorals: 'Coral genera', byCover: 'Coral cover',
		tara: 'TARA-JAMBIO Blue Carbon surveys', other: 'Other research sites', noData: 'No data', genera: function (n) { return n + (n === 1 ? ' genus' : ' genera'); },
		coverNote: '* Shimoda: mean of the Shidagaura long-term monitoring', credit: 'Monthly permanent-quadrat monitoring, Shimoda Marine Research Center',
		series: { coral: 'Healthy coral', gelidium: '<em>Gelidium</em> algae', disease: 'Coral disease' }, pct: 'Cover (%)',
		months: function (d) { return d.toLocaleString('en', { month: 'short', year: 'numeric' }); }
	};
	var METHODS = JA ? {
		quadrat: '方形枠写真（被度）', belt: 'ベルトトランセクト動画', urchin: 'ウニの計数', fish: '魚類調査', ctd: 'CTD観測',
		loggers: '水温・溶存酸素・光ロガー', pco2: 'pCO₂センサー', pam: '藻類の光合成（PAM）', drone: 'ドローン空撮', airlift: 'エアリフト採集',
		timelapse: 'タイムラプスカメラ', seagrass: '海草調査', biomass: '藻類の現存量', photos: '写真記録', permquadrat: '月例の永久方形枠',
		disease: 'サンゴの病気の観察', experiments: '感染実験', transplants: 'CO₂勾配に沿ったサンゴ・芝状藻類の移植', microsensors: 'マイクロセンサー計測',
		carbchem: '海水の炭酸系', phgradient: 'pH勾配に沿った調査', arms: 'ARMS（岩礁モニタリング構造物）'
	} : {
		quadrat: 'Photo quadrats (benthic cover)', belt: 'Belt-transect video', urchin: 'Urchin counts', fish: 'Fish surveys', ctd: 'CTD profiles',
		loggers: 'Temperature, oxygen & light loggers', pco2: 'pCO₂ sensor', pam: 'Algal photosynthesis (PAM)', drone: 'Drone mapping',
		airlift: 'Airlift sampling', timelapse: 'Time-lapse cameras', seagrass: 'Seagrass surveys', biomass: 'Algal biomass', photos: 'Photo survey',
		permquadrat: 'Monthly permanent quadrats', disease: 'Coral disease observations', experiments: 'Infection experiments',
		transplants: 'Coral–turf transplants along the CO₂ gradient', microsensors: 'Microsensor profiles', carbchem: 'Seawater carbonate chemistry',
		phgradient: 'Surveys along a pH gradient', arms: 'ARMS settlement units'
	};
	var PROJECTS = JA ? { tara: 'TARA-JAMBIO', monitoring: '下田臨海実験センター モニタリング', phd: '博士課程の研究', seeps: '天然CO₂湧出域', reef: 'サンゴ礁の野外調査', seto: '瀬戸内海の調査' }
		: { tara: 'TARA-JAMBIO', monitoring: 'SMRC monitoring', phd: 'Ph.D. research', seeps: 'Natural CO₂ seeps', reef: 'Coral reef fieldwork', seto: 'Seto Inland Sea surveys' };
	// Seafloor cover classes, in fixed categorical-slot order (blue, orange, aqua, yellow, magenta, green), neutrals last.
	var CLASSES = [
		['coral', JA ? 'サンゴ' : 'Coral', '#2a78d6'], ['turf', JA ? '芝状藻類' : 'Turf algae', '#eb6834'],
		['canopy', JA ? 'ホンダワラ類・ワカメ' : 'Sargassum & kelp', '#1baf7a'], ['macro', JA ? 'その他の海藻' : 'Other seaweeds', '#eda100'],
		['coralline', JA ? 'サンゴモ' : 'Coralline algae', '#e87ba4'], ['inverts', JA ? '無脊椎動物' : 'Invertebrates', '#008300'],
		['bare', JA ? '裸地' : 'Bare substrate', '#a3a29c'], ['other', JA ? 'その他' : 'Other', '#d6d5d0']
	];
	var SERIES = [['coral', '#2a78d6'], ['gelidium', '#eb6834'], ['disease', '#1baf7a']];

	var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
	var fmtDate = function (d) {
		var m = /^(\d{4})-(\d{2})$/.exec(d);
		return m ? S.months(new Date(+m[1], +m[2] - 1, 15)) : d;
	};

	// ---------- the viewer tab ----------
	var viewer = document.getElementById('site-viewer');
	var head = viewer.querySelector('.sv-head > div');
	var panel = viewer.querySelector('.sv-panel');
	var tabs = document.createElement('div');
	tabs.className = 'sv-tabs'; tabs.setAttribute('role', 'tablist');
	tabs.innerHTML = '<button type="button" role="tab" data-mode="photos" aria-selected="true">' + S.photos + '</button>' +
		'<button type="button" role="tab" data-mode="data" aria-selected="false">' + S.data + '</button>';
	head.appendChild(tabs);
	var box = document.createElement('div');
	box.className = 'sv-data'; box.hidden = true;
	panel.insertBefore(box, viewer.querySelector('.sv-stage'));
	var current = null;

	function setMode(mode) {
		viewer.classList.toggle('sv-data-mode', mode === 'data');
		box.hidden = mode !== 'data';
		Array.prototype.forEach.call(tabs.children, function (b) { b.setAttribute('aria-selected', b.dataset.mode === mode ? 'true' : 'false'); });
		if (mode === 'data') { box.innerHTML = render(current); box.scrollTop = 0; wireChart(box); }
	}
	tabs.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) setMode(b.dataset.mode); });
	M.onOpen = function (site) { current = site; setMode('photos'); };

	function section(title, body, badge) {
		return '<section class="fd-sec"><h5>' + title + (badge ? ' <span class="fd-badge">' + S.unpublished + '</span>' : '') + '</h5>' + body + '</section>';
	}

	function render(site) {
		var f = (F.sites || {})[site.id] || {}, u = U[site.id] || {}, out = '';
		if (f.surveys && f.surveys.length) {
			out += section(S.fieldwork, '<ul class="fd-surveys">' + f.surveys.map(function (s) {
				return '<li><b>' + esc(fmtDate(s.date)) + '</b> · ' + esc(PROJECTS[s.project] || s.project) +
					(s.status ? ' <span class="fd-muted">(' + S.processing + ')</span>' : '') +
					'<div class="fd-chips">' + s.methods.map(function (m) { return '<span>' + esc(METHODS[m] || m) + '</span>'; }).join('') + '</div></li>';
			}).join('') + '</ul>');
		}
		var c = f.corals;
		out += section(S.corals, c ? '<div class="fd-chips fd-genera">' + c.genera.map(function (g) {
			return '<span>' + (/family/.test(g) ? esc(g.replace(' (family)', '')) + (JA ? '（科）' : ' (family)') : '<i>' + esc(g) + '</i>') + '</span>';
		}).join('') + (c.unidentified ? '<span class="fd-plain">+ ' + S.unidentified + '</span>' : '') + '</div>' +
			(c.species ? '<p class="fd-muted">' + c.species.map(function (s) { return '<i>' + esc(s) + '</i>'; }).join(', ') + '</p>' : '')
			: '<p class="fd-muted">' + S.noCorals + '</p>');
		if (u.cover) out += section(S.cover, coverChart(u.cover), true);
		if (u.ctd) {
			out += section(S.ctd, '<div class="fd-stats">' +
				stat(S.temp, u.ctd.temp[0] + '–' + u.ctd.temp[1] + ' °C') + stat(S.sal, u.ctd.sal + ' PSU') +
				stat(S.chl, u.ctd.chl + ' µg/L') + stat(S.stations, u.ctd.stations) + '</div>', true);
		}
		if (f.monitoring) out += section(S.monitoring, lineChart(f.monitoring));
		return out;
	}
	function stat(label, value) { return '<div><span>' + label + '</span><b>' + value + '</b></div>'; }

	// ---------- seafloor cover: one 100% stacked bar + legend table ----------
	function coverChart(cv) {
		var x = 0, segs = '', rows = '';
		CLASSES.forEach(function (k) {
			var v = cv.classes[k[0]] || 0;
			if (v > 0) {
				segs += '<span class="fd-seg" style="left:' + x + '%;width:' + v + '%;background:' + k[2] + '" data-tip="' + esc(k[1]) + ': ' + v + '%"></span>';
				x += v;
			}
			rows += '<li' + (v ? '' : ' class="fd-zero"') + '><i style="background:' + k[2] + '"></i>' + esc(k[1]) + '<b>' + v + '%</b></li>';
		});
		return '<p class="fd-muted">' + esc(fmtDate(cv.date)) + ' · ' + S.quadrats(cv.quadrats, cv.points) + '</p>' +
			'<div class="fd-bar" role="img" aria-label="' + esc(S.cover) + '">' + segs + '</div><ul class="fd-legend">' + rows + '</ul>';
	}

	// ---------- Shidagaura monitoring: line chart with crosshair tooltip ----------
	function lineChart(mon) {
		var seen = {}, pts = mon.points.filter(function (p) { if (seen[p.d]) return false; seen[p.d] = 1; return true; });
		var W = 640, H = 250, L = 38, R = 104, T = 12, B = 26;
		var t0 = Date.parse(pts[0].d), t1 = Date.parse(pts[pts.length - 1].d);
		var ymax = 10 * Math.ceil(Math.max.apply(null, pts.map(function (p) { return Math.max(p.coral, p.gelidium, p.disease); })) / 10);
		var X = function (d) { return L + (Date.parse(d) - t0) / (t1 - t0) * (W - L - R); };
		var Y = function (v) { return T + (1 - v / ymax) * (H - T - B); };
		var g = '';
		for (var v = 0; v <= ymax; v += 10) g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" class="fd-grid"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '</text>';
		for (var yr = new Date(t0).getFullYear() + 1; yr <= new Date(t1).getFullYear(); yr++) {
			var xx = X(yr + '-01-01');
			g += '<text x="' + xx + '" y="' + (H - 6) + '" text-anchor="middle">' + yr + '</text>';
		}
		var lines = '', labels = [];
		SERIES.forEach(function (s) {
			lines += '<polyline fill="none" stroke="' + s[1] + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="' +
				pts.map(function (p) { return X(p.d).toFixed(1) + ',' + Y(p[s[0]]).toFixed(1); }).join(' ') + '"/>';
			labels.push([s, Y(pts[pts.length - 1][s[0]])]);
		});
		labels.sort(function (a, b) { return a[1] - b[1]; });
		for (var i = 1; i < labels.length; i++) if (labels[i][1] - labels[i - 1][1] < 14) labels[i][1] = labels[i - 1][1] + 14;
		var lab = labels.map(function (l) {
			return '<text x="' + (W - R + 8) + '" y="' + (l[1] + 4) + '" class="fd-direct">' + S.series[l[0][0]].replace(/<\/?em>/g, '') + '</text>';
		}).join('');
		var legend = '<ul class="fd-legend fd-legend-row">' + SERIES.map(function (s) { return '<li><i style="background:' + s[1] + '"></i>' + S.series[s[0]] + '</li>'; }).join('') + '</ul>';
		return '<p class="fd-muted">' + S.credit + ' · ' + esc(fmtDate(mon.from)) + '–' + esc(fmtDate(mon.to)) + ' · ' + mon.surveys + (JA ? ' 回' : ' surveys') + '</p>' + legend +
			'<div class="fd-chart" data-pts=\'' + JSON.stringify(pts.map(function (p) { return [p.d, p.coral, p.gelidium, p.disease, +X(p.d).toFixed(1)]; })) + '\' data-geo="' + [W, H, T, B, ymax].join(',') + '">' +
			'<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(S.monitoring) + '"><g class="fd-axis">' + g + '</g>' + lines + lab +
			'<line class="fd-cross" y1="' + T + '" y2="' + (H - B) + '" x1="-10" x2="-10"/><g class="fd-dots"></g>' +
			'<rect x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (H - T - B) + '" fill="transparent" class="fd-hit"/></svg>' +
			'<div class="fd-tip" hidden></div></div><p class="fd-muted fd-axisnote">' + S.pct + '</p>';
	}

	function wireChart(root) {
		// cover-bar segment tooltips
		var tip = document.createElement('div'); tip.className = 'fd-tip'; tip.hidden = true;
		root.querySelectorAll('.fd-bar').forEach(function (bar) {
			bar.style.position = 'relative'; bar.appendChild(tip);
			bar.addEventListener('mousemove', function (e) {
				var s = e.target.closest('.fd-seg'); if (!s) { tip.hidden = true; return; }
				tip.textContent = s.dataset.tip; tip.hidden = false;
				var r = bar.getBoundingClientRect(); tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = '-2.2em';
			});
			bar.addEventListener('mouseleave', function () { tip.hidden = true; });
		});
		root.querySelectorAll('.fd-chart').forEach(function (ch) {
			var pts = JSON.parse(ch.dataset.pts), geo = ch.dataset.geo.split(',').map(Number);
			var svg = ch.querySelector('svg'), cross = ch.querySelector('.fd-cross'), dots = ch.querySelector('.fd-dots'), t = ch.querySelector('.fd-tip');
			var Y = function (v) { return geo[2] + (1 - v / geo[4]) * (geo[1] - geo[2] - geo[3]); };
			function move(cx) {
				var r = svg.getBoundingClientRect(), x = (cx - r.left) / r.width * geo[0];
				var best = pts[0]; pts.forEach(function (p) { if (Math.abs(p[4] - x) < Math.abs(best[4] - x)) best = p; });
				cross.setAttribute('x1', best[4]); cross.setAttribute('x2', best[4]);
				dots.innerHTML = SERIES.map(function (s, i) { return '<circle cx="' + best[4] + '" cy="' + Y(best[i + 1]) + '" r="4" fill="' + s[1] + '" stroke="#fff" stroke-width="2"/>'; }).join('');
				var d = new Date(best[0]);
				t.innerHTML = '<b>' + S.months(d) + '</b>' + SERIES.map(function (s, i) { return '<span><i style="background:' + s[1] + '"></i>' + S.series[s[0]] + ' <b>' + best[i + 1] + '%</b></span>'; }).join('');
				t.hidden = false;
				var px = best[4] / geo[0] * r.width;
				t.style.left = Math.min(Math.max(px, 70), r.width - 70) + 'px';
			}
			svg.addEventListener('mousemove', function (e) { move(e.clientX); });
			svg.addEventListener('touchmove', function (e) { move(e.touches[0].clientX); }, { passive: true });
			svg.addEventListener('mouseleave', function () { t.hidden = true; dots.innerHTML = ''; cross.setAttribute('x1', -10); cross.setAttribute('x2', -10); });
		});
	}

	// ---------- map: colour by project / coral genera / coral cover ----------
	var legend = document.querySelector('.sites-legend'), reset = document.getElementById('sites-reset');
	if (!legend) return;
	var GRAY = '#c9c8c3', BLUES = ['#86b6ef', '#3987e5', '#1c5cab', '#0d366b'];
	var ctl = document.createElement('div');
	ctl.className = 'fd-colour';
	ctl.innerHTML = '<span>' + S.colourBy + '</span>' + [['project', S.byProject], ['corals', S.byCorals], ['cover', S.byCover]].map(function (m, i) {
		return '<button type="button" data-by="' + m[0] + '" aria-pressed="' + (i ? 'false' : 'true') + '">' + m[1] + '</button>';
	}).join('');
	legend.insertBefore(ctl, legend.firstChild);
	var keyBox = document.createElement('span'); keyBox.className = 'fd-key';
	var oldKeys = Array.prototype.filter.call(legend.children, function (n) { return n !== ctl && n !== reset; });
	legend.insertBefore(keyBox, reset);
	oldKeys.forEach(function (n) { keyBox.appendChild(n); });
	var projectKey = keyBox.innerHTML;

	function coverValue(id) {
		var f = (F.sites || {})[id] || {}, u = U[id] || {};
		if (f.monitoring) { var p = f.monitoring.points; return { v: p.reduce(function (a, b) { return a + b.coral; }, 0) / p.length, star: true }; }
		if (u.cover) return { v: u.cover.classes.coral };
		return null;
	}
	function colourBy(by) {
		Array.prototype.forEach.call(ctl.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', b.dataset.by === by ? 'true' : 'false'); });
		var note = '';
		M.sites.forEach(function (s) {
			var col;
			if (by === 'project') col = s.tara ? '#00aaff' : '#ff7a45';
			else if (by === 'corals') {
				var c = ((F.sites || {})[s.id] || {}).corals, n = c ? c.genera.length + (c.unidentified && !c.genera.length ? 1 : 0) : 0;
				col = n ? BLUES[Math.min(n, 4) - 1] : GRAY;
			} else {
				var cv = coverValue(s.id);
				col = !cv ? GRAY : cv.v < 1 ? BLUES[0] : cv.v < 10 ? BLUES[1] : cv.v < 25 ? BLUES[2] : BLUES[3];
				if (cv && cv.star) note = '<span class="fd-muted">' + S.coverNote + '</span>';
			}
			if (s._marker) s._marker.setStyle({ fillColor: col });
		});
		if (by === 'project') keyBox.innerHTML = projectKey;
		else if (by === 'corals') keyBox.innerHTML = [1, 2, 3, 4].map(function (n) { return '<span><span class="dot" style="background:' + BLUES[n - 1] + '"></span>' + S.genera(n) + (n === 4 ? '+' : '') + '</span>'; }).join('') +
			'<span><span class="dot" style="background:' + GRAY + '"></span>' + S.noData + '</span>';
		else keyBox.innerHTML = [['<1%', 0], ['1–10%', 1], ['10–25%', 2], ['25%+', 3]].map(function (k) { return '<span><span class="dot" style="background:' + BLUES[k[1]] + '"></span>' + k[0] + '</span>'; }).join('') +
			'<span><span class="dot" style="background:' + GRAY + '"></span>' + S.noData + '</span>' + note;
	}
	ctl.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) colourBy(b.dataset.by); });
})();
