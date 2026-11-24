// Finto `hass` per provare la card nel browser senza Home Assistant.
export function makeHass({ platform = 'braviatv', mpState = 'off', remoteState = 'off', withTv = true, secondTv = false, bothIntegrations = false } = {}) {
  const calls = [];
  const entities = withTv ? {
    'remote.tv': { entity_id: 'remote.tv', device_id: 'dev1', platform },
    'media_player.tv': { entity_id: 'media_player.tv', device_id: 'dev1', platform },
    'media_player.cast': { entity_id: 'media_player.cast', device_id: 'dev2', platform: 'cast' },
  } : {};
  const states = withTv ? {
    'remote.tv': { entity_id: 'remote.tv', state: remoteState, attributes: {} },
    'media_player.tv': { entity_id: 'media_player.tv', state: mpState, attributes: {} },
    'media_player.cast': { entity_id: 'media_player.cast', state: 'off', attributes: {} },
  } : {};
  const add = (id, device, plat, kind = 'remote') => {
    entities[id] = { entity_id: id, device_id: device, platform: plat };
    states[id] = { entity_id: id, state: 'off', attributes: {} };
  };
  if (secondTv) { add('remote.camera', 'dev3', 'braviatv'); add('media_player.camera', 'dev3', 'braviatv'); }
  // stessa TV con anche Android TV Remote: deve contare una volta sola
  if (bothIntegrations) add('remote.tv_android', 'dev1', 'androidtv_remote');
  return {
    calls, entities, states, locale: { language: 'it' },
    callService(domain, service, data, target) {
      calls.push({ t: Math.round(performance.now()), domain, service, data, target });
      return Promise.resolve();
    },
  };
}
