<?php

/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

declare(strict_types=1);

/**
 * Базовая конфигурация модуля.
 *
 * Значения params — дефолты. Перекрываются через модуль Config, список
 * редактируемых ключей описан в config/options.php.
 */
return [
    'id' => 'Accessibility',
    'params' => [
        'iconClass' => 'bi bi-universal-access',

        // Директории для статики модулю не нужны.
        'directories' => false,

        // Как масштабировать шрифт: 'zoom' (масштаб всей страницы) или
        // 'root' (корневой font-size). По умолчанию zoom: он честно доводит
        // текст до заявленных процентов на любой вёрстке, включая «плавные»
        // шкалы на clamp(rem, vw, rem), где корневой font-size тянет лишь
        // часть величины. Разбор — в assets/src/ts/types.ts, тип FontScaleMode.
        'fontScaleMode' => 'zoom',
        'fontScaleMin' => 1.0,
        'fontScaleMax' => 2.0,
        'fontScaleStep' => 0.125,

        // Пустая строка — взять язык приложения (Yii::$app->language).
        'speechLang' => '',
        'speechRate' => 1.0,
        'speechAnnounce' => true,

        // Список доступных настроек через запятую. Пустая строка — все.
        // Допустимые ключи перечислены в AccessibilityState::CONTROLS.
        'controls' => '',
    ],
];
