/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

/**
 * Контракты панели доступности.
 *
 * Все допустимые значения объявлены как `as const`-кортежи, а типы выведены из них.
 * Это не украшательство: тот же кортеж используется в рантайме для валидации
 * значения, пришедшего из cookie. Одно объявление — и тип, и проверка, разъехаться
 * им негде.
 */

import {SCHEMES, type Scheme} from './schemes';

export const SPACING_STEPS = ['normal', 'medium', 'large'] as const;
export type Spacing = (typeof SPACING_STEPS)[number];

export const SCHEME_IDS = [
    'default',
    'black-on-white',
    'white-on-black',
    'blue-on-cyan',
    'brown-on-beige',
    'green-on-dark',
] as const;
export type SchemeId = (typeof SCHEME_IDS)[number];

export const IMAGE_MODES = ['normal', 'grayscale', 'hidden'] as const;
export type ImageMode = (typeof IMAGE_MODES)[number];

export const FONT_FAMILIES = ['default', 'sans', 'serif', 'dyslexic'] as const;
export type FontFamilyId = (typeof FONT_FAMILIES)[number];

/**
 * Полное состояние панели.
 *
 * Ровно то, что уезжает в cookie и приезжает обратно. Никаких «прочих ключей»
 * (`[key: string]: unknown`) — иначе валидация превращается в фикцию.
 */
export interface A11yState {
    /** Включена ли версия для слабовидящих целиком. */
    enabled: boolean;
    /** Множитель размера шрифта: 1 = 100 %. */
    fontScale: number;
    scheme: SchemeId;
    images: ImageMode;
    fontFamily: FontFamilyId;
    letterSpacing: Spacing;
    lineHeight: Spacing;
    highContrast: boolean;
    highlightLinks: boolean;
    highlightTitles: boolean;
    bigCursor: boolean;
    stopAnimations: boolean;
    readingGuide: boolean;
    blockEmbeds: boolean;
    /** Включён ли синтезатор речи (озвучка выделения и кликов). */
    speech: boolean;
}

/** Ключи состояния, значение которых — булево. Нужен для generic-переключателей UI. */
export type BooleanStateKey = {
    [K in keyof A11yState]: A11yState[K] extends boolean ? K : never;
}[keyof A11yState];

export const DEFAULT_STATE: Readonly<A11yState> = Object.freeze({
    enabled: false,
    fontScale: 1,
    scheme: 'default',
    images: 'normal',
    fontFamily: 'default',
    letterSpacing: 'normal',
    lineHeight: 'normal',
    highContrast: false,
    highlightLinks: false,
    highlightTitles: false,
    bigCursor: false,
    stopAnimations: false,
    readingGuide: false,
    blockEmbeds: false,
    speech: false,
});

/**
 * Способ масштабирования шрифта.
 *
 * `root` — меняем корневой font-size. Семантически правильный путь: уважает
 *   пользовательские настройки браузера и не превращает вёрстку в фиксированные px.
 *   Ограничение: если тема строит типографику на «плавной» шкале вида
 *   clamp(rem, vw, rem), масштабируется только rem-часть, vw-слагаемое
 *   остаётся прежним, и до заявленных 200 % текст не дотягивает.
 *
 * `zoom` — CSS-свойство zoom на <html>. Тянет ВСЁ, включая vw-часть clamp, то есть
 *   честные 200 % на плавной шкале. Плата: масштабируется буквально всё
 *   содержимое документа, включая саму панель настроек, и у элементов
 *   с position: fixed пропорционально пересчитываются отступы. Панель из-под
 *   этого выведена обратным множителем (см. FontScale.ts), иначе меню
 *   раздувается вместе со страницей и перестаёт помещаться на экран.
 */
export type FontScaleMode = 'root' | 'zoom';

