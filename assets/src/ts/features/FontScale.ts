/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

import {SCOPE, UI_CLASS} from '../dom/selectors';
import type {A11yConfig, A11yState, Feature} from '../types';

/**
 * Масштаб шрифта.
 *
 * Здесь нет обхода DOM, и это осознанный отказ от напрашивающегося решения.
 * Пройти querySelectorAll, прочитать у каждого элемента getComputedStyle
 * и записать инлайновый font-size — способ рабочий, но у него три беды:
 * чтение вычисленного стиля вызывает синхронный reflow на КАЖДЫЙ элемент при
 * КАЖДОМ нажатии; контент, пришедший позже (ajax, ленивая подгрузка), остаётся
 * немасштабированным; а инлайновые пиксели затирают rem-вёрстку темы.
 *
 * Здесь — одно правило на корневой элемент. Оно бесплатно, работает для любого
 * контента, включая подгруженный асинхронно уже после применения настроек,
 * и не ломает размерную шкалу темы.
 *
 * Переменная --bes-a11y-font-scale выставляется всегда, даже при масштабе 1:
 * это публичный хук, по которому тема может доводить собственные величины,
 * не завязанные на rem.
 */
export const FontScale: Feature = {
    id: 'fontScale',

    css(state: Readonly<A11yState>, config: Readonly<A11yConfig>): string {
        if (!state.enabled) {
            return '';
        }

        const scale = state.fontScale;
        const declarations = [`${SCOPE}{--bes-a11y-font-scale:${scale};}`];

        if (scale === 1) {
            return declarations.join('');
        }

        if (config.fontScaleMode === 'zoom') {
            // zoom тянет и vw-слагаемое в clamp(), то есть даёт честные 200 %
            // на плавной шкале. Расплата: панель тоже внутри <body>, поэтому
            // её приходится ужимать обратно — иначе меню разъедется вслед за
            // страницей и перестанет помещаться на экран.
            declarations.push(`${SCOPE}{zoom:${scale};}`);
            declarations.push(`.${UI_CLASS}{zoom:${round(1 / scale)};}`);

            return declarations.join('');
        }

        // Режим root: корневой font-size. Семантически верный путь — уважает
        // настройки браузера и не превращает вёрстку в фиксированные пиксели.
        // Ограничение честно описано в types.ts (FontScaleMode).
        declarations.push(`${SCOPE}{font-size:calc(100% * ${scale});}`);

        return declarations.join('');
    },
};

/** Округление до 4 знаков, чтобы в CSS не лезли хвосты вида 0.8000000000001. */
function round(value: number): number {
    return Math.round(value * 10000) / 10000;
}
