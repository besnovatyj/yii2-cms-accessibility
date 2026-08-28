<?php

/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

declare(strict_types=1);

namespace Besnovatyj\Accessibility\assets;

use yii\web\AssetBundle;
use yii\web\View;

/**
 * Бандл панели доступности.
 *
 * Собирается командой:
 *   cd assets && npm install && npm run build
 *
 * ⚠ Скрипт подключается в <head>, а не перед </body>, и это принципиально.
 * Настройки посетителя должны примениться ДО первой отрисовки, иначе на каждой
 * загрузке страницы обычная версия сайта успевает мигнуть перед тем, как её
 * перекрасят. Плата — примерно 8 КБ блокирующего скрипта; для функции, которой
 * пользуются люди с нарушением зрения, это правильный размен.
 *
 * Порядок в <head> Yii2 гарантирует сам: сначала файлы бандлов, потом
 * инлайновый JS позиции POS_HEAD. То есть глобаль BesA11y успевает
 * объявиться до вызова BesA11y.boot() из AccessibilityPanel.
 */
final class AccessibilityAsset extends AssetBundle
{
    public $sourcePath = __DIR__ . '/../../assets/dist';

    /** @var string[] */
    public $css = ['css/panel.css'];

    /** @var string[] */
    public $js = ['js/accessibility.js'];

    /** @var array<string, mixed> */
    public $jsOptions = ['position' => View::POS_HEAD];
}
