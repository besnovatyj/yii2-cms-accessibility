/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

import {NOT_ICON, NOT_UI, SCOPE, TEXT_SELECTORS, selectorList} from '../dom/selectors';
import type {A11yState, Feature, Spacing} from '../types';

/** Межбуквенный интервал по ступеням. */
const LETTER_SPACING: Readonly<Record<Spacing, string>> = {
    normal: '',
    medium: '0.08em',
    large: '0.16em',
};

/** Межстрочный интервал по ступеням. */
const LINE_HEIGHT: Readonly<Record<Spacing, string>> = {
    normal: '',
    medium: '1.8',
    large: '2.4',
};

/**
 * Семейства шрифтов.
 *
 * Ключа `default` здесь нет намеренно: «как на сайте» означает не подменять
 * шрифт вовсе, а не подставить какой-то ещё. Отсутствие ключа и есть это
 * «ничего не делать» — см. проверку на undefined ниже.
 *
 * OpenDyslexic объявлен в panel.css, файлы лежат в пакете. Запасные варианты
 * после него — на случай, если файл не доехал: Comic Sans MS не «шутка»,
 * а единственный широко установленный шрифт с похожим свойством —
 * несимметричными формами букв, которые труднее спутать при зеркалировании.
 */
const FONT_FAMILY: Readonly<Record<string, string>> = {
    sans: 'Arial, Helvetica, "Segoe UI", sans-serif',
    serif: '"Times New Roman", Times, Georgia, serif',
    dyslexic: 'OpenDyslexic, "Comic Sans MS", Verdana, sans-serif',
};

/**
 * Селектор текстовых элементов с двумя исключениями.
 *
 * NOT_ICON обязателен: в иконочных наборах иконка — это глиф в подменённом
 * font-family, и любое вмешательство в шрифт или межбуквенный интервал
 * превращает её в квадратик. NOT_UI бережёт саму панель.
 */
const TEXT = selectorList(TEXT_SELECTORS, SCOPE, NOT_ICON, NOT_UI);

/**
 * Типографика: семейство шрифта, межбуквенный и межстрочный интервал.
 *
 * Три близкородственных настройки собраны в одну фичу сознательно: они делят
 * один и тот же нетривиальный селектор. Разнеси их по файлам — селектор
 * придётся продублировать трижды, и рано или поздно копии разъедутся.
 *
 * Интервалы применяются к списку текстовых элементов, а не к `html *`:
 * разбор — в комментарии к TEXT_SELECTORS.
 */
export const Typography: Feature = {
    id: 'typography',

    css(state: Readonly<A11yState>): string {
        if (!state.enabled) {
            return '';
        }

        const declarations: string[] = [];

        const family = FONT_FAMILY[state.fontFamily];
        if (family !== undefined) {
            declarations.push(`font-family:${family}!important;`);
        }

        const letterSpacing = LETTER_SPACING[state.letterSpacing];
        if (letterSpacing !== '') {
            declarations.push(`letter-spacing:${letterSpacing}!important;`);
        }

        const lineHeight = LINE_HEIGHT[state.lineHeight];
        if (lineHeight !== '') {
            declarations.push(`line-height:${lineHeight}!important;`);
        }

        if (declarations.length === 0) {
            return '';
        }

        return `${TEXT}{${declarations.join('')}}`;
    },
};
