/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

import {UI_CLASS} from '../dom/selectors';
import type {A11yState, Feature, FeatureContext} from '../types';

/** Половина высоты прозрачной полосы, в пикселях. */
const HALF_BAND = 24;

/**
 * Линейка чтения: затемняет всё, кроме горизонтальной полосы под указателем.
 *
 * Слушатель — pointermove, а не mousemove: pointer-события покрывают ещё перо
 * и трекпад-жесты, а на устройствах без указателя просто не приходят, и фича
 * тихо не мешает.
 *
 * Слушатель пассивный. Он ничего не отменяет, и обещание этого браузеру
 * снимает блокировку прокрутки на время обработки: с `{ passive: false }`
 * браузер обязан дожидаться обработчик на каждом движении указателя, прежде
 * чем прокрутить страницу.
 *
 * Ссылка на слушатель хранится в поле экземпляра, а не в глобальной переменной.
 * Глобаль переживает повторную инициализацию: ссылка на прежнюю функцию
 * теряется, removeEventListener снять её уже не может, и слушатель остаётся
 * висеть на документе до перезагрузки страницы.
 */
export class ReadingGuide implements Feature {
    public readonly id = 'readingGuide';

    private container: HTMLElement | null = null;
    private top: HTMLElement | null = null;
    private bottom: HTMLElement | null = null;
    private readonly onPointerMove = (event: PointerEvent): void => {
        if (this.top === null || this.bottom === null) {
            return;
        }

        const y = event.clientY;
        this.top.style.height = `${Math.max(y - HALF_BAND, 0)}px`;
        this.bottom.style.height = `${Math.max(window.innerHeight - y - HALF_BAND, 0)}px`;
    };

    public sync(state: Readonly<A11yState>, _ctx: FeatureContext): void {
        if (state.enabled && state.readingGuide) {
            this.mount();
        } else {
            this.destroy();
        }
    }

    public destroy(): void {
        if (this.container === null) {
            return;
        }

        document.removeEventListener('pointermove', this.onPointerMove);
        this.container.remove();
        this.container = null;
        this.top = null;
        this.bottom = null;
    }

    private mount(): void {
        if (this.container !== null) {
            return;
        }

        const container = document.createElement('div');
        // Класс панели — чтобы силовые правила цветовой схемы обошли линейку
        // стороной: она обязана остаться полупрозрачной чёрной.
        container.className = `${UI_CLASS} bes-a11y-guide`;
        container.setAttribute('aria-hidden', 'true');

        this.top = document.createElement('div');
        this.top.className = 'bes-a11y-guide__band';
        this.bottom = document.createElement('div');
        this.bottom.className = 'bes-a11y-guide__band';

        container.append(this.top, this.bottom);
        document.body.appendChild(container);
        this.container = container;

        document.addEventListener('pointermove', this.onPointerMove, {passive: true});
    }
}
