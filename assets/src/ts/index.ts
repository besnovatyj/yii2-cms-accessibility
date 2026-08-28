/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

/**
 * Точка входа бандла. Публикуется как глобаль `BesA11y`.
 *
 * Побочных эффектов нет и быть не должно: файл только объявляет boot().
 * Вызывает его инлайновый скрипт, который печатает AccessibilityPanel, —
 * оттуда же приходит конфигурация с сервера.
 *
 * Порядок в <head> получается такой:
 *   1. <script src="accessibility.js">  — объявляет BesA11y;
 *   2. <script>BesA11y.boot({…})</script> — применяет настройки из cookie.
 * Второй шаг отрабатывает до первой отрисовки, поэтому обычная версия сайта
 * не успевает мигнуть. Именно ради этого бандл собирается в iife, а не в
 * ES-модуль: <script type="module"> всегда defer.
 *
 * Разметка панели к этому моменту ещё не разобрана — она ниже по документу.
 * Поэтому подключение органов управления отложено до DOMContentLoaded.
 */

import {AccessibilityController} from './core/Controller';
import {SettingsStore} from './core/SettingsStore';
import {StyleInjector} from './core/StyleInjector';
import {Panel} from './ui/Panel';
import {DEFAULT_CONFIG, type A11yConfig} from './types';

export {AccessibilityController, Panel, SettingsStore, StyleInjector};
export * from './types';

/** Результат загрузки: контроллёр и панель, если разметка нашлась. */
export interface BootResult {
    controller: AccessibilityController;
    panel: Panel | null;
}

/**
 * Запустить панель.
 *
 * @param options частичная конфигурация с сервера; недостающее берётся
 *                из DEFAULT_CONFIG
 */
export function boot(options: Partial<A11yConfig> = {}): BootResult {
    const config: A11yConfig = {...DEFAULT_CONFIG, ...options};
    const controller = new AccessibilityController(config);

    // Сразу, синхронно, до отрисовки страницы.
    controller.apply();

    const result: BootResult = {controller, panel: null};

    const mount = (): void => {
        result.panel = Panel.mount(controller);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount, {once: true});
    } else {
        mount();
    }

    return result;
}
