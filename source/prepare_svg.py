"""Generate assets/remote.svg from the original drawing (source/remote-original.svg).
Changes: the D-pad ring is split into 4 sectors, a Subtitles button is added,
the embedded script is removed (the logic lives in the card)."""
import math, re, pathlib
here = pathlib.Path(__file__).parent
s = (here / 'remote-original.svg').read_text(encoding='utf-8')

def block(s, gid, indent='    '):
    a = s.index(f'{indent}<g id="{gid}"')
    e = s.index(f'\n{indent}</g>', a) + len(f'\n{indent}</g>')
    return a, e

# 1) remove the embedded script
s = re.sub(r'\s*<script>.*?</script>', '', s, flags=re.S)

# 2) D-pad ring: it becomes decoration, the buttons are 4 sectors
a, e = block(s, 'btn-dpad')
ring = s[a:e]
ring = re.sub(r'<g id="btn-dpad"[^>]*>', '<g id="dpad-ring" pointer-events="none">', ring)
ring = re.sub(r'\s*<g class="corona-layer".*?</g>', '', ring, count=1, flags=re.S)
R_OUT, R_IN = 88.0, 39.5
def p(r, ang):
    t = math.radians(ang); return f'{r*math.cos(t):.2f} {r*math.sin(t):.2f}'
def sector(a1, a2):
    return (f'M {p(R_OUT,a1)} A {R_OUT} {R_OUT} 0 0 1 {p(R_OUT,a2)} '
            f'L {p(R_IN,a2)} A {R_IN} {R_IN} 0 0 0 {p(R_IN,a1)} Z')
def arc(r, a1, a2):
    return f'M {p(r,a1+6)} A {r} {r} 0 0 1 {p(r,a2-6)}'
sectors = ''
for gid, label, centre in [('btn-up','Up',-90),('btn-right','Right',0),('btn-down','Down',90),('btn-left','Left',180)]:
    a1, a2 = centre-45, centre+45
    sectors += f'''
    <g id="{gid}" class="remote-btn dpad-sector" tabindex="0" role="button" aria-label="{label}">
      <g class="corona-layer" pointer-events="none">
        <path class="corona-pulse" d="{arc(90,a1,a2)}" fill="none" stroke="#38E8FF" stroke-width="2.6" stroke-linecap="round" opacity="0"/>
        <path class="corona-glow" d="{arc(91.5,a1,a2)}" fill="none" stroke="#38E8FF" stroke-width="7.5" stroke-linecap="round" filter="url(#coronaGlow)" opacity="0"/>
        <path class="corona-ring" d="{arc(89.8,a1,a2)}" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" filter="url(#coronaCoreGlow)" opacity="0"/>
      </g>
      <path class="sector-face" d="{sector(a1,a2)}" fill="#FFFFFF" fill-opacity="0"/>
    </g>'''
s = s[:a] + ring + sectors + s[e:]

# sector style: they brighten instead of shrinking
css = '''
    /* D-pad sectors */
    .dpad-sector .sector-face {
      transition: fill-opacity 0.14s ease;
    }
    .dpad-sector:hover .sector-face { fill-opacity: 0.03; }
    .dpad-sector:active .sector-face,
    .dpad-sector.is-holding .sector-face { fill-opacity: 0.08; transition: fill-opacity 0.05s ease-in; }
  ]]></style>'''
s = s.replace('\n  ]]></style>', css, 1)

# 3) Subtitles button in the middle of the Mute / TV Guide row
a, e = block(s, 'btn-mute')
mute = s[a:e]
sub = mute.replace('id="btn-mute"', 'id="btn-subtitles"').replace('aria-label="Mute"', 'aria-label="Subtitles"')
sub = re.sub(r'transform="translate\([^)]*\)"', 'transform="translate(150.0, 633.0)"', sub, count=1)
f1 = sub.index('<g class="btn-face">'); f2 = sub.index('</g>', f1)
face = sub[f1:f2]
circle = re.search(r'<circle[^>]*/>', face).group(0)
icon = '''<g class="btn-face">
        ''' + circle + '''
        <rect x="-9" y="-6.5" width="18" height="13" rx="2.5" fill="none" stroke="#F0F0EE" stroke-width="1.8"/>
        <line x1="-5.5" y1="0.5" x2="-1.5" y2="0.5" stroke="#F0F0EE" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="1" y1="0.5" x2="5.5" y2="0.5" stroke="#F0F0EE" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="-5.5" y1="3.5" x2="2" y2="3.5" stroke="#F0F0EE" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="4.2" y1="3.5" x2="5.5" y2="3.5" stroke="#F0F0EE" stroke-width="1.8" stroke-linecap="round"/>
      '''
