const EN = {
  name: 'Bravia Remote Card',
  description: 'A remote control for Sony BRAVIA TVs (Bravia TV or Android TV Remote integration).',
  no_tv: 'No Sony TV found. Add the Bravia TV or Android TV Remote integration, or choose the TV in the card editor.',
  choose_tv: 'More than one Sony TV found: open the card editor and choose the TV for this remote.',
  unavailable: 'The TV is unavailable.',

  entity: 'TV',
  entity_help:
    'The TV this remote controls. With a single Sony TV it is selected automatically; with more TVs, choose one here and add one card per TV.',
  media_player: 'Power button (media player)',
  media_player_help:
    'Used by the ⏻ button: it tells the card whether the TV is on and switches it on or off, even from standby. ' +
    "The TV's own media player is selected automatically; change it only if power on/off does not work. Do not pick a Cast player: it cannot switch the TV on.",
  width: 'Width',
  width_help: 'In pixels, from 120 to 400. On narrow screens the remote shrinks automatically.',
  height: 'Height',
  height_help: 'In pixels, from 400 to 1340.',
  keep_ratio: 'Keep proportions',
  keep_ratio_help:
    'On: change one size and the other follows, so the drawing never gets distorted. Off: width and height are independent (the drawing stretches or squashes).',
  repeat_delay: 'Hold: delay before repeating',
  repeat_delay_help:
    'Only for arrows, volume and channels. How long you must hold the button before the command starts repeating. 500 ms = half a second.',
  repeat_interval: 'Hold: repeat speed',
  repeat_interval_help:
    'Once repeating has started, how often the command is sent again. 200 ms = 5 times per second; a lower number repeats faster.',
  haptic: 'Vibrate on press',
  haptic_help: 'A short vibration on every press (Home Assistant app only).',
};

const IT: typeof EN = {
  name: 'Bravia Remote Card',
  description: 'Telecomando per TV Sony BRAVIA (integrazione Bravia TV o Android TV Remote).',
  no_tv: "Nessuna TV Sony trovata. Aggiungi l'integrazione Bravia TV o Android TV Remote, oppure scegli la TV nell'editor della card.",
  choose_tv: "Ci sono più TV Sony: apri l'editor della card e scegli quale TV comanda questo telecomando.",
  unavailable: 'La TV non è raggiungibile.',

  entity: 'TV',
  entity_help:
    'La TV comandata da questo telecomando. Con una sola TV Sony viene scelta da sola; con più TV scegline una qui e aggiungi una card per ogni TV.',
  media_player: 'Tasto accensione (media player)',
  media_player_help:
    'Serve al tasto ⏻: dice alla card se la TV è accesa e la accende o spegne, anche dallo standby. ' +
    'Viene scelto da solo il media player della stessa TV; cambialo solo se accensione e spegnimento non funzionano. Non scegliere un player Cast: non sa accendere la TV.',
  width: 'Larghezza',
  width_help: 'In pixel, da 120 a 400. Su schermi stretti il telecomando si riduce da solo.',
  height: 'Altezza',
  height_help: 'In pixel, da 400 a 1340.',
  keep_ratio: 'Mantieni le proporzioni',
  keep_ratio_help:
    "Attivo: cambiando una misura l'altra si adegua e il disegno non si deforma. Spento: larghezza e altezza sono libere (il disegno si allunga o si schiaccia).",
  repeat_delay: 'Tasto tenuto premuto: attesa prima di ripetere',
  repeat_delay_help:
    'Vale solo per frecce, volume e canali. Quanto devi tenere premuto prima che il comando inizi a ripetersi. 500 ms = mezzo secondo.',
  repeat_interval: 'Tasto tenuto premuto: velocità di ripetizione',
  repeat_interval_help:
    'Una volta partita la ripetizione, ogni quanto il comando viene rimandato. 200 ms = 5 volte al secondo; un numero più basso ripete più in fretta.',
  haptic: 'Vibrazione alla pressione',
  haptic_help: 'Breve vibrazione a ogni pressione (solo nell’app di Home Assistant).',
};

const STRINGS: Record<string, typeof EN> = { en: EN, it: IT };

export type StringKey = keyof typeof EN;

export function t(lang: string, key: StringKey): string | undefined {
  return (STRINGS[lang.split('-')[0]] ?? EN)[key];
}
