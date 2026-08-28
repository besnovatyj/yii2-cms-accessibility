/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

import {SCOPE, UI_CLASS} from '../dom/selectors';
import type {A11yState, Feature} from '../types';

/**
 * Усиление контраста фильтром.
 *
 * ⚠ Фильтр НЕ вешается на <html>, и это не вкусовщина. Любой filter, отличный
 * от none, делает элемент содержащим блоком для потомков с position: fixed —
 * они перестают быть привязанными к окну и начинают вести себя как absolute.
 * Фильтр на <html> тем самым ломает на странице всё закреплённое — шапки,
 * кнопки «наверх», плавающие панели, — причём ровно в тот момент, когда
 * человек включает инструмент доступности.
 *
 * Здесь фильтр применяется к прямым детям <body>, а панель из-под него выведена
 * отдельным исключением — так у неё остаётся рабочий position: fixed.
 */
export const HighContrast: Feature = {
    id: 'highContrast',

    css(state: Readonly<A11yState>): string {
        if (!state.enabled || !state.highContrast) {
            return '';
        }

        return `${SCOPE} body > *:not(.${UI_CLASS}){filter:contrast(1.35);}`;
    },
};
