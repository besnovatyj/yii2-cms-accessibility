/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

import type {AccessibilityController} from '../core/Controller';
import {UI_CLASS} from '../dom/selectors';
import type {A11yState, BooleanStateKey} from '../types';

/**
 * Атрибуты, по которым скрипт находит органы управления в разметке.
 *
 * Разметка панели печатается на сервере (views/panel.php), а не собирается
 * здесь из строк. Так подписи проходят через Yii::t, вёрстка правится темой
 * и видна в исходном коде страницы, а на долю скрипта остаётся поведение.
 */
const ATTR = {
    panel: 'data-bes-a11y-panel',
    open: 'data-bes-a11y-open',
    action: 'data-bes-a11y-action',
    key: 'data-bes-a11y-key',
    value: 'data-bes-a11y-value',
    toggle: 'data-bes-a11y-toggle',
    amount: 'data-bes-a11y-amount',
    announce: 'data-bes-a11y-announce',
} as const;

/** Что можно сфокусировать внутри панели — для ловушки фокуса. */
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Панель настроек.
 *
 * Доступность самой панели — отдельная работа, и она здесь сделана: ловушка
 * фокуса, закрытие по Escape, возврат фокуса на кнопку, которой панель открыли,
 * `inert` в закрытом состоянии, живой `aria-expanded` на кнопках вызова.
 *
 * Это не перестраховка. Панелью пользуются в том числе те, кто не видит экрана
 * и ходит по странице с клавиатуры: инструмент доступности, до которого нельзя
 * добраться с клавиатуры, бесполезен ровно для той аудитории, ради которой он
 * существует. Отсюда же требования к разметке: органы управления — настоящие
 * `<button>`, а не `div` с `role="button"`, за которым пришлось бы вручную
 * повторять обработку Enter и Space.
 */
export class Panel {
    private readonly root: HTMLElement;
    private opener: HTMLElement | null = null;
    /** Узлы, которым inert проставила панель, — чтобы снять только их. */
    private inerted: Element[] = [];

