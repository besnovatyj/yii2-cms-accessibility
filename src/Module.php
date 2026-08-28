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
