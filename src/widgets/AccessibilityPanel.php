<?php

/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

declare(strict_types=1);

namespace Besnovatyj\Accessibility\widgets;

use Besnovatyj\Accessibility\assets\AccessibilityAsset;
use Besnovatyj\Accessibility\Module;
use Besnovatyj\Accessibility\services\AccessibilityState;
use Besnovatyj\Accessibility\support\Schemes;
use Yii;
use yii\base\Widget;
use yii\helpers\Json;
use yii\web\View;

/**
 * Панель настроек отображения.
 *
 * Ставится ОДИН раз в макет темы, обычно перед закрывающим </body>.
 * Кнопки вызова печатаются отдельным виджетом {@see AccessibilityButton}
 * и могут стоять где угодно и в любом количестве.
 *
 * ```php
 * <?= \Besnovatyj\Accessibility\widgets\AccessibilityPanel::widget() ?>
 * ```
 *
 * Ограничить набор инструментов можно и точечно, не трогая настройки модуля:
 *
 * ```php
 * <?= \Besnovatyj\Accessibility\widgets\AccessibilityPanel::widget([
 *     'controls' => ['fontScale', 'scheme', 'images', 'speech'],
 * ]) ?>
 * ```
 */
final class AccessibilityPanel extends Widget
{
    /** id корневого элемента панели. На него ссылается aria-controls у кнопок. */
    public const string DEFAULT_ID = 'bes-a11y-panel';

    public string $panelId = self::DEFAULT_ID;

    /**
     * Какие инструменты показывать. null — взять из настроек модуля.
     *
     * @var list<string>|null
     */
    public ?array $controls = null;

    /** @var array<string, mixed> HTML-атрибуты корневого элемента. */
    public array $options = [];

    /** @var array<string, mixed> */
    private array $params = [];

    /**
     * {@inheritdoc}
     */
    public function init(): void
    {
        parent::init();

        $this->params = $this->moduleParams();

        if ($this->controls === null) {
            $this->controls = $this->parseControls($this->params['controls'] ?? '');
        }

        $this->registerAssets();
    }

    /**
     * {@inheritdoc}
     */
    public function run(): string
    {
        return $this->render('panel', [
            'panelId' => $this->panelId,
            'options' => $this->options,
            'state' => AccessibilityState::fromCookie(),
            'controls' => array_flip($this->controls ?? []),
        ]);
    }

    /**
     * Подключить бандл и запустить панель.
     *
     * Оба вызова уходят в POS_HEAD, чтобы настройки применились до первой
     * отрисовки. Порядок внутри <head> Yii2 обеспечивает сам: файлы бандлов
     * печатаются раньше инлайнового JS той же позиции, поэтому глобаль
     * BesA11y к моменту вызова boot() уже объявлена.
     */
    private function registerAssets(): void
    {
        AccessibilityAsset::register($this->view);

        $config = Json::encode($this->bootConfig());
        $this->view->registerJs("window.BesA11y.boot($config);", View::POS_HEAD);
    }

    /**
     * Конфигурация, уезжающая в бандл.
     *
     * @return array<string, mixed>
     */
    private function bootConfig(): array
    {
        $language = (string)($this->params['speechLang'] ?? '');

        return [
            'cookieName' => AccessibilityState::COOKIE_NAME,
            'cookieMaxAgeDays' => 365,
            'fontScaleMode' => (string)($this->params['fontScaleMode'] ?? 'zoom'),
            'fontScaleMin' => (float)($this->params['fontScaleMin'] ?? 1.0),
            'fontScaleMax' => (float)($this->params['fontScaleMax'] ?? 2.0),
            'fontScaleStep' => (float)($this->params['fontScaleStep'] ?? 0.125),
            'speechLang' => $language !== '' ? $language : Yii::$app->language,
            'speechRate' => (float)($this->params['speechRate'] ?? 1.0),
            'speechAnnounce' => (bool)($this->params['speechAnnounce'] ?? true),
            'enabledControls' => $this->controls ?? [],
            // Цвета приезжают с сервера, чтобы образцы в панели и правила CSS
            // брались из одного места — см. комментарий в support/Schemes.php.
            'schemes' => Schemes::all(),
            'labels' => [
                'embedBlocked' => Yii::t('accessibility', 'Встроенный элемент отключён'),
            ],
        ];
    }

    /**
     * Разобрать список инструментов из настройки модуля.
     *
     * Пустое значение означает «все», поэтому возвращается полный список:
     * контроллёр в браузере трактует пустой массив так же, но явный список
     * избавляет от необходимости помнить об этом соглашении в двух местах.
     *
     * @return list<string>
     */
    private function parseControls(mixed $raw): array
    {
        if (!is_string($raw) || trim($raw) === '') {
            return AccessibilityState::CONTROLS;
        }

        $requested = array_map(trim(...), explode(',', $raw));
        $known = array_values(array_intersect(AccessibilityState::CONTROLS, $requested));

        return $known === [] ? AccessibilityState::CONTROLS : $known;
    }

    /**
     * Параметры модуля. Если модуль не подключён, виджет работает на дефолтах —
     * это допустимо: панель может понадобиться теме раньше, чем администратор
     * дойдёт до настроек.
     *
     * @return array<string, mixed>
     */
    private function moduleParams(): array
    {
        return Yii::$app->getModule(Module::MODULE_ID)?->params ?? [];
    }
}