    private readonly onKeydown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
            return;
        }

        if (event.key !== 'Tab') {
            return;
        }

        const items = this.focusable();
        const first = items[0];
        const last = items[items.length - 1];
        if (first === undefined || last === undefined) {
            return;
        }

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    public constructor(
        root: HTMLElement,
        private readonly controller: AccessibilityController,
    ) {
        this.root = root;

        this.bindOpeners();
        this.bindControls();

        this.controller.subscribe((state) => this.render(state));
        this.render(this.controller.current);
        this.setOpen(false);
    }

    /**
     * Найти панель в документе и подключить её.
     *
     * Возвращает null, если разметки нет: страница может не выводить панель
     * (например, служебный layout), и это не повод бросать исключение.
     */
    public static mount(controller: AccessibilityController): Panel | null {
        const root = document.querySelector<HTMLElement>(`[${ATTR.panel}]`);

        return root === null ? null : new Panel(root, controller);
    }

    public open(opener?: HTMLElement): void {
        this.opener = opener ?? null;
        this.setOpen(true);

        document.addEventListener('keydown', this.onKeydown);
        this.focusable()[0]?.focus();
    }

    public close(): void {
        this.setOpen(false);
        document.removeEventListener('keydown', this.onKeydown);

        // Возврат фокуса туда, откуда пришли: без этого фокус улетает в начало
        // документа, и человек на клавиатуре теряет место, где был.
        this.opener?.focus();
        this.opener = null;
    }

    private setOpen(open: boolean): void {
        this.root.classList.toggle('is-open', open);
        this.root.toggleAttribute('inert', !open);
        this.setBackgroundInert(open);

        for (const button of document.querySelectorAll<HTMLElement>(`[${ATTR.open}]`)) {
            button.setAttribute('aria-expanded', String(open));
        }
    }

    /**
     * Вывести остальную страницу из-под фокуса и озвучивания на время,
     * пока панель открыта.
     *
     * Панель объявлена как aria-modal="true", и это обязательство: скринридер
     * не должен читать содержимое под ней. Одной только ловушки фокуса мало —
     * виртуальный курсор скринридера обходит DOM независимо от фокуса.
     * Атрибут inert закрывает и то, и другое.
     *
     * Список изменённых узлов запоминается, чтобы при закрытии не снять inert
     * с того, у кого он стоял изначально (например, со скрытого модального окна
     * темы).
     */
    private setBackgroundInert(open: boolean): void {
        if (!open) {
            for (const element of this.inerted) {
                element.removeAttribute('inert');
            }
            this.inerted = [];

            return;
        }

        this.inerted = Array.from(document.body.children).filter((child) => {
            if (child === this.root || child.contains(this.root)) {
                return false;
            }
            // Собственные наложения пакета (линейка чтения) — не фон.
            if (child.classList.contains(UI_CLASS) || child.hasAttribute('inert')) {
                return false;
            }

            child.setAttribute('inert', '');

            return true;
        });
    }

    private focusable(): HTMLElement[] {
        return Array.from(this.root.querySelectorAll<HTMLElement>(FOCUSABLE))
            .filter((el) => el.offsetParent !== null || el === document.activeElement);
    }

    /** Кнопки открытия живут где угодно в документе, не только внутри панели. */
    private bindOpeners(): void {
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }

            const opener = target.closest<HTMLElement>(`[${ATTR.open}]`);
            if (opener === null) {
                return;
            }

            event.preventDefault();
            this.open(opener);
        });
    }

    /**
     * Один делегированный слушатель на всю панель.
     *
     * Вешать обработчик на каждую кнопку по отдельности незачем: органов
     * управления два десятка, а поведение у них укладывается в три случая —
     * действие, выбор значения из набора, переключатель.
     */
    private bindControls(): void {
        this.root.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }

            const control = target.closest<HTMLElement>(
                `[${ATTR.action}], [${ATTR.key}], [${ATTR.toggle}]`,
            );
            if (control === null) {
                return;
            }

            event.preventDefault();
            const announce = control.getAttribute(ATTR.announce) ?? undefined;

            const action = control.getAttribute(ATTR.action);
            if (action !== null) {
                this.runAction(action, announce);
                return;
            }

            const toggle = control.getAttribute(ATTR.toggle);
            if (toggle !== null) {
                this.controller.toggle(toggle as BooleanStateKey, announce);
                return;
            }

            const key = control.getAttribute(ATTR.key);
            const value = control.getAttribute(ATTR.value);
            if (key !== null && value !== null) {
                this.controller.setFromMarkup(key, value, announce);
            }
        });
    }

    private runAction(action: string, announce?: string): void {
        switch (action) {
            case 'close':
                this.close();
                break;
            case 'disable':
                this.controller.disable();
                this.close();
                break;
            case 'reset':
                this.controller.reset(announce);
                break;
            case 'font-inc':
                this.controller.adjustFontScale(1, announce);
                break;
            case 'font-dec':
                this.controller.adjustFontScale(-1, announce);
                break;
            case 'speak':
                this.controller.speech.speakSelection();
                break;
            case 'speak-pause':
                this.controller.speech.pause();
                break;
            case 'speak-resume':
                this.controller.speech.resume();
                break;
            case 'speak-stop':
                this.controller.speech.stop();
                break;
            default:
                break;
        }
    }

    /** Привести вид панели в соответствие состоянию. */
    private render(state: Readonly<A11yState>): void {
        for (const el of this.root.querySelectorAll<HTMLElement>(`[${ATTR.amount}]`)) {
            el.textContent = `${Math.round(state.fontScale * 100)}%`;
        }

        for (const el of this.root.querySelectorAll<HTMLElement>(`[${ATTR.toggle}]`)) {
            const key = el.getAttribute(ATTR.toggle) as BooleanStateKey | null;
            if (key !== null) {
                setPressed(el, state[key] === true);
            }
        }

        for (const el of this.root.querySelectorAll<HTMLElement>(`[${ATTR.key}][${ATTR.value}]`)) {
            const key = el.getAttribute(ATTR.key) as keyof A11yState | null;
            const value = el.getAttribute(ATTR.value);
            if (key !== null && value !== null) {
                setPressed(el, String(state[key]) === value);
            }
        }

        const {fontScaleMin, fontScaleMax} = this.controller.config;
        this.setDisabled('font-dec', state.fontScale <= fontScaleMin);
        this.setDisabled('font-inc', state.fontScale >= fontScaleMax);
    }

    private setDisabled(action: string, disabled: boolean): void {
        for (const el of this.root.querySelectorAll(`[${ATTR.action}="${action}"]`)) {
            if (el instanceof HTMLButtonElement) {
                el.disabled = disabled;
            }
        }
    }
}

/**
 * Отметить кнопку нажатой.
 *
 * aria-pressed, а не только класс: без него скринридер не сообщит, что
 * настройка включена, и человек не поймёт текущее состояние панели.
 */
function setPressed(element: HTMLElement, pressed: boolean): void {
    element.setAttribute('aria-pressed', String(pressed));
    element.classList.toggle('is-active', pressed);
}
