<?php

/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

declare(strict_types=1);

namespace Besnovatyj\Accessibility;

use yii\base\Application;
use yii\base\BootstrapInterface;

/**
 * Bootstrap модуля.
 *
 * Вся работа — в {@see Module::registerTranslations()}: там же её вызывают
 * виджеты, поэтому регистрация алиаса и переводов не зависит от того, дошёл ли
 * до модуля bootstrap приложения.
 */
class Bootstrap implements BootstrapInterface
{
    /**
     * @param Application $app
     */
    public function bootstrap($app): void
    {
        Module::registerTranslations();
    }
}
