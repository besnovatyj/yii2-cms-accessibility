/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

import {ROOT_CLASS, SCHEME_ATTR, STYLE_ID, UI_CLASS} from '../dom/selectors';
import {BigCursor} from '../features/BigCursor';
import {BlockEmbeds} from '../features/BlockEmbeds';
import {ColorScheme} from '../features/ColorScheme';
import {FontScale} from '../features/FontScale';
import {HighContrast} from '../features/HighContrast';
import {Highlight} from '../features/Highlight';
import {ImageMode} from '../features/ImageMode';
import {ReadingGuide} from '../features/ReadingGuide';
import {SpeechReader} from '../features/SpeechReader';
import {StopAnimations} from '../features/StopAnimations';
import {Typography} from '../features/Typography';
import {
    DEFAULT_STATE,
    type A11yConfig,
    type A11yState,
    type BooleanStateKey,
    type Feature,
    type FeatureContext,
} from '../types';
import {SettingsStore} from './SettingsStore';
import {StyleInjector} from './StyleInjector';

/** Подписчик на изменение состояния. */
export type StateListener = (state: Readonly<A11yState>) => void;

/**
 * Контроллёр панели: единственный владелец состояния.
 *
 * Здесь нет ни одной экспортируемой мутируемой переменной уровня модуля.
 * Такие синглтоны (`export let $panel`, `export const settings`) выглядят
 * удобно, но обходятся дорого: модули начинают импортировать друг друга
 * по кругу ради доступа к общему состоянию, второй экземпляр на странице
 * становится невозможен, а протестировать что-либо нельзя — состояние
 * переживает тест.
 *
 * Порядок фич в списке — это порядок правил в итоговом CSS, то есть порядок
 * каскада. Он задан здесь и только здесь. Цветовая схема идёт раньше остальных
 * намеренно: подсветка ссылок и обводка заголовков должны перебивать её цвета,
 * иначе на двухцветной палитре подсветку не будет видно.
 */
export class AccessibilityController {
    private readonly store: SettingsStore;
    private readonly styles: StyleInjector;
    private readonly features: readonly Feature[];
    private readonly listeners = new Set<StateListener>();
    private readonly context: FeatureContext;

    /** Озвучка вынесена в поле: панель дёргает её напрямую (play/pause/stop). */
    public readonly speech: SpeechReader;

    private state: A11yState;

    public constructor(public readonly config: Readonly<A11yConfig>) {
        this.store = new SettingsStore(config.cookieName, config.cookieMaxAgeDays);
        this.styles = new StyleInjector(STYLE_ID);
        this.speech = new SpeechReader(config);

        this.features = [
            ColorScheme,
            ImageMode,
            FontScale,
            Typography,
            HighContrast,
            Highlight,
            BigCursor,
            StopAnimations,
            new ReadingGuide(),
            new BlockEmbeds(config),
            this.speech,
        ];

        this.context = {
            root: document.documentElement,
            uiClass: UI_CLASS,
            speak: (text: string): void => this.speech.speak(text),
        };

        this.state = this.pruneDisabled(this.store.load());
    }

    /** Текущее состояние. Только на чтение — менять через set/toggle/reset. */
    public get current(): Readonly<A11yState> {
        return this.state;
    }

    /**
     * Применить состояние к документу.
     *
     * Вызывается один раз при загрузке (из <head>, до первой отрисовки) и далее
     * на каждое изменение. CSS собирается заново целиком — это дешевле, чем
     * поддерживать инкрементальные правки, и не даёт правилам разъезжаться.
     */
    public apply(): void {
        const root = document.documentElement;

        root.classList.toggle(ROOT_CLASS, this.state.enabled);

        if (this.state.enabled && this.state.scheme !== 'default') {
            root.setAttribute(SCHEME_ATTR, this.state.scheme);
        } else {
            root.removeAttribute(SCHEME_ATTR);
        }

        let css = '';
        for (const feature of this.features) {
            css += feature.css?.(this.state, this.config) ?? '';
        }
        this.styles.write(css);

        for (const feature of this.features) {
            feature.sync?.(this.state, this.context);
        }

        for (const listener of this.listeners) {
            listener(this.state);
        }
    }

