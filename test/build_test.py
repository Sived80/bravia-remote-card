"""Crea test/test.html (bundle + finto hass + scenari) da aprire in un browser headless."""
import pathlib
q = pathlib.Path(__file__).parent
bundle = (q.parent / 'dist' / 'bravia-remote-card.js').read_text(encoding='utf-8')
harness = (q / 'harness.js').read_text(encoding='utf-8').replace('export function', 'function')
scen = (q / 'scenarios.js').read_text(encoding='utf-8')
(q / 'test.html').write_text(
    '<!doctype html><html><head><meta charset="utf-8"></head><body><pre id="out">in corso</pre>'
    f'<script type="module">{bundle}\n{harness}\n{scen}</script></body></html>', encoding='utf-8')
