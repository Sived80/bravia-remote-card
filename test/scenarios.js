// Test scenarios: run in a headless browser with the fake hass from harness.js.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = [];
async function mount(opts, config = { type: 'custom:bravia-remote-card' }) {
  const el = document.createElement('bravia-remote-card');
  el.setConfig(config); el.hass = makeHass(opts);
  document.body.appendChild(el); await el.updateComplete; return el;
}
const btn = (el, id) => el.shadowRoot.getElementById(id);
const down = (b) => b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true, button: 0, pointerId: 1 }));
const up = () => window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));
async function tap(el, id) { down(btn(el, id)); await sleep(30); up(); await sleep(30); }
const box = (el) => { const r = el.shadowRoot.querySelector('svg').getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); };

async function editor(config, hassOpts = {}) {
  const ed = document.createElement('bravia-remote-card-editor');
  const events = [];
  ed.addEventListener('config-changed', (e) => events.push(e.detail.config));
  ed.hass = makeHass(hassOpts); ed.setConfig(config);
  document.body.appendChild(ed); await ed.updateComplete; await sleep(20);
  return { ed, events, form: () => ed.shadowRoot.querySelector('ha-form') };
}
const change = (form, value) => form().dispatchEvent(new CustomEvent('value-changed', { detail: { value } }));

(async () => {
  try {
    let el = await mount({});
    out.push('buttons: ' + el.shadowRoot.querySelectorAll('.remote-btn').length);
    for (const id of ['btn-ok', 'btn-play-pause', 'btn-subtitles', 'btn-1', 'btn-up']) await tap(el, id);
    out.push('bravia: ' + JSON.stringify(el.hass.calls.map((c) => c.data.command)));
    el.hass.calls.length = 0;
    down(btn(el, 'btn-vol-up')); await sleep(1250); up(); await sleep(300);
    out.push('volume held: ' + JSON.stringify(el.hass.calls.map((c) => c.t - el.hass.calls[0].t)));
    const glow = (id) => getComputedStyle(btn(el, id).querySelector('.corona-glow')).opacity;
    down(btn(el, 'btn-ok')); await sleep(60); const during = glow('btn-ok'); up(); await sleep(400);
    out.push('OK glow: during=' + during + ' after 0.4 s=' + glow('btn-ok') + ' classes=' + btn(el, 'btn-ok').getAttribute('class'));
    el.hass.calls.length = 0;
    await tap(el, 'btn-power');
    out.push('power: ' + el.hass.calls.map((c) => c.domain + '.' + c.service + ' ' + c.target.entity_id).join());
    el.remove();

    el = await mount({ platform: 'androidtv_remote' });
    for (const id of ['btn-ok', 'btn-subtitles']) await tap(el, id);
    out.push('android: ' + JSON.stringify(el.hass.calls.map((c) => c.data.command))); el.remove();

    // sizes on the card
    for (const cfg of [{}, { width: 300 }, { height: 500 }, { max_width: 250 }, { width: 200, height: 900, keep_ratio: false }, { width: 999 }]) {
      el = await mount({}, { type: 'x', ...cfg });
      out.push('sizes ' + JSON.stringify(cfg) + ' -> ' + box(el) + ' aspect=' + el.shadowRoot.querySelector('svg').getAttribute('preserveAspectRatio'));
      el.remove();
    }

    // editor: preselection
    let e = await editor({ type: 'x' });
    out.push('editor open: ' + JSON.stringify(e.events.at(-1)));
    out.push('editor fields: ' + JSON.stringify(e.form().schema.map((s) => s.name || s.schema.map((x) => x.name))));
    out.push('editor media_player help: ' + e.form().computeHelper({ name: 'media_player' }).slice(0, 60) + '…');
    // locked proportions: change width -> height follows
    change(e.form, { ...e.form().data, width: 300 });
    out.push('width 300 (locked): ' + JSON.stringify(e.events.at(-1)));
    await e.ed.updateComplete;
    change(e.form, { ...e.form().data, height: 600 });
    out.push('height 600 (locked): ' + JSON.stringify(e.events.at(-1)));
    await e.ed.updateComplete;
    change(e.form, { ...e.form().data, keep_ratio: false });
    await e.ed.updateComplete;
    change(e.form, { ...e.form().data, height: 1000 });
    out.push('height 1000 (free): ' + JSON.stringify(e.events.at(-1)));
    e.ed.remove();

    // editor: a config chosen by hand stays as it is
    e = await editor({ type: 'x', entity: 'remote.tv', media_player: 'media_player.cast' });
    out.push('editor manual choice (no event expected): ' + e.events.length);
    e.ed.remove();

    // more than one TV in the house
    const msg = (el) => el.shadowRoot.querySelector('.message')?.textContent ?? '';
    el = await mount({ bothIntegrations: true });
    await tap(el, 'btn-ok');
    out.push('one TV, two integrations: ' + el.hass.calls.map((c) => c.target.entity_id).join() + ' msg="' + msg(el) + '"');
    el.remove();
    el = await mount({ secondTv: true });
    await tap(el, 'btn-ok');
    out.push('two TVs without entity: commands=' + el.hass.calls.length + ' msg="' + msg(el) + '"');
    el.remove();
    el = await mount({ secondTv: true }, { type: 'x', entity: 'remote.bedroom' });
    await tap(el, 'btn-ok'); await tap(el, 'btn-power');
    out.push('two TVs, bedroom: ' + el.hass.calls.map((c) => c.domain + '.' + c.service + ' ' + c.target.entity_id).join(' | '));
    el.remove();
    out.push('stub two TVs: ' + JSON.stringify(customElements.get('bravia-remote-card').getStubConfig(makeHass({ secondTv: true }))));
    e = await editor({ type: 'x' }, { secondTv: true });
    out.push('editor two TVs, events on open: ' + e.events.length);
    change(e.form, { ...e.form().data, entity: 'remote.bedroom' });
    out.push('editor two TVs, bedroom chosen: ' + JSON.stringify(e.events.at(-1)));
    await e.ed.updateComplete;
    change(e.form, { ...e.form().data, entity: 'remote.tv' });
    out.push('editor switch to living room: ' + JSON.stringify(e.events.at(-1)));
    e.ed.remove();
  } catch (err) { out.push('ERROR ' + err.stack); }
  document.getElementById('out').textContent = out.join('\n'); document.title = 'DONE';
})();
