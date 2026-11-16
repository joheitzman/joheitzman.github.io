"""Regenerate the "All publications" list from researchmap.

Fetches the public researchmap listing for the account in publications.json,
fills any missing volume or article number from Crossref, and rewrites the block
between the PUBLICATIONS markers in each page listed in the config. Pages are only
written when the list changes. Standard library only, so it runs on a bare
GitHub Actions runner:

    python scripts/update_publications.py            # update the pages
    python scripts/update_publications.py --dry-run  # print the list, change nothing
"""
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = json.load(open(os.path.join(ROOT, 'scripts', 'publications.json'), encoding='utf-8'))
UA = {'User-Agent': 'publication-list-updater/1.0 (static site script)'}
START, END = '<!-- PUBLICATIONS:START', '<!-- PUBLICATIONS:END -->'


def get_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def lang(field):
    """researchmap stores text as {"en": ..., "ja": ...}; prefer English."""
    if isinstance(field, dict):
        return field.get('en') or field.get('ja') or ''
    return field or ''


def researchmap_papers(rid):
    items, start = [], 1
    while True:
        url = f'https://api.researchmap.jp/{urllib.parse.quote(rid)}/published_papers?format=json&limit=100&start={start}'
        data = get_json(url)
        batch = data.get('items', [])
        items += batch
        if not batch or len(items) >= data.get('total_items', 0):
            return items
        start += len(batch)


def crossref(doi):
    try:
        return get_json('https://api.crossref.org/works/' + urllib.parse.quote(doi, safe='/')).get('message', {})
    except Exception as e:  # Crossref is only a fallback; never fail the run over it
        print(f'  Crossref lookup failed for {doi}: {e}', file=sys.stderr)
        return {}


SAFE_TAGS = re.compile(r'&lt;(/?)(sub|sup|i|em|b)&gt;', re.I)


def clean_title(t):
    t = html.escape(html.unescape(re.sub(r'\s+', ' ', t).strip()), quote=False)
    t = SAFE_TAGS.sub(lambda m: f'<{m.group(1)}{m.group(2).lower()}>', t)   # keep CO<sub>2</sub> etc.
    return t if t.endswith(('.', '?', '!')) else t + '.'


def initials(given):
    out = []
    for part in given.split():
        out.append('-'.join(p[0] + '.' for p in part.split('-') if p))
    return ''.join(out)


def format_author(name, highlight):
    name = re.sub(r'\s+', ' ', name).strip()
    if re.search(r'[぀-ヿ㐀-鿿]', name):        # Japanese name: keep as written
        text = name
    elif ',' in name:
        last, given = [x.strip() for x in name.split(',', 1)]
        text = f'{last}, {initials(given)}'
    else:
        parts = name.split(' ')
        text = f'{parts[-1]}, {initials(" ".join(parts[:-1]))}' if len(parts) > 1 else name
    text = html.escape(text, quote=False)
    return f'<b>{text}</b>' if highlight and highlight.lower() in name.lower() else text


def entry_from_researchmap(it, highlight):
    doi = ((it.get('identifiers') or {}).get('doi') or [None])[0]
    authors = it.get('authors') or {}
    names = [a.get('name', '') for a in (authors.get('en') or authors.get('ja') or [])]
    date = it.get('publication_date') or ''
    journal, volume, number = lang(it.get('publication_name')), it.get('volume'), it.get('number')
    pages = it.get('starting_page') or ''
    if it.get('ending_page') and it['ending_page'] != pages:
        pages = f'{pages}–{it["ending_page"]}'
    if doi and not (journal and volume and pages):
        cr = crossref(doi)
        journal = journal or (cr.get('container-title') or [''])[0]
        volume = volume or cr.get('volume')
        pages = pages or cr.get('article-number') or cr.get('page') or ''
    is_preprint = not journal or (doi or '').startswith('10.21203/')
    parts = [', '.join(format_author(n, highlight) for n in names if n) + (f', {date[:4]}.' if date else '.'),
             clean_title(lang(it.get('paper_title')))]
    if journal:
        src = f'<i>{html.escape(journal, quote=False)}</i>'
        if volume:
            src += f' {html.escape(str(volume), quote=False)}'
        if pages:
            src += f', {html.escape(str(pages), quote=False)}'
        parts.append(src + '.')
    elif is_preprint:
        parts.append('Preprint.')
    if doi:
        url = 'https://doi.org/' + doi
        parts.append(f'<a href="{html.escape(url)}">{html.escape(url)}</a>')
    return {'date': date, 'doi': (doi or '').lower(), 'html': ' '.join(parts)}


def build_list():
    rid, highlight = CONFIG['researchmap_id'], CONFIG.get('highlight', '')
    exclude = {d.lower() for d in CONFIG.get('exclude_dois', [])}
    entries = [entry_from_researchmap(it, highlight) for it in researchmap_papers(rid)]
    entries = [e for e in entries if e['doi'] not in exclude]
    entries += [{'date': x['date'], 'doi': '', 'html': x['html']} for x in CONFIG.get('extra', [])]
    entries.sort(key=lambda e: e['date'], reverse=True)
    return entries


def render(entries, indent):
    return ''.join(f'{indent}<div class="csl-entry">{e["html"]}</div>\n' for e in entries)


def update_page(path, entries):
    text = open(path, encoding='utf-8', newline='').read()
    nl = '\r\n' if '\r\n' in text else '\n'
    i, j = text.find(START), text.find(END)
    if i < 0 or j < 0:
        print(f'  no PUBLICATIONS markers in {path}, skipped', file=sys.stderr)
        return False
    line_end = text.index('\n', i) + 1                      # keep the START marker line as it is
    indent = re.match(r'[ \t]*', text[text.rfind('\n', 0, i) + 1:]).group(0)
    block = render(entries, indent).replace('\n', nl)
    new = text[:line_end] + block + indent + text[j:]
    if new == text:
        return False
    open(path, 'w', encoding='utf-8', newline='').write(new)
    return True


def main():
    entries = build_list()
    if not entries:
        sys.exit('researchmap returned no publications; leaving the pages alone')
    if '--dry-run' in sys.argv:
        print(render(entries, ''))
        return
    for page in CONFIG['pages']:
        path = os.path.join(ROOT, page)
        if os.path.exists(path):
            print(f'{page}: {"updated" if update_page(path, entries) else "no change"}')


if __name__ == '__main__':
    main()
