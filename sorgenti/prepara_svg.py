"""Genera assets/remote.svg dal disegno 'allineato' dell'utente.
Modifiche: frecce del cerchio divise in 4 spicchi, tasto Sottotitoli,
etichette Riavvolgi/Avanti veloce, script interno rimosso (la logica sta nella card)."""
import math, re, pathlib
qui = pathlib.Path(__file__).parent
s = (qui / 'telecomando-svg-allineato-originale.svg').read_text(encoding='utf-8')

def blocco(s, gid, indent='    '):
    a = s.index(f'{indent}<g id="{gid}"')
    e = s.index(f'\n{indent}</g>', a) + len(f'\n{indent}</g>')
    return a, e

# 1) script interno rimosso
s = re.sub(r'\s*<script>.*?</script>', '', s, flags=re.S)

# 2) etichette distinte
s = s.replace('id="btn-rewind" class="remote-btn" tabindex="0" role="button" aria-label="Indietro"',
              'id="btn-rewind" class="remote-btn" tabindex="0" role="button" aria-label="Riavvolgi"')
s = s.replace('aria-label="Avanti"', 'aria-label="Avanti veloce"')

# 3) anello frecce: diventa decorazione, i tasti sono 4 spicchi
a, e = blocco(s, 'btn-dpad')
anello = s[a:e]
anello = re.sub(r'<g id="btn-dpad"[^>]*>', '<g id="dpad-ring" pointer-events="none">', anello)
anello = re.sub(r'\s*<g class="corona-layer".*?</g>', '', anello, count=1, flags=re.S)
R_OUT, R_IN = 88.0, 39.5
def p(r, ang):
    t = math.radians(ang); return f'{r*math.cos(t):.2f} {r*math.sin(t):.2f}'
def spicchio(a1, a2):
    return (f'M {p(R_OUT,a1)} A {R_OUT} {R_OUT} 0 0 1 {p(R_OUT,a2)} '
            f'L {p(R_IN,a2)} A {R_IN} {R_IN} 0 0 0 {p(R_IN,a1)} Z')
def arco(r, a1, a2):
    return f'M {p(r,a1+6)} A {r} {r} 0 0 1 {p(r,a2-6)}'
settori = ''
for gid, label, centro in [('btn-up','Su',-90),('btn-right','Destra',0),('btn-down','Giù',90),('btn-left','Sinistra',180)]:
    a1, a2 = centro-45, centro+45
    settori += f'''
    <g id="{gid}" class="remote-btn dpad-sector" tabindex="0" role="button" aria-label="{label}">
      <g class="corona-layer" pointer-events="none">
        <path class="corona-pulse" d="{arco(90,a1,a2)}" fill="none" stroke="#38E8FF" stroke-width="2.6" stroke-linecap="round" opacity="0"/>
        <path class="corona-glow" d="{arco(91.5,a1,a2)}" fill="none" stroke="#38E8FF" stroke-width="7.5" stroke-linecap="round" filter="url(#coronaGlow)" opacity="0"/>
        <path class="corona-ring" d="{arco(89.8,a1,a2)}" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" filter="url(#coronaCoreGlow)" opacity="0"/>
      </g>
      <path class="sector-face" d="{spicchio(a1,a2)}" fill="#FFFFFF" fill-opacity="0"/>
    </g>'''
s = s[:a] + anello + settori + s[e:]

# stile degli spicchi: si schiariscono invece di rimpicciolire
css = '''
    /* Spicchi del cerchio direzionale */
    .dpad-sector .sector-face {
      transition: fill-opacity 0.14s ease;
    }
    .dpad-sector:hover .sector-face { fill-opacity: 0.03; }
    .dpad-sector:active .sector-face,
    .dpad-sector.is-holding .sector-face { fill-opacity: 0.08; transition: fill-opacity 0.05s ease-in; }
  ]]></style>'''
s = s.replace('\n  ]]></style>', css, 1)

