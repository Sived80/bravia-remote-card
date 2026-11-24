import { LitElement, css, html, nothing, PropertyValues } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import REMOTE_SVG from '../assets/remote.svg';
import { BUTTONS, POWER_BUTTON } from './commands';
import { Hass, findMediaPlayer, findRemote, language, platformOf } from './hass';
import { t } from './i18n';
import './editor';

declare const __VERSION__: string;
const VERSION = typeof __VERSION__ === 'string' ? __VERSION__ : 'dev';

export interface BraviaRemoteCardConfig {
  type: string;
  /** Entità remote.* della TV. Se manca, la card cerca da sola una TV Sony. */
  entity?: string;
  /** media_player per accendere/spegnere. Se manca, quello dello stesso dispositivo. */
  media_player?: string;
  /** Attesa prima che un tasto tenuto premuto inizi a ripetere (ms). */
  repeat_delay?: number;
  /** Intervallo tra le ripetizioni (ms). */
  repeat_interval?: number;
  /** Vibrazione alla pressione (app mobile). */
  haptic?: boolean;
  /** Sostituisce il comando di singoli tasti, es. { "btn-ok": "DpadCenter" }. */
  commands?: Record<string, string>;
}

const DEFAULTS = { repeat_delay: 500, repeat_interval: 200, haptic: true };
const PRESS_FLASH_MS = 650;
const OFF_STATES = ['off', 'standby', 'unknown'];

const svgText = REMOTE_SVG.replace(/<\?xml[^>]*\?>/, '');

