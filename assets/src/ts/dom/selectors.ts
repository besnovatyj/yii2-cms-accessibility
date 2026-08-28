/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

/**
 * Селекторы и константы, общие для всех фич.
 *
 * Единственное место, где живут магические строки классов. Если завтра префикс
 * сменится, правится здесь, а не в пятнадцати файлах.
 */

/** Класс на <html>, когда версия для слабовидящих включена. Публичный хук для тем. */
export const ROOT_CLASS = 'bes-a11y';

/** Атрибут на <html> с идентификатором цветовой схемы. Тоже хук для тем. */
export const SCHEME_ATTR = 'data-bes-a11y-scheme';

/** Класс контейнера самой панели. */
export const UI_CLASS = 'bes-a11y-ui';

/** id единственного <style>, которым управляет StyleInjector. */
export const STYLE_ID = 'bes-a11y-style';

/**
 * Исключение поддерева панели.
 *
 * Без него панель красится и раздувается вместе со страницей: включаешь
 * «жирный шрифт» — жирнеет и меню настроек. Приписывается к КАЖДОМУ силовому
 * правилу, потому что панель физически живёт внутри <body>.
 */
export const NOT_UI = `:not(.${UI_CLASS}, .${UI_CLASS} *)`;

/**
 * Классы иконочных шрифтов.
 *
 * Иконка в таких наборах — это глиф в подменённом font-family. Стоит применить
 * к элементу свой шрифт (или межбуквенный интервал), и вместо иконки появится
 * квадратик или случайная буква. Поэтому все правила, трогающие текст,
 * обходят эти классы стороной.
 */
export const ICON_CLASSES: readonly string[] = [
    'fa', 'fas', 'far', 'fab', 'fal', 'fad', 'fa-solid', 'fa-regular', 'fa-brands',
    'bi', 'material-icons', 'material-symbols-outlined', 'mdi', 'glyphicon',
    'icon', 'iconfont', 'ion', 'ionicons', 'octicon', 'feather', 'bx', 'ri',
];

/** `:not(.fa, .bi, …)` — исключение иконочных шрифтов. */
export const NOT_ICON = `:not(${ICON_CLASSES.map((c) => `.${c}`).join(',')})`;

/**
 * Элементы, несущие текст.
 *
 * Правила межбуквенного/межстрочного интервала и подмены шрифта применяются
 * ТОЛЬКО к ним, а не к `html *`. Под звёздочку попадают контейнеры сетки,
 * и заданный им межстрочный интервал растаскивает раскладку по вертикали —
 * колонки разъезжаются раньше, чем увеличенный интервал успевает помочь читать.
 */
export const TEXT_SELECTORS: readonly string[] = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'a', 'span', 'li', 'dd', 'dt', 'td', 'th', 'caption',
    'blockquote', 'figcaption', 'label', 'legend', 'summary',
    'button', 'input', 'textarea', 'select', 'option',
];

/**
 * Собрать селектор из списка элементов с общими хвостами.
 *
 * @param elements список элементов (`p`, `a`, …)
 * @param prefix   префикс области действия, например `html.bes-a11y`
 * @param suffixes псевдоклассы-исключения, приписываемые к каждому элементу
 */
export function selectorList(
    elements: readonly string[],
    prefix: string,
    ...suffixes: string[]
): string {
    const tail = suffixes.join('');

    return elements.map((el) => `${prefix} ${el}${tail}`).join(',');
}

/** Корневая область действия: `html.bes-a11y`. */
export const SCOPE = `html.${ROOT_CLASS}`;