# 4) tasto Sottotitoli al centro della riga Muto / Guida TV
a, e = blocco(s, 'btn-mute')
muto = s[a:e]
sub = muto.replace('id="btn-mute"', 'id="btn-subtitles"').replace('aria-label="Muto"', 'aria-label="Sottotitoli"')
sub = re.sub(r'transform="translate\([^)]*\)"', 'transform="translate(150.0, 633.0)"', sub, count=1)
f1 = sub.index('<g class="btn-face">'); f2 = sub.index('</g>', f1)
faccia = sub[f1:f2]
cerchio = re.search(r'<circle[^>]*/>', faccia).group(0)
icona = '''<g class="btn-face">
        ''' + cerchio + '''
        <rect x="-9" y="-6.5" width="18" height="13" rx="2.5" fill="none" stroke="#F0F0EE" stroke-width="1.8"/>
        <line x1="-5.5" y1="0.5" x2="-1.5" y2="0.5" stroke="#F0F0EE" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="1" y1="0.5" x2="5.5" y2="0.5" stroke="#F0F0EE" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="-5.5" y1="3.5" x2="2" y2="3.5" stroke="#F0F0EE" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="4.2" y1="3.5" x2="5.5" y2="3.5" stroke="#F0F0EE" stroke-width="1.8" stroke-linecap="round"/>
      '''
sub = sub[:f1] + icona + sub[f2:]
s = s[:e] + '\n\n    <!-- Sottotitoli -->\n' + sub + s[e:]

# 5) volume e canali: l'alone segue la mezza pillola invece del cerchio
#    pillola: larga 43 (raggio 21.5), alta 101; centro tasto alto a 21.5 dal bordo, divisione a +29
R_P, SPLIT = 21.5, 29.0
def mezza_pillola(d, alto):
    w, yb = R_P + d, (SPLIT + d) if alto else -(SPLIT + d)
    sweep = 1 if alto else 0
    return f'M {-w:.2f} {yb:.2f} L {-w:.2f} 0 A {w:.2f} {w:.2f} 0 0 {sweep} {w:.2f} 0 L {w:.2f} {yb:.2f} Z'
for gid, alto in [('btn-vol-up', True), ('btn-vol-down', False), ('btn-ch-up', True), ('btn-ch-down', False)]:
    a = s.index(f'<g id="{gid}"')
    e = s.index('<g class="btn-face">', a)
    f = s.index('/>', e) + 2   # primo elemento della faccia: il cerchio trasparente usato come zona di tocco
    blocco_txt = s[a:f]
    for cls, d in [('corona-pulse', 2.2), ('corona-glow', 3.2), ('corona-ring', 1.8)]:
        blocco_txt = re.sub(rf'<circle class="{cls}" cx="0" cy="0" r="[\d.]+"',
                            f'<path class="{cls}" d="{mezza_pillola(d, alto)}" stroke-linejoin="round"', blocco_txt)
    blocco_txt = re.sub(r'<circle cx="0" cy="0" r="21.5" fill="transparent"/>$',
                        f'<path d="{mezza_pillola(0, alto)}" fill="transparent"/>', blocco_txt)
    s = s[:a] + blocco_txt + s[f:]

# 6) animazioni più brevi e niente alone "appeso" sui touch screen
def sostituisci(vecchio, nuovo):
    global s
    assert s.count(vecchio) >= 1, vecchio
    s = s.replace(vecchio, nuovo)

#    niente effetto al passaggio del mouse: l'alone si accende solo premendo
#    (sui telefoni l'hover resta "appeso" dopo un tocco, col mouse resta finché il puntatore è sopra)
sostituisci('''    /* Subtle hover cue */
    .remote-btn:hover .corona-glow {
      opacity: 0.24;
    }
    .remote-btn:hover .corona-ring {
      opacity: 0.18;
    }
''', '')
sostituisci('    .dpad-sector:hover .sector-face { fill-opacity: 0.03; }\n    .dpad-sector:active', '    .dpad-sector:active')
#    durate: da ~0,6 s a ~0,25 s
for vecchio, nuovo in [
    ('transition: opacity 0.22s ease-out;', 'transition: opacity 0.12s ease-out;'),
    ('animation: btnPressBounce 0.32s', 'animation: btnPressBounce 0.18s'),
    ('animation: coronaGlowFlash 0.62s', 'animation: coronaGlowFlash 0.26s'),
    ('animation: coronaRingFlash 0.58s', 'animation: coronaRingFlash 0.24s'),
    ('animation: coronaRipple 0.62s', 'animation: coronaRipple 0.28s'),
]:
    sostituisci(vecchio, nuovo)

(qui.parent / 'assets' / 'remote.svg').write_text(s, encoding='utf-8')
ids = re.findall(r'<g id="(btn-[^"]+)" class="remote-btn', s)
print(len(s), len(ids), ids)
