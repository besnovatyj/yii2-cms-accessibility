<?php

/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

declare(strict_types=1);

use Besnovatyj\Accessibility\services\AccessibilityState;
use Besnovatyj\Accessibility\support\Schemes;
use yii\helpers\Html;

/**
 * Разметка панели доступности.
 *
 * Печатается на сервере целиком, уже в текущем состоянии: нажатые кнопки,
 * актуальный процент масштаба. Скрипту остаётся поведение, а не сборка DOM
 * из строк — поэтому вёрстку видно в исходном коде страницы, подписи проходят
 * через Yii::t, а тема при необходимости переопределяет представление.
 *
 * @var yii\web\View $this
 * @var string $panelId
 * @var array<string, mixed> $options
 * @var AccessibilityState $state
 * @var array<string, int> $controls карта включённых инструментов (ключ => позиция)
 */

$rootOptions = $options;
Html::addCssClass($rootOptions, ['bes-a11y-ui', 'bes-a11y-panel']);
$rootOptions['id'] = $panelId;
$rootOptions['data-bes-a11y-panel'] = '';
$rootOptions['role'] = 'dialog';
$rootOptions['aria-modal'] = 'true';
$rootOptions['aria-label'] = Yii::t('accessibility', 'Настройки отображения');

/**
 * Кнопка выбора значения из набора.
 *
 * data-bes-a11y-announce — текст, который панель произнесёт при выборе,
 * если включена озвучка.
 */
$choice = static function (
    string $key,
    string $value,
    string $label,
    string $current,
    array $extraOptions = [],
): string {
    $options = $extraOptions;
    Html::addCssClass($options, 'bes-a11y-btn');
    $active = $current === $value;
    if ($active) {
        Html::addCssClass($options, 'is-active');
    }

    $options['type'] = 'button';
    $options['data-bes-a11y-key'] = $key;
    $options['data-bes-a11y-value'] = $value;
    $options['data-bes-a11y-announce'] = $label;
    $options['aria-pressed'] = $active ? 'true' : 'false';

    return Html::tag('button', Html::encode($label), $options);
};

/** Переключатель булевой настройки. */
$toggle = static function (string $key, string $label, bool $active): string {
    $options = ['class' => 'bes-a11y-btn bes-a11y-btn--grow'];
    if ($active) {
        Html::addCssClass($options, 'is-active');
    }

    $options['type'] = 'button';
    $options['data-bes-a11y-toggle'] = $key;
    $options['data-bes-a11y-announce'] = $label;
    $options['aria-pressed'] = $active ? 'true' : 'false';

    return Html::tag('button', Html::encode($label), $options);
};

/** Секция панели. Не печатается, если внутри не осталось ни одного элемента. */
$group = static function (string $title, array $items): string {
    $items = array_filter($items, static fn(string $item): bool => $item !== '');
    if ($items === []) {
        return '';
    }

    return Html::tag(
        'fieldset',
        Html::tag('legend', Html::encode($title), ['class' => 'bes-a11y-group__title'])
        . Html::tag('div', implode('', $items), ['class' => 'bes-a11y-row']),
        ['class' => 'bes-a11y-group'],
    );
};

$has = static fn(string $key): bool => isset($controls[$key]);

// ── Размер шрифта ───────────────────────────────────────────────────────────
$fontScaleBlock = '';
if ($has('fontScale')) {
    $fontScaleBlock = Html::tag(
        'fieldset',
        Html::tag(
            'legend',
            Html::encode(Yii::t('accessibility', 'Размер шрифта')),
            ['class' => 'bes-a11y-group__title'],
        )
        . Html::tag(
            'div',
            Html::tag('button', '&minus;', [
                'class' => 'bes-a11y-btn bes-a11y-btn--icon',
                'type' => 'button',
                'data-bes-a11y-action' => 'font-dec',
                'data-bes-a11y-announce' => Yii::t('accessibility', 'Шрифт меньше'),
                'aria-label' => Yii::t('accessibility', 'Уменьшить размер шрифта'),
            ])
            . Html::tag('span', $state->fontScalePercent() . '%', [
                'class' => 'bes-a11y-scale__amount',
                'data-bes-a11y-amount' => '',
                'aria-live' => 'polite',
            ])
            . Html::tag('button', '+', [
                'class' => 'bes-a11y-btn bes-a11y-btn--icon',
                'type' => 'button',
                'data-bes-a11y-action' => 'font-inc',
                'data-bes-a11y-announce' => Yii::t('accessibility', 'Шрифт больше'),
                'aria-label' => Yii::t('accessibility', 'Увеличить размер шрифта'),
            ]),
            ['class' => 'bes-a11y-scale'],
        ),
        ['class' => 'bes-a11y-group'],
    );
}

