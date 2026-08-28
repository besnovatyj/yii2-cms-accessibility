<?php

/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

declare(strict_types=1);

namespace Besnovatyj\Accessibility\widgets;

use Besnovatyj\Accessibility\Module;
use Yii;
use yii\base\Widget;
use yii\helpers\Html;

/**
 * Кнопка вызова панели доступности.
 *
 * Обычная кнопка, которую можно поставить куда угодно: в шапку, в подвал,
 * в пункт меню — и сколько угодно раз. Никакого фиксированного положения
 * виджет не навязывает: где напечатали, там и будет.
 *
 * ```php
 * <?= \Besnovatyj\Accessibility\widgets\AccessibilityButton::widget() ?>
 * ```
 *
 * Своё оформление и подпись:
 *
 * ```php
 * <?= \Besnovatyj\Accessibility\widgets\AccessibilityButton::widget([
 *     'label'   => 'Версия для слабовидящих',
 *     'icon'    => false,
 *     'options' => ['class' => 'btn btn-outline-primary'],
 * ]) ?>
 * ```
 *
 * Только иконка (подпись остаётся для скринридера в aria-label):
 *
 * ```php
 * <?= \Besnovatyj\Accessibility\widgets\AccessibilityButton::widget([
 *     'showLabel' => false,
 * ]) ?>
 * ```
 */
final class AccessibilityButton extends Widget
{
    /** Подпись. null — стандартная. */
    public ?string $label = null;

    /** Показывать ли подпись текстом. При false она остаётся в aria-label. */
    public bool $showLabel = true;

    /** Показывать ли стандартную иконку. */
    public bool $icon = true;

    /** id панели, которой управляет кнопка. */
    public string $panelId = AccessibilityPanel::DEFAULT_ID;

    /** @var array<string, mixed> HTML-атрибуты кнопки. */
    public array $options = [];

    /**
     * Стандартная иконка доступности.
     *
     * Инлайновый SVG, а не иконочный шрифт: пакет не должен требовать от темы
     * ни FontAwesome, ни Bootstrap Icons — их может не оказаться, и на месте
     * кнопки останется пустой квадрат.
     */
    private const string ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" '
        . 'aria-hidden="true" focusable="false">'
        . '<path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm8.5 5.2c-2.6.7-5.5 1-8.5 1s-5.9-.3-8.5-1L3 9.1'
        . 'c1.8.5 3.8.8 5.8 1v3.1L7 21h2.2l1.8-5.4h2L14.8 21H17l-1.8-7.8v-3.1c2-.2 4-.5 5.8-1l-.5-1.9Z"/>'
        . '</svg>';

    /**
     * {@inheritdoc}
     */
    public function run(): string
    {
        // Кнопка, открывающая несуществующую панель, хуже отсутствия кнопки:
        // человек нажимает, и ничего не происходит. Поэтому при выключенном
        // модуле не выводим ничего — панель в этом состоянии тоже пуста.
        if (!Module::isActive()) {
            return '';
        }

        Module::registerTranslations();

        $label = $this->label ?? Yii::t('accessibility', 'Версия для слабовидящих');

        $options = $this->options;
        Html::addCssClass($options, 'bes-a11y-toggle');

        $options['type'] = 'button';
        $options['data-bes-a11y-open'] = '';
        $options['aria-controls'] = $this->panelId;
        $options['aria-expanded'] = 'false';
        $options['aria-label'] ??= $label;

        $content = $this->icon ? self::ICON_SVG : '';
        if ($this->showLabel) {
            $content .= Html::tag('span', Html::encode($label));
        }

        return Html::tag('button', $content, $options);
    }
}
