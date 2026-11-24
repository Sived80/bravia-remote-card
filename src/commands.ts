/**
 * Mappa tasto del disegno -> comando, per le due integrazioni supportate.
 *  - braviatv: nomi IRCC della TV (remote.send_command)
 *  - androidtv_remote: nomi dei tasti Android (KEYCODE_ facoltativo)
 * Il tasto di accensione non è qui: lo gestisce la card con media_player on/off.
 */
export type Platform = 'braviatv' | 'androidtv_remote';

export const SUPPORTED_PLATFORMS: Platform[] = ['braviatv', 'androidtv_remote'];

export interface ButtonDef {
  braviatv: string;
  androidtv_remote: string;
  /** Ripete il comando tenendo premuto il tasto. */
  repeat?: boolean;
}

export const POWER_BUTTON = 'btn-power';

export const BUTTONS: Record<string, ButtonDef> = {
  'btn-input': { braviatv: 'Input', androidtv_remote: 'TV_INPUT' },
  'btn-play-pause': { braviatv: 'PlayPause', androidtv_remote: 'MEDIA_PLAY_PAUSE' },
  'btn-rewind': { braviatv: 'Rewind', androidtv_remote: 'MEDIA_REWIND' },
  'btn-fast-forward': { braviatv: 'Forward', androidtv_remote: 'MEDIA_FAST_FORWARD' },

  'btn-up': { braviatv: 'Up', androidtv_remote: 'DPAD_UP', repeat: true },
  'btn-down': { braviatv: 'Down', androidtv_remote: 'DPAD_DOWN', repeat: true },
  'btn-left': { braviatv: 'Left', androidtv_remote: 'DPAD_LEFT', repeat: true },
  'btn-right': { braviatv: 'Right', androidtv_remote: 'DPAD_RIGHT', repeat: true },
  'btn-ok': { braviatv: 'Confirm', androidtv_remote: 'DPAD_CENTER' },

  'btn-back': { braviatv: 'Return', androidtv_remote: 'BACK' },
  'btn-more': { braviatv: 'Options', androidtv_remote: 'MENU' },
  'btn-home': { braviatv: 'Home', androidtv_remote: 'HOME' },
  'btn-voice': { braviatv: 'Assists', androidtv_remote: 'ASSIST' },

  'btn-vol-up': { braviatv: 'VolumeUp', androidtv_remote: 'VOLUME_UP', repeat: true },
  'btn-vol-down': { braviatv: 'VolumeDown', androidtv_remote: 'VOLUME_DOWN', repeat: true },
  'btn-ch-up': { braviatv: 'ChannelUp', androidtv_remote: 'CHANNEL_UP', repeat: true },
  'btn-ch-down': { braviatv: 'ChannelDown', androidtv_remote: 'CHANNEL_DOWN', repeat: true },

  'btn-mute': { braviatv: 'Mute', androidtv_remote: 'VOLUME_MUTE' },
  'btn-subtitles': { braviatv: 'SubTitle', androidtv_remote: 'CAPTIONS' },
  'btn-tv-guide': { braviatv: 'GGuide', androidtv_remote: 'GUIDE' },

  'btn-red': { braviatv: 'Red', androidtv_remote: 'PROG_RED' },
  'btn-green': { braviatv: 'Green', androidtv_remote: 'PROG_GREEN' },
  'btn-yellow': { braviatv: 'Yellow', androidtv_remote: 'PROG_YELLOW' },
  'btn-blue': { braviatv: 'Blue', androidtv_remote: 'PROG_BLUE' },

  'btn-1': { braviatv: 'Num1', androidtv_remote: '1' },
  'btn-2': { braviatv: 'Num2', androidtv_remote: '2' },
  'btn-3': { braviatv: 'Num3', androidtv_remote: '3' },
  'btn-4': { braviatv: 'Num4', androidtv_remote: '4' },
  'btn-5': { braviatv: 'Num5', androidtv_remote: '5' },
  'btn-6': { braviatv: 'Num6', androidtv_remote: '6' },
  'btn-7': { braviatv: 'Num7', androidtv_remote: '7' },
  'btn-8': { braviatv: 'Num8', androidtv_remote: '8' },
  'btn-9': { braviatv: 'Num9', androidtv_remote: '9' },
  'btn-0': { braviatv: 'Num0', androidtv_remote: '0' },
};
