/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

import {NOT_UI, SCOPE} from '../dom/selectors';
import type {A11yState, Feature} from '../types';

/** Толщина и цвет обводки. Цвет берётся из схемы, если она включена. */
const OUTLINE = '3px solid var(--bes-a11y-accent, #0048ff)';

/**
 * Выделение ссылок и заголовков.
 *
 * Обводка делается через outline, а не border: outline не входит в поток и не
 * сдвигает соседей, поэтому включение подсветки не перекраивает страницу.
 *
 * Заголовки и ссылки разведены по отдельным переключателям, но живут в одной
 * фиче — правило у них общее с точностью до списка элементов.
 */
export const Highlight: Feature = {
    id: 'highlight',

    css(state: Readonly<A11yState>): string {
        if (!state.enabled) {
            return '';
        }

        const rules: string[] = [];

        if (state.highlightLinks) {
            rules.push(
                `${SCOPE} a[href]${NOT_UI}{outline:${OUTLINE};outline-offset:2px;}`,
            );
        }

        if (state.highlightTitles) {
            rules.push(
                `${SCOPE} :is(h1,h2,h3,h4,h5,h6)${NOT_UI}{outline:${OUTLINE};outline-offset:2px;}`,
            );
        }

        return rules.join('');
    },
};
