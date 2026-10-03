<?php

/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

declare(strict_types=1);

use Besnovatyj\Accessibility\Module;

/**
 * Yii2-конфиг модуля для движка yiisoft/config (группа `common`).
 *
 * Регистрация модуля и его bootstrap-класса. Пер-аппликационного вклада у
 * модуля нет: панель выводится виджетом из шаблона темы, маршрутов он не
 * добавляет.
 */
return [
    'modules' => [
        Module::moduleId() => array_merge(
            ['class' => Module::class],
            Module::moduleConfig(),
        ),
    ],
    'bootstrap' => array_values(Module::bootstrapClasses()),
];
