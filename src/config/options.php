<?php

/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

declare(strict_types=1);

/**
 * Опции модуля для yii2-cms-config.
 *
 * Значения приезжают в Yii::$app->getModule('Accessibility')->params,
 * откуда их читает AccessibilityPanel и передаёт в бандл.
 */
return [
    'accessibility_font_scale_mode' => [
        'path' => 'modules.Accessibility.params.fontScaleMode',
        'label' => '[Доступность] Способ масштабирования шрифта',
        'description' => 'root — корневой font-size (не тянет vw-часть clamp у плавных шкал); '
            . 'zoom — CSS zoom, масштабирует всё, включая плавную типографику темы',
        'category' => 'Accessibility',
        'rules' => [
            ['required'],
            ['in', 'range' => ['root', 'zoom']],
        ],
        'inputOptions' => [
            'type' => 'dropdown',
            'items' => [
                'zoom' => 'zoom — масштаб всей страницы (по умолчанию)',
                'root' => 'root — корневой font-size',
            ],
        ],
    ],

    'accessibility_font_scale_max' => [
        'path' => 'modules.Accessibility.params.fontScaleMax',
        'label' => '[Доступность] Максимальный масштаб шрифта',
        'description' => 'Множитель. 2 — это 200 %, привычный потолок ГОСТ-панелей',
        'category' => 'Accessibility',
        'rules' => [
            ['required'],
            ['number', 'min' => 1, 'max' => 3],
        ],
        'inputOptions' => [
            'type' => 'input',
        ],
    ],

    'accessibility_speech_lang' => [
        'path' => 'modules.Accessibility.params.speechLang',
        'label' => '[Доступность] Язык синтезатора речи',
        'description' => 'BCP-47, например ru-RU. Пустое значение — язык приложения',
        'category' => 'Accessibility',
        'rules' => [
            ['string', 'max' => 16],
        ],
        'inputOptions' => [
            'type' => 'input',
        ],
    ],

    'accessibility_speech_rate' => [
        'path' => 'modules.Accessibility.params.speechRate',
        'label' => '[Доступность] Скорость речи',
        'description' => 'От 0.5 до 2. Значение 1 — обычный темп',
        'category' => 'Accessibility',
        'rules' => [
            ['required'],
            ['number', 'min' => 0.5, 'max' => 2],
        ],
        'inputOptions' => [
            'type' => 'input',
        ],
    ],

    'accessibility_speech_announce' => [
        'path' => 'modules.Accessibility.params.speechAnnounce',
        'label' => '[Доступность] Озвучивать изменения настроек',
        'description' => 'При переключении инструмента панель произносит его название',
        'category' => 'Accessibility',
        'rules' => [
            ['boolean'],
        ],
        'inputOptions' => [
            'type' => 'checkbox',
        ],
    ],

    'accessibility_controls' => [
        'path' => 'modules.Accessibility.params.controls',
        'label' => '[Доступность] Доступные настройки',
        'description' => 'Ключи через запятую; пустое значение — показывать все. '
            . 'Допустимо: fontScale, scheme, images, fontFamily, letterSpacing, lineHeight, '
            . 'highContrast, highlightLinks, highlightTitles, bigCursor, stopAnimations, '
            . 'readingGuide, blockEmbeds, speech',
        'category' => 'Accessibility',
        'rules' => [
            ['string'],
        ],
        'inputOptions' => [
            'type' => 'textarea',
        ],
    ],
];
