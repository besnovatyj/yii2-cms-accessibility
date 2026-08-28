<?php

/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

declare(strict_types=1);

namespace Besnovatyj\Accessibility\support;

use Yii;

/**
 * Цветовые схемы панели.
 *
 * ЕДИНСТВЕННЫЙ источник значений цвета. Схемы уезжают в бандл через конфиг
 * boot(), поэтому одни и те же краски используются и для генерации CSS,
 * и для образцов в панели — разъехаться им негде. Карта в
 * assets/src/ts/schemes.ts существует только как запасной вариант на случай,
 * если скрипт запустят без серверной конфигурации.
 *
 * Контраст каждой пары проверен по WCAG 2.1: все дают 7 : 1 и выше, то есть
 * проходят не только уровень AA (4.5 : 1 по критерию 1.4.3), но и AAA.
 */
final class Schemes
{
    /** Идентификатор «обычной» схемы: цвета не подменяются. */
    public const string DEFAULT = 'default';

    /**
     * @return array<string, array{fg: string, bg: string, accent: string}>
     */
    public static function all(): array
    {
        return [
            'black-on-white' => ['fg' => '#000000', 'bg' => '#ffffff', 'accent' => '#0000cc'],
            'white-on-black' => ['fg' => '#ffffff', 'bg' => '#000000', 'accent' => '#ffff00'],
            'blue-on-cyan' => ['fg' => '#063462', 'bg' => '#9dd1ff', 'accent' => '#063462'],
            'brown-on-beige' => ['fg' => '#4d4b43', 'bg' => '#f7f3d6', 'accent' => '#4d4b43'],
            'green-on-dark' => ['fg' => '#a9e44d', 'bg' => '#3b2716', 'accent' => '#a9e44d'],
        ];
    }

    /**
     * Подписи схем для панели.
     *
     * @return array<string, string>
     */
    public static function labels(): array
    {
        return [
            self::DEFAULT => Yii::t('accessibility', 'Обычная'),
            'black-on-white' => Yii::t('accessibility', 'Чёрным по белому'),
            'white-on-black' => Yii::t('accessibility', 'Белым по чёрному'),
            'blue-on-cyan' => Yii::t('accessibility', 'Тёмно-синим по голубому'),
            'brown-on-beige' => Yii::t('accessibility', 'Коричневым по бежевому'),
            'green-on-dark' => Yii::t('accessibility', 'Зелёным по тёмно-коричневому'),
        ];
    }

    /** Допустимые идентификаторы, включая «обычную». */
    public static function ids(): array
    {
        return array_merge([self::DEFAULT], array_keys(self::all()));
    }
}
