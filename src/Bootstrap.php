<?php

/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

declare(strict_types=1);

namespace Besnovatyj\Accessibility;

use Yii;
use yii\base\Application;
use yii\base\BootstrapInterface;
use yii\i18n\PhpMessageSource;

/**
 * Bootstrap модуля.
 *
 * Регистрирует алиас пакета и источник переводов. Алиас задаётся явно от
 * __DIR__, а не берётся из composer-плагина: так пакет одинаково работает
 * и установленным через composer, и подключённым напрямую.
 */
class Bootstrap implements BootstrapInterface
{
    /**
     * @param Application $app
     */
    public function bootstrap($app): void
    {
        Yii::setAlias('@bes-accessibility', dirname(__DIR__));

        // Исходный язык строк пакета — русский: они так и написаны в коде.
        // Английский подтягивается из messages/en, если приложение переключат.
        $app->getI18n()->translations['accessibility'] ??= [
            'class' => PhpMessageSource::class,
            'sourceLanguage' => 'ru-RU',
            'basePath' => '@bes-accessibility/src/messages',
        ];
    }
}
