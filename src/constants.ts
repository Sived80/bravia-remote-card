/** Drawing aspect ratio (viewBox 300 x 1000): width / height. */
export const RATIO = 0.3;

export const WIDTH_RANGE = { min: 120, max: 400 };
export const HEIGHT_RANGE = { min: 400, max: 1340 };

/** Default behaviour (applied by the card). */
export const BEHAVIOUR_DEFAULTS = { repeat_delay: 500, repeat_interval: 200, haptic: true };

/** All default values, sizes included (sizes are computed by resolveSize). */
export const DEFAULTS = { ...BEHAVIOUR_DEFAULTS, width: 214, keep_ratio: true };

const clamp = (v: number, r: { min: number; max: number }) => Math.min(r.max, Math.max(r.min, v));

export interface SizeConfig {
  width?: number;
  height?: number;
  keep_ratio?: boolean;
  /** Old name of `width` (v0.1). */
  max_width?: number;
}

/** Actual width and height, within limits and keeping the ratio. */
export function resolveSize(cfg: SizeConfig): { width: number; height: number; keepRatio: boolean } {
  const keepRatio = cfg.keep_ratio !== false;
  const rawWidth = Number(cfg.width ?? cfg.max_width) || 0;
  const rawHeight = Number(cfg.height) || 0;

  if (keepRatio) {
    // With locked proportions the width wins; if only the height is set, start from it.
    const width = clamp(rawWidth || (rawHeight ? rawHeight * RATIO : DEFAULTS.width), WIDTH_RANGE);
    return { width, height: Math.round(width / RATIO), keepRatio };
  }
  const width = clamp(rawWidth || DEFAULTS.width, WIDTH_RANGE);
  const height = clamp(rawHeight || Math.round(width / RATIO), HEIGHT_RANGE);
  return { width, height, keepRatio };
}