// ── Цветовая схема ──────────────────────────────────────────────────────────
$schemeBlock = '';
if ($has('scheme')) {
    $labels = Schemes::labels();
    $swatches = [$choice(
        'scheme',
        Schemes::DEFAULT,
        $labels[Schemes::DEFAULT],
        $state->scheme,
        ['class' => 'bes-a11y-swatch'],
    )];

    foreach (Schemes::all() as $id => $colors) {
        $swatches[] = $choice(
            'scheme',
            $id,
            $labels[$id] ?? $id,
            $state->scheme,
            [
                'class' => 'bes-a11y-swatch',
                // Цвета — данные схемы, а не оформление, поэтому инлайном
                // и из одного источника (support/Schemes.php).
                'style' => "--swatch-fg:{$colors['fg']};--swatch-bg:{$colors['bg']}",
            ],
        );
    }

    $schemeBlock = $group(Yii::t('accessibility', 'Цветовая схема'), $swatches);
}

// ── Изображения ─────────────────────────────────────────────────────────────
$imagesBlock = '';
if ($has('images')) {
    $imagesBlock = $group(Yii::t('accessibility', 'Изображения'), [
        $choice('images', 'normal', Yii::t('accessibility', 'Обычные'), $state->images),
        $choice('images', 'grayscale', Yii::t('accessibility', 'Чёрно-белые'), $state->images),
        $choice('images', 'hidden', Yii::t('accessibility', 'Скрыть'), $state->images),
    ]);
}

// ── Шрифт и интервалы ───────────────────────────────────────────────────────
$fontFamilyBlock = $has('fontFamily')
    ? $group(Yii::t('accessibility', 'Начертание шрифта'), [
        $choice('fontFamily', 'default', Yii::t('accessibility', 'Как на сайте'), $state->fontFamily),
        $choice('fontFamily', 'sans', Yii::t('accessibility', 'Без засечек'), $state->fontFamily),
        $choice('fontFamily', 'serif', Yii::t('accessibility', 'С засечками'), $state->fontFamily),
        $choice('fontFamily', 'dyslexic', Yii::t('accessibility', 'Для дислексии'), $state->fontFamily),
    ])
    : '';

$letterSpacingBlock = $has('letterSpacing')
    ? $group(Yii::t('accessibility', 'Межбуквенный интервал'), [
        $choice('letterSpacing', 'normal', Yii::t('accessibility', 'Обычный'), $state->letterSpacing),
        $choice('letterSpacing', 'medium', Yii::t('accessibility', 'Средний'), $state->letterSpacing),
        $choice('letterSpacing', 'large', Yii::t('accessibility', 'Большой'), $state->letterSpacing),
    ])
    : '';

$lineHeightBlock = $has('lineHeight')
    ? $group(Yii::t('accessibility', 'Междустрочный интервал'), [
        $choice('lineHeight', 'normal', Yii::t('accessibility', 'Обычный'), $state->lineHeight),
        $choice('lineHeight', 'medium', Yii::t('accessibility', 'Средний'), $state->lineHeight),
        $choice('lineHeight', 'large', Yii::t('accessibility', 'Большой'), $state->lineHeight),
    ])
    : '';