export class BraviaRemoteCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  hass!: Hass;
  private _config!: BraviaRemoteCardConfig;

  private _activeButton?: Element;
  private _holdTimer?: number;
  private _repeatTimer?: number;
  private _flashTimers = new WeakMap<Element, number>();

  static getConfigElement() {
    return document.createElement('bravia-remote-card-editor');
  }

  static getStubConfig(hass: Hass) {
    const entity = findRemote(hass);
    return entity ? { entity } : {};
  }

  setConfig(config: BraviaRemoteCardConfig) {
    if (!config) throw new Error('Invalid configuration');
    if (config.entity && !config.entity.startsWith('remote.')) {
      throw new Error('entity must be a remote.* entity');
    }
    this._config = { ...DEFAULTS, ...config };
  }

  getCardSize() {
    return 12;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: 'auto' };
  }

  private get _remote(): string | undefined {
    return this._config?.entity || (this.hass ? findRemote(this.hass) : undefined);
  }

  private get _mediaPlayer(): string | undefined {
    return this._config?.media_player || (this.hass ? findMediaPlayer(this.hass, this._remote) : undefined);
  }

  protected shouldUpdate(changed: PropertyValues): boolean {
    if (changed.has('_config')) return true;
    if (!changed.has('hass')) return false;
    const old = changed.get('hass') as Hass | undefined;
    if (!old) return true;
    const id = this._remote;
    return !id || old.states[id] !== this.hass.states[id] || old.locale?.language !== this.hass.locale?.language;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._release();
  }

  protected render() {
    if (!this._config || !this.hass) return nothing;
    const lang = language(this.hass);
    const remote = this._remote;
    const state = remote ? this.hass.states[remote] : undefined;
    const unavailable = !state || state.state === 'unavailable';
    const message = !remote ? t(lang, 'no_tv') : unavailable ? t(lang, 'unavailable') : '';

    return html`
      <ha-card>
        <div
          class="remote ${unavailable ? 'unavailable' : ''}"
          @pointerdown=${this._onPointerDown}
          @keydown=${this._onKeyDown}
          @contextmenu=${(e: Event) => e.preventDefault()}
        >
          ${unsafeHTML(svgText)}
        </div>
        ${message ? html`<div class="message">${message}</div>` : nothing}
      </ha-card>
    `;
  }

  // ---- interazione ----------------------------------------------------------

  private _buttonFrom(e: Event): Element | undefined {
    const target = e.target as Element | null;
    return target?.closest?.('.remote-btn') ?? undefined;
  }

  private _onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || this._activeButton) return;
    const btn = this._buttonFrom(e);
    if (!btn) return;
    e.preventDefault();

    this._activeButton = btn;
    btn.classList.add('is-holding');
    this._flash(btn);
    this._send(btn.id);

    if (BUTTONS[btn.id]?.repeat) {
      const { repeat_delay, repeat_interval } = this._config as Required<BraviaRemoteCardConfig>;
      const repeat = () => {
        this._flash(btn);
        this._send(btn.id, true);
      };
      this._holdTimer = window.setTimeout(() => {
        repeat();
        this._repeatTimer = window.setInterval(repeat, repeat_interval);
      }, repeat_delay);
    }

    btn.addEventListener('pointerleave', this._release, { once: true });
    window.addEventListener('pointerup', this._release, { once: true });
    window.addEventListener('pointercancel', this._release, { once: true });
    window.addEventListener('blur', this._release, { once: true });
  };

  private _release = () => {
    clearTimeout(this._holdTimer);
    clearInterval(this._repeatTimer);
    this._holdTimer = this._repeatTimer = undefined;
    if (this._activeButton) {
      this._activeButton.classList.remove('is-holding');
      this._activeButton.removeEventListener('pointerleave', this._release);
      this._activeButton = undefined;
    }
    window.removeEventListener('pointerup', this._release);
    window.removeEventListener('pointercancel', this._release);
    window.removeEventListener('blur', this._release);
  };

  private _onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const btn = this._buttonFrom(e);
    if (!btn) return;
    e.preventDefault();
    this._flash(btn);
    this._send(btn.id);
  };

  /** Riavvia l'animazione dell'alone luminoso. */
  private _flash(btn: Element) {
    btn.classList.remove('is-pressed');
    void (btn as SVGGraphicsElement).getBoundingClientRect();
    btn.classList.add('is-pressed');
    clearTimeout(this._flashTimers.get(btn));
    this._flashTimers.set(
      btn,
      window.setTimeout(() => btn.classList.remove('is-pressed'), PRESS_FLASH_MS),
    );
  }

  // ---- comandi --------------------------------------------------------------

  private _send(buttonId: string, repeated = false) {
    const remote = this._remote;
    if (!remote || !this.hass) return;
    if (!repeated && this._config.haptic) {
      this.dispatchEvent(new CustomEvent('haptic', { detail: 'light', bubbles: true, composed: true }));
    }

    if (buttonId === POWER_BUTTON) {
      this._togglePower(remote);
      return;
    }
    const platform = platformOf(this.hass, remote) ?? 'braviatv';
    const command = this._config.commands?.[buttonId] ?? BUTTONS[buttonId]?.[platform];
    if (!command) return;
    this._call('remote', 'send_command', { command }, remote);
  }

  private _togglePower(remote: string) {
    const player = this._mediaPlayer;
    if (!player) {
      this._call('remote', 'toggle', {}, remote);
      return;
    }
    const state = this.hass.states[player]?.state;
    const service = !state || OFF_STATES.includes(state) ? 'turn_on' : 'turn_off';
    this._call('media_player', service, {}, player);
  }

  private _call(domain: string, service: string, data: Record<string, unknown>, entityId: string) {
    this.hass.callService(domain, service, data, { entity_id: entityId }).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.warn(`bravia-remote-card: ${domain}.${service} failed`, err);
    });
  }

  static styles = css`
    :host {
      display: block;
    }
    ha-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 8px;
      box-sizing: border-box;
      height: 100%;
    }
    .remote {
      width: 100%;
      max-width: var(--bravia-remote-max-width, 320px);
      touch-action: manipulation;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }
    .remote svg {
      display: block;
      width: 100%;
      height: auto;
    }
    .remote.unavailable {
      opacity: 0.45;
      pointer-events: none;
    }
    .message {
      margin-top: 8px;
      text-align: center;
      color: var(--warning-color, #ffa600);
      font-size: 0.9em;
    }
  `;
}

if (!customElements.get('bravia-remote-card')) {
  customElements.define('bravia-remote-card', BraviaRemoteCard);
}

const w = window as unknown as { customCards?: unknown[] };
w.customCards = w.customCards ?? [];
const pickerLang = (navigator.language || 'en').toLowerCase();
w.customCards.push({
  type: 'bravia-remote-card',
  name: t(pickerLang, 'name'),
  description: t(pickerLang, 'description'),
  preview: true,
  documentationURL: 'https://github.com/Sived80/bravia-remote-card',
});

// eslint-disable-next-line no-console
console.info(`%c BRAVIA-REMOTE-CARD %c ${VERSION} `, 'background:#38E8FF;color:#000', 'background:#333;color:#fff');
