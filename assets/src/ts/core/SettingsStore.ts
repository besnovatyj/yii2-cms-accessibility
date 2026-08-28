/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

import {
    DEFAULT_STATE,
    FONT_FAMILIES,
    IMAGE_MODES,
    SCHEME_IDS,
    SPACING_STEPS,
    type A11yState,
} from '../types';

/**
 * Хранилище настроек в cookie.
 *
 * Почему cookie, а не localStorage. Настройки нужны СЕРВЕРУ: PHP печатает
 * панель уже в выбранном состоянии (нажатые кнопки, текущий процент) и отдаёт
 * начальное состояние в бандл. С localStorage сервер о выборе не знает, и на
 * каждой загрузке страницы обычная версия успевает мигнуть перед тем, как
 * скрипт её перекрасит.
 *
 * Значение — JSON, пропущенный через encodeURIComponent: в JSON есть запятые
 * и точки с запятой, а они разделители в заголовке Cookie.
 */
export class SettingsStore {
    public constructor(
        private readonly cookieName: string,
        private readonly maxAgeDays: number,
    ) {
    }

    /**
     * Прочитать состояние. Любое повреждение или подмена значения даёт дефолт:
     * cookie редактируется пользователем, доверять ей нельзя.
     */
    public load(): A11yState {
        const raw = this.readCookie();
        if (raw === null) {
            return {...DEFAULT_STATE};
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch {
            return {...DEFAULT_STATE};
        }

        return SettingsStore.normalize(parsed);
    }

    /** Сохранить состояние. */
    public save(state: Readonly<A11yState>): void {
        const value = encodeURIComponent(JSON.stringify(state));
        const maxAge = Math.round(this.maxAgeDays * 24 * 60 * 60);
        const secure = location.protocol === 'https:' ? '; Secure' : '';

        document.cookie =
            `${this.cookieName}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
    }

    /** Удалить cookie (сброс к «обычной версии»). */
    public clear(): void {
        document.cookie = `${this.cookieName}=; Max-Age=0; Path=/; SameSite=Lax`;
    }

    private readCookie(): string | null {
        const prefix = `${this.cookieName}=`;

        for (const part of document.cookie.split(';')) {
            const item = part.trim();
            if (item.startsWith(prefix)) {
                try {
                    return decodeURIComponent(item.slice(prefix.length));
                } catch {
                    return null;
                }
            }
        }

        return null;
    }

    /**
     * Привести произвольное значение к валидному состоянию.
     *
     * Публичный статический метод, потому что тем же путём проходит состояние,
     * пришедшее с сервера: источник разный, требования к данным одинаковые.
     */
    public static normalize(input: unknown): A11yState {
        const source = (typeof input === 'object' && input !== null)
            ? (input as Record<string, unknown>)
            : {};

        return {
            enabled: bool(source['enabled'], DEFAULT_STATE.enabled),
            fontScale: scale(source['fontScale']),
            scheme: oneOf(source['scheme'], SCHEME_IDS, DEFAULT_STATE.scheme),
            images: oneOf(source['images'], IMAGE_MODES, DEFAULT_STATE.images),
            fontFamily: oneOf(source['fontFamily'], FONT_FAMILIES, DEFAULT_STATE.fontFamily),
            letterSpacing: oneOf(source['letterSpacing'], SPACING_STEPS, DEFAULT_STATE.letterSpacing),
            lineHeight: oneOf(source['lineHeight'], SPACING_STEPS, DEFAULT_STATE.lineHeight),
            highContrast: bool(source['highContrast'], DEFAULT_STATE.highContrast),
            highlightLinks: bool(source['highlightLinks'], DEFAULT_STATE.highlightLinks),
            highlightTitles: bool(source['highlightTitles'], DEFAULT_STATE.highlightTitles),
            bigCursor: bool(source['bigCursor'], DEFAULT_STATE.bigCursor),
            stopAnimations: bool(source['stopAnimations'], DEFAULT_STATE.stopAnimations),
            readingGuide: bool(source['readingGuide'], DEFAULT_STATE.readingGuide),
            blockEmbeds: bool(source['blockEmbeds'], DEFAULT_STATE.blockEmbeds),
            speech: bool(source['speech'], DEFAULT_STATE.speech),
        };
    }
}

function bool(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
}

/**
 * Множитель шрифта. Границы здесь ЖЁСТКИЕ и не зависят от конфигурации:
 * это защита от подменённой cookie, а не пользовательская настройка.
 * Конфигурируемые min/max применяются выше, в контроллёре.
 */
function scale(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return DEFAULT_STATE.fontScale;
    }

    return Math.min(Math.max(value, 0.5), 3);
}

function oneOf<T extends string>(
    value: unknown,
    allowed: readonly T[],
    fallback: T,
): T {
    return (typeof value === 'string' && (allowed as readonly string[]).includes(value))
        ? (value as T)
        : fallback;
}
