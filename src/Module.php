<?php

/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

declare(strict_types=1);

namespace Besnovatyj\Accessibility;

use Besnovatyj\Contracts\module\DeclaresModule;
use Besnovatyj\Contracts\module\ProvidesBootstrap;
use Besnovatyj\Contracts\module\ProvidesOptions;
use Besnovatyj\Kernel\module\CmsModule;
use Yii;
use yii\i18n\PhpMessageSource;

/**
 * Модуль «Доступность»: панель настроек отображения для слабовидящих.
 *
 * Собственных контроллёров и маршрутов у модуля нет — он существует ради двух
 * виджетов ({@see widgets\AccessibilityButton}, {@see widgets\AccessibilityPanel})
 * и набора настроек, которые редактируются через модуль Config.
 */
class Module extends CmsModule implements
    DeclaresModule,
    ProvidesBootstrap,
    ProvidesOptions
{
    public const bool EDITABLE = true;
    public const string VERSION = '1.0.0';
    public const string MODULE_ID = 'Accessibility';

    /** Чтобы не писать в лог одно и то же на каждый виджет страницы. */
    private static bool $inactiveWarningLogged = false;

    /**
     * Подключён ли модуль к приложению.
     *
     * Пакет ставится через composer, а модуль включается отдельно, менеджером
     * модулей. Между этими двумя событиями виджеты уже доступны по имени класса
     * и вполне могут оказаться в макете темы — тогда ни конфигурации, ни
     * bootstrap-класса ещё нет. Виджеты в таком состоянии не должны валить
     * страницу: они молча ничего не выводят, а причина уходит в лог.
     */
    public static function isActive(): bool
    {
        if (Yii::$app?->hasModule(self::MODULE_ID) === true) {
            return true;
        }

        if (!self::$inactiveWarningLogged) {
            self::$inactiveWarningLogged = true;
            Yii::warning(
                'Виджеты доступности вызваны, но модуль "' . self::MODULE_ID
                . '" не подключён к приложению. Панель не выведена. '
                . 'Включите модуль в менеджере модулей.',
                __METHOD__,
            );
        }

        return false;
    }

    /**
     * Зарегистрировать алиас пакета и источник переводов.
     *
     * Вызывается из {@see Bootstrap} и, для надёжности, из виджетов. Повторный
     * вызов ничего не делает.
     *
     * Дублирование не избыточно: без зарегистрированной категории Yii::t()
     * бросает InvalidConfigException «Unable to locate message source», а не
     * возвращает исходную строку. Виджет, который сам себе это гарантирует,
     * переживает конфигурацию, где модуль прописан руками, без bootstrap-класса.
     */
    public static function registerTranslations(): void
    {
        Yii::setAlias('@bes-accessibility', dirname(__DIR__));

        // Исходный язык строк пакета — русский: они так и написаны в коде.
        // Английский подтягивается из messages/en, если приложение переключат.
        Yii::$app->getI18n()->translations['accessibility'] ??= [
            'class' => PhpMessageSource::class,
            'sourceLanguage' => 'ru-RU',
            'basePath' => '@bes-accessibility/src/messages',
        ];
    }

    public static function moduleId(): string
    {
        return self::MODULE_ID;
    }

    public static function moduleVersion(): string
    {
        return self::VERSION;
    }

    public static function isEditable(): bool
    {
        return self::EDITABLE;
    }

    public static function moduleConfig(): array
    {
        return require __DIR__ . '/config/config.php';
    }

    public static function bootstrapClasses(): array
    {
        return [Bootstrap::class];
    }

    public static function options(): array
    {
        return require __DIR__ . '/config/options.php';
    }
}
