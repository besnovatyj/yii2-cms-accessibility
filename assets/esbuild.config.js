/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

/**
 * Сборка ресурсов пакета besnovatyj/yii2-cms-accessibility.
 *
 * JS:  src/ts/index.ts   → dist/js/accessibility.js  (iife, глобаль `BesA11y`)
 * CSS: src/css/panel.css → dist/css/panel.css
 *
 * Формат iife выбран осознанно: бандл подключается в <head> обычным <script>
 * и обязан отработать ДО первой отрисовки, иначе на каждой загрузке страницы
 * мигает обычная версия сайта. <script type="module"> так не умеет — он всегда
 * defer, то есть заведомо после разбора документа.
 *
 * Точка входа НЕ имеет побочных эффектов: она лишь публикует BesA11y.boot(),
 * а вызывает его инлайновый скрипт, который печатает AccessibilityPanel.
 * Поэтому вся конфигурация (подписи через Yii::t, настройки модуля) приходит
 * с сервера, а не выковыривается из data-атрибутов.
 */

import * as esbuild from 'esbuild';
import * as fs from 'node:fs';

const isWatch = process.argv.includes('--watch');

/**
 * Положить текст лицензии рядом с опубликованными файлами шрифта.
 *
 * OpenDyslexic распространяется под SIL OFL 1.1, а она требует передавать
 * лицензию вместе с файлами шрифта. Ассеты Yii2 публикует в веб-корень
 * отдельно от исходников пакета, поэтому OFL.txt едет в сборку — иначе
 * в публичном доступе окажутся файлы шрифта без лицензии.
 */
const copyFontLicense = () => {
    fs.mkdirSync('./dist/fonts', {recursive: true});
    fs.copyFileSync('./src/fonts/OFL.txt', './dist/fonts/OFL.txt');
};

/** @type {import('esbuild').BuildOptions} */
const jsConfig = {
    entryPoints: ['./src/ts/index.ts'],
    outfile: './dist/js/accessibility.js',
    bundle: true,
    format: 'iife',
    globalName: 'BesA11y',
    target: ['es2020'],
    platform: 'browser',
    minify: true,
    sourcemap: true,
    legalComments: 'none',
    banner: {
        js: '/*! yii2-cms-accessibility | (c) Besnovatyj | MIT */',
    },
};

/**
 * CSS собирается в outdir, а не в outfile, из-за шрифта OpenDyslexic.
 *
 * Загрузчик `file` заставляет esbuild скопировать .otf в сборку и САМ переписать
 * url() в @font-face на итоговый путь. Так ссылка не может разъехаться с местом,
 * куда лёг файл. С outfile каталог сборки — это dist/css, и запись шрифтов
 * в соседний dist/fonts оказалась бы «наружу» от него; с outdir оба пути
 * задаются шаблонами entryNames/assetNames и остаются внутри.
 *
 * В шаблонах намеренно нет [hash]: имена файлов должны быть стабильными,
 * версионированием занимается публикация ассетов Yii2.
 *
 * @type {import('esbuild').BuildOptions}
 */
const cssConfig = {
    entryPoints: ['./src/css/panel.css'],
    outdir: './dist',
    entryNames: 'css/[name]',
    assetNames: 'fonts/[name]',
    bundle: true,
    minify: true,
    sourcemap: true,
    loader: {'.otf': 'file'},
};

if (isWatch) {
    const contexts = await Promise.all([
        esbuild.context(jsConfig),
        esbuild.context(cssConfig),
    ]);
    await Promise.all(contexts.map((ctx) => ctx.watch()));
    copyFontLicense();
    console.log('⚡ watching assets…');
} else {
    await Promise.all([esbuild.build(jsConfig), esbuild.build(cssConfig)]);
    copyFontLicense();
    console.log('✅ dist/js/accessibility.js + dist/css/panel.css + dist/fonts/');
}
