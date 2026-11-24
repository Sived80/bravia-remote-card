/** Proporzione del disegno (viewBox 300 x 1000): larghezza / altezza. */
export const RATIO = 0.3;

export const WIDTH_RANGE = { min: 120, max: 400 };
export const HEIGHT_RANGE = { min: 400, max: 1340 };

/** Comportamento predefinito (applicato dalla card). */
export const BEHAVIOUR_DEFAULTS = { repeat_delay: 500, repeat_interval: 200, haptic: true };

/** Tutti i valori predefiniti, misure comprese (le misure le calcola resolveSize). */
export const DEFAULTS = { ...BEHAVIOUR_DEFAULTS, width: 214, keep_ratio: true };

const clamp = (v: number, r: { min: number; max: number }) => Math.min(r.max, Math.max(r.min, v));

export interface SizeConfig {
  width?: number;
  height?: number;
  keep_ratio?: boolean;
  /** Vecchio nome di `width` (v0.1). */
  max_width?: number;
}

/** Larghezza e altezza effettive, rispettando limiti e proporzione. */
export function resolveSize(cfg: SizeConfig): { width: number; height: number; keepRatio: boolean } {
  const keepRatio = cfg.keep_ratio !== false;
  const rawWidth = Number(cfg.width ?? cfg.max_width) || 0;
  const rawHeight = Number(cfg.height) || 0;

  if (keepRatio) {
    // Con le proporzioni bloccate comanda la larghezza; se c'è solo l'altezza, si parte da quella.
    const width = clamp(rawWidth || (rawHeight ? rawHeight * RATIO : DEFAULTS.width), WIDTH_RANGE);
    return { width, height: Math.round(width / RATIO), keepRatio };
  }
  const width = clamp(rawWidth || DEFAULTS.width, WIDTH_RANGE);
  const height = clamp(rawHeight || Math.round(width / RATIO), HEIGHT_RANGE);
  return { width, height, keepRatio };
}
