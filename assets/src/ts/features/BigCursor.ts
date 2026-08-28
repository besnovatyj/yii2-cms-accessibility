/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

import {SCOPE} from '../dom/selectors';
import type {A11yState, Feature} from '../types';

/**
 * Размер картинки курсора в CSS-пикселях.
 *
 * ⚠ Не увеличивать. Chrome и Safari молча отбрасывают курсор, если его размер,
 * умноженный на devicePixelRatio, превышает 128 px. Ошибка коварна тем, что
 * зависит от экрана: скажем, 98 px на обычном мониторе работает, а на HiDPI
 * (98 × 2 = 196) курсор просто не появляется, и выглядит это как «инструмент
 * сломан». 48 × 2 = 96 — запас есть на любом экране.
 */
const SIZE = 48;

/** Белая стрелка с чёрной обводкой — читается и на светлом, и на тёмном фоне. */
const ARROW =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${SIZE}' height='${SIZE}' viewBox='0 0 32 32'>` +
    `<path d='M6 2 L6 26 L12 20 L16 30 L21 28 L17 18 L26 18 Z' ` +
    `fill='%23ffffff' stroke='%23000000' stroke-width='2' stroke-linejoin='round'/>` +
    `</svg>`;

/**
 * Увеличенный курсор.
 *
 * Правило покрывает и сам корневой элемент, и потомков. Одного `body *` мало:
 * под него не попадают ни <html>, ни сам <body>, поэтому над полями страницы
 * и внешними отступами курсор оставался бы обычным.
 *
 * Горячая точка (0 0) совпадает с остриём стрелки на картинке.
 */
export const BigCursor: Feature = {
    id: 'bigCursor',

    css(state: Readonly<A11yState>): string {
        if (!state.enabled || !state.bigCursor) {
            return '';
        }

        const url = `url("data:image/svg+xml,${ARROW}") 0 0, auto`;

        return `${SCOPE},${SCOPE} body,${SCOPE} *{cursor:${url}!important;}`;
    },
};
