import { LitElement, html, nothing } from 'lit';
import type { BraviaRemoteCardConfig } from './bravia-remote-card';
import { BEHAVIOUR_DEFAULTS, DEFAULTS, HEIGHT_RANGE, RATIO, WIDTH_RANGE, resolveSize } from './constants';
import { Hass, findMediaPlayer, findRemote, language } from './hass';
import { StringKey, t } from './i18n';

const SCHEMA = [
  {
    name: 'entity',
    selector: {
      entity: {
        filter: [
          { domain: 'remote', integration: 'braviatv' },
          { domain: 'remote', integration: 'androidtv_remote' },
        ],
      },
    },
  },
  { name: 'media_player', selector: { entity: { filter: [{ domain: 'media_player' }] } } },
  {
    type: 'grid',
    name: '',
    schema: [
      { name: 'width', selector: { number: { ...WIDTH_RANGE, step: 1, mode: 'box', unit_of_measurement: 'px' } } },
      { name: 'height', selector: { number: { ...HEIGHT_RANGE, step: 1, mode: 'box', unit_of_measurement: 'px' } } },
    ],
  },
  { name: 'keep_ratio', selector: { boolean: {} } },
  {
    type: 'grid',
    name: '',
    schema: [
      { name: 'repeat_delay', selector: { number: { min: 200, max: 2000, step: 50, mode: 'box', unit_of_measurement: 'ms' } } },
      { name: 'repeat_interval', selector: { number: { min: 80, max: 1000, step: 10, mode: 'box', unit_of_measurement: 'ms' } } },
    ],
  },
  { name: 'haptic', selector: { boolean: {} } },
];

type Config = BraviaRemoteCardConfig & Record<string, unknown>;

export class BraviaRemoteCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  hass!: Hass;
  private _config!: Config;
  private _autofilled = false;

  setConfig(config: BraviaRemoteCardConfig) {
    this._config = config as Config;
  }

  /** Alla prima apertura: preseleziona TV e media player trovati da soli (si possono cambiare). */
  protected updated() {
    if (this._autofilled || !this.hass || !this._config) return;
    this._autofilled = true;
    const entity = this._config.entity || findRemote(this.hass);
    const mediaPlayer = this._config.media_player || findMediaPlayer(this.hass, entity);
    if (entity !== this._config.entity || mediaPlayer !== this._config.media_player) {
      this._emit({ ...this._config, entity, media_player: mediaPlayer });
    }
  }

  protected render() {
    if (!this.hass || !this._config) return nothing;
    const size = resolveSize(this._config);
    const data = {
      ...DEFAULTS,
      ...this._config,
      width: size.width,
      height: size.height,
      keep_ratio: size.keepRatio,
    };
    const lang = language(this.hass);
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${SCHEMA}
        .computeLabel=${(s: { name: string }) => t(lang, s.name as StringKey)}
        .computeHelper=${(s: { name: string }) => t(lang, `${s.name}_help` as StringKey) ?? ''}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _valueChanged(ev: CustomEvent) {
    const prev = this._config;
    const prevSize = resolveSize(prev);
    const next: Config = { ...ev.detail.value };

    // Cambiata la TV: se il media player era quello automatico, segue la nuova TV.
    if (next.entity !== prev.entity) {
      const oldAuto = findMediaPlayer(this.hass, prev.entity);
      if (!prev.media_player || prev.media_player === oldAuto) {
        next.media_player = findMediaPlayer(this.hass, next.entity);
      }
    }

    // Misure: con le proporzioni bloccate, cambiando una misura si adegua l'altra.
    if (next.keep_ratio !== false) {
      const width = Number(next.width);
      const height = Number(next.height);
      if (height !== prevSize.height && width === prevSize.width) {
        next.width = Math.round(height * RATIO);
      }
      const finalWidth = Math.min(WIDTH_RANGE.max, Math.max(WIDTH_RANGE.min, Number(next.width)));
      next.width = finalWidth;
      next.height = Math.round(finalWidth / RATIO);
    }
    delete next.max_width;

    // I valori uguali a quelli predefiniti non vengono scritti nella configurazione.
    for (const [key, value] of Object.entries(BEHAVIOUR_DEFAULTS)) {
      if (next[key] === value) delete next[key];
    }
    if (next.keep_ratio === true) delete next.keep_ratio;

    for (const key of Object.keys(next)) {
      if (next[key] === '' || next[key] === undefined || next[key] === null) delete next[key];
    }
    this._emit(next);
  }

  private _emit(config: Config) {
    this._config = config;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }));
  }
}

if (!customElements.get('bravia-remote-card-editor')) {
  customElements.define('bravia-remote-card-editor', BraviaRemoteCardEditor);
}
