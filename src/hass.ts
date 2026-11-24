import { Platform, SUPPORTED_PLATFORMS } from './commands';

/** Subset of the frontend `hass` object used by the card. */
export interface HassEntityRegistryEntry {
  entity_id: string;
  device_id?: string | null;
  platform?: string;
  hidden?: boolean;
}

export interface HassState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

export interface Hass {
  states: Record<string, HassState>;
  entities?: Record<string, HassEntityRegistryEntry>;
  locale?: { language?: string };
  language?: string;
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: Record<string, unknown>,
  ): Promise<unknown>;
}

const domainOf = (entityId: string) => entityId.split('.', 1)[0];

export function platformOf(hass: Hass, entityId?: string): Platform | undefined {
  if (!entityId) return undefined;
  const p = hass.entities?.[entityId]?.platform;
  return SUPPORTED_PLATFORMS.includes(p as Platform) ? (p as Platform) : undefined;
}

/**
 * All Sony TVs in the house, one per device.
 * A TV with both integrations counts once: Bravia TV wins, then Android TV Remote.
 */
export function findTvs(hass: Hass): string[] {
  const entries = Object.values(hass.entities ?? {}).filter(
    (e) =>
      domainOf(e.entity_id) === 'remote' &&
      !e.hidden &&
      hass.states[e.entity_id] &&
      SUPPORTED_PLATFORMS.includes(e.platform as Platform),
  );
  const rank = (e: HassEntityRegistryEntry) => SUPPORTED_PLATFORMS.indexOf(e.platform as Platform);
  entries.sort((a, b) => rank(a) - rank(b) || a.entity_id.localeCompare(b.entity_id));
  const byDevice = new Map<string, string>();
  for (const e of entries) {
    const key = e.device_id || e.entity_id;
    if (!byDevice.has(key)) byDevice.set(key, e.entity_id);
  }
  return [...byDevice.values()];
}

/** The TV to use when the card does not name one: only if there is a single TV in the house. */
export function findRemote(hass: Hass): string | undefined {
  const tvs = findTvs(hass);
  return tvs.length === 1 ? tvs[0] : undefined;
}

/** The media_player of the remote's own device (used to switch on and off). */
export function findMediaPlayer(hass: Hass, remoteId?: string): string | undefined {
  if (!remoteId) return undefined;
  const remote = hass.entities?.[remoteId];
  if (!remote?.device_id) return undefined;
  const candidates = Object.values(hass.entities ?? {}).filter(
    (e) =>
      domainOf(e.entity_id) === 'media_player' &&
      e.device_id === remote.device_id &&
      hass.states[e.entity_id],
  );
  return (candidates.find((e) => e.platform === remote.platform) ?? candidates[0])?.entity_id;
}

export function language(hass?: Hass): string {
  return (hass?.locale?.language ?? hass?.language ?? 'en').toLowerCase();
}