sub = sub[:f1] + icon + sub[f2:]
s = s[:e] + '\n\n    <!-- Subtitles -->\n' + sub + s[e:]

# 4) volume and channels: the glow follows the half pill instead of a circle
#    pill: 43 wide (radius 21.5), 101 high; upper button centre 21.5 from the edge, split at +29
R_P, SPLIT = 21.5, 29.0
def half_pill(d, upper):
    w, yb = R_P + d, (SPLIT + d) if upper else -(SPLIT + d)
    sweep = 1 if upper else 0
    return f'M {-w:.2f} {yb:.2f} L {-w:.2f} 0 A {w:.2f} {w:.2f} 0 0 {sweep} {w:.2f} 0 L {w:.2f} {yb:.2f} Z'
for gid, upper in [('btn-vol-up', True), ('btn-vol-down', False), ('btn-ch-up', True), ('btn-ch-down', False)]:
    a = s.index(f'<g id="{gid}"')
    e = s.index('<g class="btn-face">', a)
    f = s.index('/>', e) + 2   # first element of the face: the transparent circle used as touch area
    chunk = s[a:f]
    for cls, d in [('corona-pulse', 2.2), ('corona-glow', 3.2), ('corona-ring', 1.8)]:
        chunk = re.sub(rf'<circle class="{cls}" cx="0" cy="0" r="[\d.]+"',
                       f'<path class="{cls}" d="{half_pill(d, upper)}" stroke-linejoin="round"', chunk)
    chunk = re.sub(r'<circle cx="0" cy="0" r="21.5" fill="transparent"/>$',
                   f'<path d="{half_pill(0, upper)}" fill="transparent"/>', chunk)
    s = s[:a] + chunk + s[f:]

# 5) shorter animations and no glow left "stuck" on touch screens
def replace(old, new):
    global s
    assert s.count(old) >= 1, old
    s = s.replace(old, new)

#    hover effect only with a real mouse:
#    on touch screens hover sticks after a tap and the button looks still lit
replace('''    /* Subtle hover cue */
    .remote-btn:hover .corona-glow {
      opacity: 0.24;
    }
    .remote-btn:hover .corona-ring {
      opacity: 0.18;
    }''', '''    /* Subtle hover cue (only with a real mouse: on touch screens hover sticks after a tap) */
    @media (hover: hover) and (pointer: fine) {
      .remote-btn:hover .corona-glow {
        opacity: 0.24;
      }
      .remote-btn:hover .corona-ring {
        opacity: 0.18;
      }
      .dpad-sector:hover .sector-face { fill-opacity: 0.03; }
    }''')
replace('    .dpad-sector:hover .sector-face { fill-opacity: 0.03; }\n    .dpad-sector:active', '    .dpad-sector:active')
#    durations: from ~0.6 s to ~0.25 s
for old, new in [
    ('transition: opacity 0.22s ease-out;', 'transition: opacity 0.12s ease-out;'),
    ('animation: btnPressBounce 0.32s', 'animation: btnPressBounce 0.18s'),
    ('animation: coronaGlowFlash 0.62s', 'animation: coronaGlowFlash 0.26s'),
    ('animation: coronaRingFlash 0.58s', 'animation: coronaRingFlash 0.24s'),
    ('animation: coronaRipple 0.62s', 'animation: coronaRipple 0.28s'),
]:
    replace(old, new)

(here.parent / 'assets' / 'remote.svg').write_text(s, encoding='utf-8')
ids = re.findall(r'<g id="(btn-[^"]+)" class="remote-btn', s)
print(len(s), len(ids), ids)
