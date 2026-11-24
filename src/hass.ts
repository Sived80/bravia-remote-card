import { Platform, SUPPORTED_PLATFORMS } from './commands';

/** Sottoinsieme dell'oggetto `hass` del frontend usato dalla card. */
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

/** Trova un telecomando Sony: prima Bravia TV, poi Android TV Remote. */
export function findRemote(hass: Hass): string | undefined {
  const entries = Object.values(hass.entities ?? {}).filter(
    (e) => domainOf(e.entity_id) === 'remote' && !e.hidden && hass.states[e.entity_id],
  );
  for (const platform of SUPPORTED_PLATFORMS) {
    const found = entries.find((e) => e.platform === platform);
    if (found) return found.entity_id;
  }
  return undefined;
}

/** Il media_player dello stesso dispositivo del telecomando (serve per accendere e spegnere). */
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