    /**
     * Изменить одно значение.
     *
     * Дженерик связывает ключ и тип значения: `set('scheme', true)` не соберётся.
     *
     * @param announce подпись для голосового объявления; без неё изменение
     *                 применяется молча
     */
    public set<K extends keyof A11yState>(
        key: K,
        value: A11yState[K],
        announce?: string,
    ): void {
        if (this.state[key] === value) {
            return;
        }

        const next: A11yState = {...this.state};
        next[key] = value;

        // Любая правка настройки включает саму версию для слабовидящих: иначе
        // человек щёлкает переключатели, а на странице ничего не происходит.
        if (key !== 'enabled') {
            next.enabled = true;
        }

        this.commit(next, announce);
    }

    /**
     * Установить значение, пришедшее строкой из разметки панели.
     *
     * Отдельный метод, а не приведение типа на стороне UI: разметку печатает
     * сервер, но между сервером и браузером лежит DOM, который правится
     * расширениями и devtools. Значение прогоняется через тот же нормализатор,
     * что и содержимое cookie, — недопустимое молча заменяется дефолтом,
     * и в состояние заведомо не попадает мусор.
     */
    public setFromMarkup(key: string, value: string, announce?: string): void {
        if (!(key in DEFAULT_STATE)) {
            return;
        }

        const typed = key as keyof A11yState;
        const next = SettingsStore.normalize({...this.state, [typed]: value});

        if (next[typed] === this.state[typed]) {
            return;
        }

        next.enabled = true;
        this.commit(next, announce);
    }

    /** Переключить булеву настройку. */
    public toggle(key: BooleanStateKey, announce?: string): void {
        this.set(key, !this.state[key], announce);
    }

    /**
     * Сдвинуть масштаб шрифта на шаг.
     *
     * Границы берутся из конфигурации, а не из константы: сайту с плотной
     * вёрсткой может хватить 150 %, а требование ГОСТ-панели — 200 %.
     */
    public adjustFontScale(direction: 1 | -1, announce?: string): void {
        const {fontScaleMin, fontScaleMax, fontScaleStep} = this.config;

        const next = clamp(
            round(this.state.fontScale + direction * fontScaleStep),
            fontScaleMin,
            fontScaleMax,
        );

        this.set('fontScale', next, announce);
    }

    /** Сбросить настройки, оставив версию для слабовидящих включённой. */
    public reset(announce?: string): void {
        this.commit({...DEFAULT_STATE, enabled: true}, announce);
    }

    /** Вернуться к обычной версии сайта: всё выключить и стереть cookie. */
    public disable(): void {
        this.speech.stop();
        this.state = {...DEFAULT_STATE};
        this.store.clear();
        this.apply();
    }

    /** Подписаться на изменения. Возвращает функцию отписки. */
    public subscribe(listener: StateListener): () => void {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Принять новое состояние: сохранить, применить, при необходимости озвучить.
     *
     * Единственный путь, которым состояние меняется. Всё остальное — set,
     * setFromMarkup, adjustFontScale, reset — только готовит следующее значение.
     */
    private commit(next: A11yState, announce?: string): void {
        this.state = next;
        this.store.save(next);
        this.apply();

        if (announce !== undefined && this.config.speechAnnounce) {
            this.speech.speak(announce);
        }
    }

    /**
     * Сбросить к дефолту всё, что администратор выключил в настройках модуля.
     *
     * Разбор — в комментарии к A11yConfig.enabledControls.
     */
    private pruneDisabled(state: A11yState): A11yState {
        const allowed = this.config.enabledControls;
        if (allowed.length === 0) {
            return state;
        }

        const result = {...state};
        for (const key of Object.keys(DEFAULT_STATE) as (keyof A11yState)[]) {
            if (key !== 'enabled' && !allowed.includes(key)) {
                Object.assign(result, {[key]: DEFAULT_STATE[key]});
            }
        }

        return result;
    }
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function round(value: number): number {
    return Math.round(value * 1000) / 1000;
}
