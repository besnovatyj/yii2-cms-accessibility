/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

import {SCOPE} from '../dom/selectors';
import type {A11yState, Feature} from '../types';

/**
 * Остановка анимаций.
 *
 * ⚠ Гасим НУЛЕВОЙ ДЛИТЕЛЬНОСТЬЮ, а не отменой. Это не микрооптимизация,
 * а условие работоспособности.
 *
 * У анимаций появления обычно стоит animation-fill-mode: both или forwards —
 * конечное состояние задаёт сама анимация. Написать `animation: none` значит
 * заморозить элемент в ПЕРВОМ кадре: блок, который должен был выехать на своё
 * место, остаётся сдвинутым, и вёрстка ломается. С длительностью 0.01 ms
 * анимация отрабатывает мгновенно и доходит до конечного кадра.
 *
 * animation-iteration-count нужен отдельной строкой: у бесконечных анимаций
 * (спиннеры, «дышащие» кнопки) нулевая длительность сама по себе не помогает —
 * они продолжают перезапускаться, просто быстрее.
 *
 * Тот же приём используют реализации prefers-reduced-motion — в том числе
 * штатная у Bootstrap.
 *
 * Чего правило НЕ закрывает: движение, которым управляет JS — автопрокрутка
 * слайдеров, переходы лайтбоксов. У них свои настройки, CSS до них не достаёт.
 */
export const StopAnimations: Feature = {
    id: 'stopAnimations',

    css(state: Readonly<A11yState>): string {
        if (!state.enabled || !state.stopAnimations) {
            return '';
        }

        return (
            `${SCOPE} *,${SCOPE} *::before,${SCOPE} *::after{` +
            `animation-duration:0.01ms!important;` +
            `animation-iteration-count:1!important;` +
            `transition-duration:0.01ms!important;` +
            `scroll-behavior:auto!important;` +
            `}`
        );
    },
};
