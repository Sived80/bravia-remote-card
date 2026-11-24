"""Create test/editor-shot.html: a reconstructed configuration dialog (sample data, English texts).

Usage: python test/build_editor_shots.py, then open it in a browser with ?mode=single or ?mode=multi
(see README, Development section). The images go to docs/images/.
"""
import json
import pathlib
import re

q = pathlib.Path(__file__).parent
root = q.parent
bundle = (root / 'dist' / 'bravia-remote-card.js').read_text(encoding='utf-8')

# English editor texts taken from src/i18n.ts, so they stay in sync with the card.
i18n = (root / 'src' / 'i18n.ts').read_text(encoding='utf-8')
en_block = i18n[i18n.index('const EN = {'):i18n.index('};', i18n.index('const EN = {'))]
strings = {}
for m in re.finditer(r"^\s{2}(\w+):\s*((?:(?:'[^']*'|\"[^\"]*\")\s*\+?\s*)+),?$", en_block, re.M):
    parts = re.findall(r"'([^']*)'|\"([^\"]*)\"", m.group(2))
    strings[m.group(1)] = ''.join(a or b for a, b in parts)

page = r'''<!doctype html><html><head><meta charset="utf-8"><style>
:root{--bg:#111318;--dlg:#1c1c1f;--line:#3d3f44;--txt:#e1e1e1;--sub:#9b9b9b;--acc:#03a9f4;--warn:#ffa600}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);font-family:Roboto,"Segoe UI",Arial,sans-serif;color:var(--txt);padding:28px}
.dlg{width:1040px;margin:0 auto;background:var(--dlg);border-radius:24px;box-shadow:0 10px 40px #0008;overflow:hidden}
.hdr{display:flex;align-items:center;gap:16px;padding:18px 24px;font-size:22px}
.hdr .x{width:24px;height:24px;color:var(--sub)}
.body{display:flex;gap:24px;padding:0 24px 8px}
.form{flex:1 1 560px;display:flex;flex-direction:column;gap:18px}
.prev{flex:0 0 380px;background:#26272b;border-radius:16px;padding:16px;display:flex;flex-direction:column;align-items:center}
.prev .ttl{align-self:flex-start;color:var(--sub);font-size:13px;margin-bottom:8px}
.field{position:relative;border:1px solid var(--line);border-radius:8px;padding:10px 44px 8px 48px;min-height:58px}
.field.empty{padding-left:14px}
.field .lbl{font-size:12px;color:var(--sub)}
.field.empty .lbl{font-size:16px;padding-top:8px}
.field .val{font-size:16px}
.field .eid{font-size:12px;color:var(--sub)}
.field .ico{position:absolute;left:14px;top:18px;width:22px;height:22px;color:var(--sub)}
.field .dd{position:absolute;right:14px;top:18px;width:22px;height:22px;color:var(--sub)}
.help{font-size:12px;color:var(--sub);margin:4px 14px 0;line-height:1.35}
.grid{display:flex;gap:16px}.grid>div{flex:1}
.num{border:1px solid var(--line);border-radius:8px;padding:8px 14px;min-height:58px;display:flex;flex-direction:column;justify-content:center}
.num .lbl{font-size:12px;color:var(--sub)}.num .row{display:flex;justify-content:space-between;font-size:16px}.num .u{color:var(--sub)}
.sw{display:flex;align-items:center;justify-content:space-between;padding:0 4px 0 14px;font-size:16px}
.tg{width:36px;height:20px;border-radius:10px;background:var(--acc);position:relative;opacity:.9}
.tg:after{content:"";position:absolute;right:2px;top:2px;width:16px;height:16px;border-radius:50%;background:#fff}
.ftr{display:flex;align-items:center;justify-content:space-between;padding:14px 24px 20px;color:var(--acc);font-size:14px;font-weight:500}
.ftr .b{display:flex;gap:28px}
bravia-remote-card{width:100%;--ha-card-background:#1c1c1f;--card-background-color:#1c1c1f}
</style></head><body>
<div class="dlg">
  <div class="hdr"><svg class="x" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>Bravia Remote Card configuration</div>
  <div class="body"><div class="form" id="form"></div><div class="prev"><div class="ttl">Preview</div><div id="card"></div></div></div>
  <div class="ftr"><span>SHOW CODE EDITOR</span><span class="b"><span>CANCEL</span><span>SAVE</span></span></div>
</div>
<script type="module">
__BUNDLE__
;(async () => {
const S = __STRINGS__;
const mode = new URLSearchParams(location.search).get('mode') || 'single';
const ICON_TV = '<svg class="ico" viewBox="0 0 24 24"><path fill="currentColor" d="M21 17H3V5h18m0-2H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5v2h8v-2h5a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2"/></svg>';
const ICON_DD = '<svg class="dd" viewBox="0 0 24 24"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>';
const TVS = {
  'remote.living_room_tv': ['Living room TV', 'dev1'], 'media_player.living_room_tv': ['Living room TV', 'dev1'],
  'remote.bedroom_tv': ['Bedroom TV', 'dev2'], 'media_player.bedroom_tv': ['Bedroom TV', 'dev2'],
};
const entities = {}, states = {};
for (const [id, [name, dev]] of Object.entries(TVS)) {
  if (mode === 'single' && dev === 'dev2') continue;
  entities[id] = { entity_id: id, device_id: dev, platform: 'braviatv' };
  states[id] = { entity_id: id, state: 'on', attributes: { friendly_name: name } };
}
const hass = { entities, states, locale: { language: 'en' }, callService: () => Promise.resolve() };
const cfg = mode === 'single'
  ? { entity: 'remote.living_room_tv', media_player: 'media_player.living_room_tv' } : {};

const picker = (key, id) => id
  ? `<div class="field">${ICON_TV}<div class="lbl">${S[key]}</div><div class="val">${TVS[id][0]}</div><div class="eid">${id}</div>${ICON_DD}</div>`
  : `<div class="field empty"><div class="lbl">${S[key]}</div>${ICON_DD}</div>`;
const help = (key) => `<div class="help">${S[key + '_help']}</div>`;
const num = (key, v, u) => `<div><div class="num"><div class="lbl">${S[key]}</div><div class="row"><span>${v}</span><span class="u">${u}</span></div></div>${help(key)}</div>`;
const sw = (key) => `<div><div class="sw"><span>${S[key]}</span><span class="tg"></span></div>${help(key)}</div>`;
document.getElementById('form').innerHTML = [
  `<div>${picker('entity', cfg.entity)}${help('entity')}</div>`,
  `<div>${picker('media_player', cfg.media_player)}${help('media_player')}</div>`,
  `<div class="grid">${num('width', 214, 'px')}${num('height', 713, 'px')}</div>`,
  sw('keep_ratio'),
  `<div class="grid">${num('repeat_delay', 500, 'ms')}${num('repeat_interval', 200, 'ms')}</div>`,
  sw('haptic'),
].join('');

const card = document.createElement('bravia-remote-card');
card.setConfig({ type: 'custom:bravia-remote-card', width: 214, ...cfg });
card.hass = hass;
document.getElementById('card').appendChild(card);
await card.updateComplete;
document.title = 'DONE';
})();
</script></body></html>'''

page = page.replace('__BUNDLE__', bundle).replace('__STRINGS__', json.dumps(strings, ensure_ascii=False))
(q / 'editor-shot.html').write_text(page, encoding='utf-8', newline='\n')
print('chiavi testi:', len(strings))
