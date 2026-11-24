import { LitElement, html, nothing } from 'lit';
import type { BraviaRemoteCardConfig } from './bravia-remote-card';
import { Hass, language } from './hass';
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
      {
        name: 'repeat_delay',
        selector: { number: { min: 200, max: 2000, step: 50, mode: 'box', unit_of_measurement: 'ms' } },
      },
      {
        name: 'repeat_interval',
        selector: { number: { min: 80, max: 1000, step: 10, mode: 'box', unit_of_measurement: 'ms' } },
      },
    ],
  },
  { name: 'haptic', selector: { boolean: {} } },
];

export class BraviaRemoteCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  hass!: Hass;
  private _config!: BraviaRemoteCardConfig;

  setConfig(config: BraviaRemoteCardConfig) {
    this._config = config;
  }

  protected render() {
    if (!this.hass || !this._config) return nothing;
    const data = { repeat_delay: 500, repeat_interval: 200, haptic: true, ...this._config };
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${SCHEMA}
        .computeLabel=${(s: { name: string }) => t(language(this.hass), s.name as StringKey)}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _valueChanged(ev: CustomEvent) {
    const config = { ...ev.detail.value } as Record<string, unknown>;
    for (const key of Object.keys(config)) {
      if (config[key] === '' || config[key] === undefined) delete config[key];
    }
    this.dispatchEvent(
      new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }),
    );
  }
}

if (!customElements.get('bravia-remote-card-editor')) {
  customElements.define('bravia-remote-card-editor', BraviaRemoteCardEditor);
}
