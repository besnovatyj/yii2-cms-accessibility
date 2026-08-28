/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

import {NOT_UI, SCOPE} from '../dom/selectors';
import type {A11yState, Feature} from '../types';

/** Элементы, которые считаются «изображением» для целей панели. */
const MEDIA = 'img,picture,video,canvas';

/**
 * Режим изображений: обычные / чёрно-белые / скрытые.
 *
 * Скрытие сделано через visibility, а не display: элемент продолжает занимать
 * место, и вёрстка не прыгает. Для человека с остаточным зрением прыгающая
 * при переключении страница хуже, чем пустое место на месте картинки.
 *
 * Фоновые изображения гасятся вместе с элементами: без этого «изображения
 * выключены» остаётся полуправдой — половина картинок на типовом сайте
 * приезжает через background-image.
 */
export const ImageMode: Feature = {
    id: 'images',

    css(state: Readonly<A11yState>): string {
        if (!state.enabled || state.images === 'normal') {
            return '';
        }

        if (state.images === 'grayscale') {
            return `${SCOPE} :is(${MEDIA})${NOT_UI}{filter:grayscale(100%)!important;}`;
        }

        return [
            `${SCOPE} :is(${MEDIA})${NOT_UI}{visibility:hidden!important;}`,
            `${SCOPE} *${NOT_UI}{background-image:none!important;}`,
        ].join('');
    },
};