/** Конфигурация, приходящая с сервера (настройки модуля + переводы). */
export interface A11yConfig {
    /** Имя cookie. Должно совпадать с AccessibilityState::COOKIE_NAME на стороне PHP. */
    cookieName: string;
    /** Срок жизни cookie в днях. */
    cookieMaxAgeDays: number;
    fontScaleMode: FontScaleMode;
    fontScaleMin: number;
    fontScaleMax: number;
    fontScaleStep: number;
    /** BCP-47 язык для синтезатора речи, например `ru-RU`. */
    speechLang: string;
    /** Скорость речи, 0.1…10 по спецификации SpeechSynthesisUtterance. */
    speechRate: number;
    /** Озвучивать ли изменения настроек (требование, привычное по ГОСТ-панелям). */
    speechAnnounce: boolean;
    /**
     * Какие настройки доступны пользователю. Пустой массив = все.
     *
     * Список нужен обеим сторонам: PHP по нему решает, какие органы управления
     * печатать в панели, а контроллёр — какие ключи состояния сбросить к дефолту.
     * Второе не формальность: настройку могли выключить уже после того, как
     * посетитель ею воспользовался, и в его cookie осталось `bigCursor: true`.
     * Без сброса выключенный инструмент продолжал бы работать без всякой
     * возможности его отключить — органа управления-то в панели больше нет.
     */
    enabledControls: readonly (keyof A11yState)[];
    /**
     * Цвета схем.
     *
     * Приезжают с сервера (support/Schemes.php), чтобы образцы в панели и
     * правила CSS брались из одного места. Карта в schemes.ts остаётся
     * запасным вариантом на случай запуска без серверной конфигурации.
     */
    schemes: Readonly<Partial<Record<SchemeId, Scheme>>>;
    /** Подписи для голосовых объявлений и служебных текстов. */
    labels: Readonly<Record<string, string>>;
}

export const DEFAULT_CONFIG: Readonly<A11yConfig> = Object.freeze({
    cookieName: 'bes_a11y',
    cookieMaxAgeDays: 365,
    fontScaleMode: 'zoom',
    fontScaleMin: 1,
    fontScaleMax: 2,
    fontScaleStep: 0.125,
    speechLang: 'ru-RU',
    speechRate: 1,
    speechAnnounce: true,
    enabledControls: [],
    schemes: SCHEMES,
    labels: {},
});

/**
 * Что фича получает от контроллёра.
 *
 * Намеренно узкий интерфейс: фича не знает ни про хранилище, ни про панель,
 * ни про других фич. Всё, что ей нужно, — корень документа, класс-исключение
 * для собственного интерфейса панели и возможность что-то произнести.
 */
export interface FeatureContext {
    /** `document.documentElement`. */
    readonly root: HTMLElement;
    /**
     * CSS-класс контейнера панели. Любое правило фичи обязано исключать это
     * поддерево: панель живёт внутри <body> и без исключения перекрашивается
     * и пережирнеет вместе со страницей — то есть человек перестаёт видеть,
     * что именно он нажимает.
     */
    readonly uiClass: string;
    /** Произнести текст, если озвучка включена. Иначе — no-op. */
    speak(text: string): void;
}

/**
 * Единица функциональности панели.
 *
 * Две трети инструментов — чистый CSS, и им достаточно `css()`. Остальным
 * (линейка чтения, блокировка встроенных элементов, озвучка) нужны узлы и
 * слушатели — для них `sync()` и `destroy()`. Разделение позволяет контроллёру
 * собрать ВЕСЬ CSS в один <style>, вместо россыпи тегов по одному на инструмент.
 */
export interface Feature {
    /** Стабильный идентификатор, он же ключ в `A11yConfig.features`. */
    readonly id: string;

    /**
     * CSS для текущего состояния. Пустая строка — фича выключена.
     * Метод обязан быть чистым: никаких обращений к DOM.
     */
    css?(state: Readonly<A11yState>, config: Readonly<A11yConfig>): string;

    /** Побочные эффекты. Вызывается на каждое изменение состояния. */
    sync?(state: Readonly<A11yState>, ctx: FeatureContext): void;

    /** Снять всё, что навесил `sync()`. Обязателен, если `sync()` создаёт узлы. */
    destroy?(): void;
}
