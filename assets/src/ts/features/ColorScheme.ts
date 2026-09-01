/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

import {NOT_UI, ROOT_CLASS, SCHEME_ATTR} from '../dom/selectors';
import type {A11yConfig, A11yState, Feature} from '../types';

/**
 * Цветовые схемы.
 *
 * Работа идёт в два слоя, и это принципиально.
 *
 * Слой токенов — без !important. Переопределяет CSS-переменные Bootstrap
 * (--bs-body-color, --bs-link-color, --bs-border-color и родню) и собственные
 * переменные пакета. Всё, что тема строит на переменных, перекрашивается
 * штатно, вместе с состояниями hover/focus и границами. Никакого силового
 * давления для таких тем не нужно.
 *
 * Силовой слой — с !important, по `*`. Нужен для вёрстки, которая красится
 * литералами мимо переменных: сторонние виджеты, легаси-блоки, инлайновые
 * стили из визуального редактора. Без него результат «пятнистый»: часть
 * страницы перекрасилась, часть осталась.
 *
 * Силовой слой идёт именно по `*`, а не по списку текстовых элементов:
 * перекрасить только текст мало — фон задаётся обёрткам, а их в списке нет,
 * и получается тот же пятнистый результат, только наоборот.
 */
export const ColorScheme: Feature = {
    id: 'scheme',

    css(state: Readonly<A11yState>, config: Readonly<A11yConfig>): string {
        if (!state.enabled || state.scheme === 'default') {
            return '';
        }

        const scheme = config.schemes[state.scheme];
        if (scheme === undefined) {
            return '';
        }

        const scope = `html.${ROOT_CLASS}[${SCHEME_ATTR}]`;
        const {fg, bg, accent} = scheme;

        return [
            // ── Слой 1: токены ────────────────────────────────────────────────
            `${scope}{`,
            `--bes-a11y-fg:${fg};--bes-a11y-bg:${bg};--bes-a11y-accent:${accent};`,
            `--bs-body-color:${fg};--bs-body-color-rgb:${toRgb(fg)};`,
            `--bs-body-bg:${bg};--bs-body-bg-rgb:${toRgb(bg)};`,
            `--bs-emphasis-color:${fg};--bs-secondary-color:${fg};`,
            `--bs-tertiary-color:${fg};--bs-heading-color:${fg};`,
            `--bs-border-color:${fg};--bs-border-color-translucent:${fg};`,
            `--bs-link-color:${accent};--bs-link-color-rgb:${toRgb(accent)};`,
            `--bs-link-hover-color:${accent};`,
            `--bs-secondary-bg:${bg};--bs-tertiary-bg:${bg};`,
            `}`,

            // ── Слой 2: силовой ───────────────────────────────────────────────
            // Фоновые картинки и тени гасятся намеренно: декоративная подложка
            // под текстом — главный убийца контраста, ради которого схему и
            // включают.
            `${scope},${scope} body{background-color:${bg}!important;color:${fg}!important;}`,
            `${scope} *${NOT_UI}{`,
            `background-color:${bg}!important;color:${fg}!important;`,
            `border-color:${fg}!important;background-image:none!important;`,
            `box-shadow:none!important;text-shadow:none!important;`,
            // Текст, залитый градиентом через background-clip: text, красится
            // НЕ свойством color, а фоном элемента: у таких глифов стоит
            // -webkit-text-fill-color: transparent. Без сброса ниже строки выше
            // делают ровно наоборот задуманного — гасят градиент и заливают фон
            // цветом bg, отчего текст сливается с фоном подчистую. Приём частый
            // (анимированные пункты меню, «наливающиеся» заголовки), и на глаз
            // он неотличим от обычного текста, пока схему не включат.
            // currentColor, а не литерал: у ссылок ниже свой цвет, и текст должен
            // взять именно его.
            `-webkit-text-fill-color:currentColor!important;`,
            `background-clip:border-box!important;-webkit-background-clip:border-box!important;`,
            `}`,

            // Ссылки — акцентом и обязательно подчёркиванием: при двухцветной
            // палитре цвет один и тот же, и подчёркивание остаётся единственным
            // признаком, отличающим ссылку от текста (WCAG 1.4.1).
            `${scope} a${NOT_UI},${scope} a *${NOT_UI}{`,
            `color:${accent}!important;text-decoration:underline!important;`,
            `}`,

            // Инлайновые иконки перекрашиваются вместе с текстом. fill/stroke
            // берут currentColor, а не литерал: так работает и вложенная графика.
            `${scope} svg${NOT_UI},${scope} svg *${NOT_UI}{`,
            `fill:currentColor!important;stroke:currentColor!important;`,
            `}`,

            // Поля ввода без видимой рамки на одноцветном фоне сливаются
            // с полотном, поэтому рамка задаётся явно.
            `${scope} :is(input,textarea,select)${NOT_UI}{`,
            `border:2px solid ${fg}!important;`,
            `}`,
        ].join('');
    },
};

/**
 * `#rrggbb` → `r, g, b`.
 *
 * Bootstrap собирает полупрозрачные варианты как rgba(var(--bs-*-rgb), α),
 * поэтому парные *-rgb переменные обязаны существовать — иначе rgba()
 * получает мусор и цвет схлопывается в чёрный.
 */
function toRgb(hex: string): string {
    const value = Number.parseInt(hex.slice(1), 16);

    return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
}
