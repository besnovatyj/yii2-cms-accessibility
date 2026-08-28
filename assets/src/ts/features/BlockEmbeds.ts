/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

import {UI_CLASS} from '../dom/selectors';
import type {A11yConfig, A11yState, Feature, FeatureContext} from '../types';

/** Что считается встроенным элементом. */
const EMBEDS = 'iframe, object, embed';

/**
 * Блокировка встроенных элементов: видео, карт, виджетов соцсетей.
 *
 * Зачем это в панели доступности: чужой iframe — это чужая вёрстка, до которой
 * не достают ни цветовая схема, ни масштаб шрифта. Для человека, включившего
 * «белым по чёрному», посреди страницы остаётся ярко-белый прямоугольник.
 * Плюс встроенные плееры — источник неожиданного звука и движения.
 *
 * Вместо простого скрытия ставится заглушка с подписью. Пустое место
 * непонятно: человек решит, что страница не загрузилась.
 *
 * Наблюдение за DOM намеренно НЕ ведётся: MutationObserver на всём документе
 * ради выключенной по умолчанию функции — это постоянный расход на каждой
 * странице. Вместо этого повторный проход делается по требованию, из
 * контроллёра (см. refresh()).
 */
export class BlockEmbeds implements Feature {
    public readonly id = 'blockEmbeds';

    /** Заблокированный элемент → его заглушка. */
    private readonly blocked = new Map<Element, HTMLElement>();

    public constructor(private readonly config: Readonly<A11yConfig>) {
    }

    public sync(state: Readonly<A11yState>, _ctx: FeatureContext): void {
        if (state.enabled && state.blockEmbeds) {
            this.block();
        } else {
            this.destroy();
        }
    }

    public destroy(): void {
        for (const [element, placeholder] of this.blocked) {
            placeholder.remove();
            if (element instanceof HTMLElement) {
                element.style.removeProperty('display');
            }
        }

        this.blocked.clear();
    }

    /** Заблокировать всё, что ещё не заблокировано. Идемпотентно. */
    private block(): void {
        const label = this.config.labels['embedBlocked'] ?? 'Встроенный элемент отключён';

        for (const element of document.querySelectorAll(EMBEDS)) {
            if (this.blocked.has(element) || element.closest(`.${UI_CLASS}`) !== null) {
                continue;
            }

            const placeholder = document.createElement('div');
            placeholder.className = 'bes-a11y-embed-stub';
            placeholder.textContent = label;

            element.parentNode?.insertBefore(placeholder, element);
            if (element instanceof HTMLElement) {
                element.style.setProperty('display', 'none', 'important');
            }

            this.blocked.set(element, placeholder);
        }
    }
}
