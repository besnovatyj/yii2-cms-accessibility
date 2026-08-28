/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

/**
 * Единственная точка записи CSS в документ.
 *
 * Ровно один <style> на всю панель, а не по тегу на инструмент. Причины две.
 *
 * Порядок каскада. При россыпи тегов он определяется тем, в каком порядке
 * пользователь щёлкал переключатели: включил «жирный шрифт» после «схемы» —
 * его правило оказалось ниже и выиграло. С одним тегом порядок задаёт список
 * фич в контроллёре, то есть он детерминирован.
 *
 * Стоимость обновления. Пересборка строки и одна запись в textContent дешевле,
 * чем добавление/удаление узлов в <head>: браузер пересчитывает стили один раз.
 */
export class StyleInjector {
    private element: HTMLStyleElement | null = null;
    private lastCss = '';

    public constructor(private readonly id: string) {
    }

    /** Записать CSS. Повторная запись того же содержимого ничего не делает. */
    public write(css: string): void {
        if (css === this.lastCss) {
            return;
        }
        this.lastCss = css;

        if (css === '') {
            this.remove();
            return;
        }

        this.element ??= this.create();
        this.element.textContent = css;
    }

    /** Убрать тег из документа. */
    public remove(): void {
        this.element?.remove();
        this.element = null;
        this.lastCss = '';
    }

    private create(): HTMLStyleElement {
        const existing = document.getElementById(this.id);
        if (existing instanceof HTMLStyleElement) {
            return existing;
        }

        const style = document.createElement('style');
        style.id = this.id;
        // Именно в конец <head>: правила панели должны перебивать стили темы,
        // но оставаться под пользовательскими user-стилями браузера.
        document.head.appendChild(style);

        return style;
    }
}
