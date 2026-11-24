const STRINGS = {
  en: {
    name: 'Bravia Remote Card',
    description: 'A remote control for Sony BRAVIA TVs (Bravia TV or Android TV Remote integration).',
    no_tv: 'No Sony TV found. Add the Bravia TV or Android TV Remote integration, or choose the entity in the card editor.',
    unavailable: 'The TV is unavailable.',
    entity: 'TV remote (remote entity)',
    media_player: 'Media player for power on/off (optional, found automatically)',
    repeat_delay: 'Hold delay before repeating (ms)',
    repeat_interval: 'Repeat interval (ms)',
    haptic: 'Vibrate on press',
    max_width: 'Remote size (maximum width)',
  },
  it: {
    name: 'Bravia Remote Card',
    description: 'Telecomando per TV Sony BRAVIA (integrazione Bravia TV o Android TV Remote).',
    no_tv: "Nessuna TV Sony trovata. Aggiungi l'integrazione Bravia TV o Android TV Remote, oppure scegli l'entità nell'editor della card.",
    unavailable: 'La TV non è raggiungibile.',
    entity: 'Telecomando della TV (entità remote)',
    media_player: 'Media player per accendere/spegnere (facoltativo, trovato da solo)',
    repeat_delay: 'Attesa prima della ripetizione (ms)',
    repeat_interval: 'Intervallo di ripetizione (ms)',
    haptic: 'Vibrazione alla pressione',
    max_width: 'Dimensione del telecomando (larghezza massima)',
  },
} as const;

export type StringKey = keyof (typeof STRINGS)['en'];

export function t(lang: string, key: StringKey): string {
  const base = lang.split('-')[0] as keyof typeof STRINGS;
  return (STRINGS[base] ?? STRINGS.en)[key];
}