// ── Инструменты ─────────────────────────────────────────────────────────────
$toolLabels = [
    'highContrast' => Yii::t('accessibility', 'Повышенный контраст'),
    'highlightLinks' => Yii::t('accessibility', 'Выделять ссылки'),
    'highlightTitles' => Yii::t('accessibility', 'Выделять заголовки'),
    'bigCursor' => Yii::t('accessibility', 'Большой курсор'),
    'stopAnimations' => Yii::t('accessibility', 'Остановить анимацию'),
    'readingGuide' => Yii::t('accessibility', 'Линейка чтения'),
    'blockEmbeds' => Yii::t('accessibility', 'Отключить видео и карты'),
];

$tools = [];
foreach ($toolLabels as $key => $label) {
    if ($has($key)) {
        $tools[] = $toggle($key, $label, $state->flag($key));
    }
}
$toolsBlock = $group(Yii::t('accessibility', 'Инструменты'), $tools);

// ── Озвучка ─────────────────────────────────────────────────────────────────
$speechBlock = '';
if ($has('speech')) {
    $speechEnabled = $state->flag('speech');

    $speechBlock = $group(Yii::t('accessibility', 'Озвучивание'), [
        $toggle('speech', Yii::t('accessibility', 'Включить озвучивание'), $speechEnabled),
        Html::tag('button', Html::encode(Yii::t('accessibility', 'Читать')), [
            'class' => 'bes-a11y-btn',
            'type' => 'button',
            'data-bes-a11y-action' => 'speak',
            'title' => Yii::t('accessibility', 'Прочитать выделенный фрагмент или текст страницы'),
        ]),
        Html::tag('button', Html::encode(Yii::t('accessibility', 'Пауза')), [
            'class' => 'bes-a11y-btn',
            'type' => 'button',
            'data-bes-a11y-action' => 'speak-pause',
        ]),
        Html::tag('button', Html::encode(Yii::t('accessibility', 'Продолжить')), [
            'class' => 'bes-a11y-btn',
            'type' => 'button',
            'data-bes-a11y-action' => 'speak-resume',
        ]),
        Html::tag('button', Html::encode(Yii::t('accessibility', 'Стоп')), [
            'class' => 'bes-a11y-btn',
            'type' => 'button',
            'data-bes-a11y-action' => 'speak-stop',
        ]),
    ]);
}

?>
<?= Html::beginTag('div', $rootOptions) ?>
    <div class="bes-a11y-panel__header">
        <h2 class="bes-a11y-panel__title"><?= Html::encode(Yii::t('accessibility', 'Настройки отображения')) ?></h2>
        <?= Html::tag(
            'button',
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
            . '<path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4l5.6 5.6L5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6Z"/>'
            . '</svg>',
            [
                'class' => 'bes-a11y-btn bes-a11y-btn--icon',
                'type' => 'button',
                'data-bes-a11y-action' => 'close',
                'aria-label' => Yii::t('accessibility', 'Закрыть'),
            ],
        ) ?>
    </div>

    <div class="bes-a11y-panel__body">
        <?= $fontScaleBlock ?>
        <?= $schemeBlock ?>
        <?= $imagesBlock ?>
        <?= $fontFamilyBlock ?>
        <?= $letterSpacingBlock ?>
        <?= $lineHeightBlock ?>
        <?= $toolsBlock ?>
        <?= $speechBlock ?>
    </div>

    <div class="bes-a11y-panel__footer">
        <?= Html::tag('button', Html::encode(Yii::t('accessibility', 'Сбросить настройки')), [
            'class' => 'bes-a11y-btn bes-a11y-btn--wide',
            'type' => 'button',
            'data-bes-a11y-action' => 'reset',
            'data-bes-a11y-announce' => Yii::t('accessibility', 'Настройки сброшены'),
        ]) ?>
        <?= Html::tag('button', Html::encode(Yii::t('accessibility', 'Обычная версия сайта')), [
            'class' => 'bes-a11y-btn bes-a11y-btn--wide',
            'type' => 'button',
            'data-bes-a11y-action' => 'disable',
        ]) ?>
    </div>
<?= Html::endTag('div') ?>
