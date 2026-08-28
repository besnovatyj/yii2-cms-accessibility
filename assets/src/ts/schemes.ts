/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

import type {SchemeId} from './types';

/**
 * Цветовая схема: две краски плюс акцент.
 *
 * Смысл схемы для слабовидящего — свести палитру страницы к ОДНОЙ паре
 * «текст/фон» с максимальным контрастом. Поэтому здесь нет ни полутонов,
 * ни отдельного цвета границ: границы красятся текстовым цветом.
 */
export interface Scheme {
    /** Цвет текста и границ. */
    fg: string;
    /** Цвет фона. */
    bg: string;
    /** Цвет ссылок и активных элементов. */
    accent: string;
}

/**
 * Набор схем, привычный по российским «версиям для слабовидящих».
 *
 * Контраст каждой пары проверен по WCAG 2.1 (1.4.3 требует 4.5 : 1 для обычного
 * текста); все пары дают 7 : 1 и выше, то есть проходят и уровень AAA.
 *
 * `default` намеренно отсутствует в карте: это «схема не выбрана», и обращение
 * к ней должно давать undefined, а не пустую схему, которую можно случайно
 * применить.
 */
export const SCHEMES: Readonly<Partial<Record<SchemeId, Scheme>>> = Object.freeze({
    'black-on-white': {fg: '#000000', bg: '#ffffff', accent: '#0000cc'},
    'white-on-black': {fg: '#ffffff', bg: '#000000', accent: '#ffff00'},
    'blue-on-cyan': {fg: '#063462', bg: '#9dd1ff', accent: '#063462'},
    'brown-on-beige': {fg: '#4d4b43', bg: '#f7f3d6', accent: '#4d4b43'},
    'green-on-dark': {fg: '#a9e44d', bg: '#3b2716', accent: '#a9e44d'},
});
