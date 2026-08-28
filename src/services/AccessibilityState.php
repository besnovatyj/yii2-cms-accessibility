<?php

/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

declare(strict_types=1);

namespace Besnovatyj\Accessibility\services;

use Besnovatyj\Accessibility\support\Schemes;

/**
 * Состояние панели, прочитанное на сервере.
 *
 * Зачем серверу знать выбор посетителя: панель печатается уже в нужном виде —
 * нажатые кнопки, текущий процент масштаба. Без этого разметка приезжает
 * «пустой», а скрипт расставляет отметки после загрузки, и панель на долю
 * секунды показывает не то состояние, в котором находится сайт.
 *
 * ⚠ Cookie читается напрямую из $_COOKIE, а не через Yii::$app->request->cookies.
 * Причина: при включённой enableCookieValidation (а она включена по умолчанию)
 * Yii ждёт от каждой cookie подпись HMAC и молча отбрасывает всё, что подписи
 * не имеет. Эту cookie пишет браузерный скрипт, подписать её он не может.
 * Поэтому значение берётся сырым и проверяется здесь же, вручную.
 */
final readonly class AccessibilityState
{
    /** Имя cookie. Должно совпадать с A11yConfig.cookieName на стороне TypeScript. */
    public const string COOKIE_NAME = 'bes_a11y';

    /** Все настройки, которыми можно управлять из панели. */
    public const array CONTROLS = [
        'fontScale',
        'scheme',
        'images',
        'fontFamily',
        'letterSpacing',
        'lineHeight',
        'highContrast',
        'highlightLinks',
        'highlightTitles',
        'bigCursor',
        'stopAnimations',
        'readingGuide',
        'blockEmbeds',
        'speech',
    ];

    public const array IMAGE_MODES = ['normal', 'grayscale', 'hidden'];
    public const array FONT_FAMILIES = ['default', 'sans', 'serif', 'dyslexic'];
    public const array SPACING_STEPS = ['normal', 'medium', 'large'];

    /** Настройки, значение которых булево. */
    private const array BOOLEAN_KEYS = [
        'highContrast',
        'highlightLinks',
        'highlightTitles',
        'bigCursor',
        'stopAnimations',
        'readingGuide',
        'blockEmbeds',
        'speech',
    ];

    /**
     * @param array<string, bool> $flags булевы настройки, ключи из BOOLEAN_KEYS
     */
    public function __construct(
        public bool $enabled = false,
        public float $fontScale = 1.0,
        public string $scheme = Schemes::DEFAULT,
        public string $images = 'normal',
        public string $fontFamily = 'default',
        public string $letterSpacing = 'normal',
        public string $lineHeight = 'normal',
        public array $flags = [],
    ) {
    }

    /**
     * Прочитать состояние из cookie текущего запроса.
     *
     * Любая ошибка разбора даёт состояние по умолчанию: cookie правится
     * пользователем, доверять её содержимому нельзя.
     */
    public static function fromCookie(): self
    {
        $raw = $_COOKIE[self::COOKIE_NAME] ?? null;
        if (!is_string($raw) || $raw === '') {
            return new self();
        }

        $decoded = json_decode(rawurldecode($raw), true);

        return is_array($decoded) ? self::fromArray($decoded) : new self();
    }

    /**
     * Собрать состояние из произвольного массива, отбросив всё недопустимое.
     *
     * @param array<array-key, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $flags = [];
        foreach (self::BOOLEAN_KEYS as $key) {
            $flags[$key] = ($data[$key] ?? false) === true;
        }

        return new self(
            enabled: ($data['enabled'] ?? false) === true,
            fontScale: self::clampScale($data['fontScale'] ?? null),
            scheme: self::oneOf($data['scheme'] ?? null, Schemes::ids(), Schemes::DEFAULT),
            images: self::oneOf($data['images'] ?? null, self::IMAGE_MODES, 'normal'),
            fontFamily: self::oneOf($data['fontFamily'] ?? null, self::FONT_FAMILIES, 'default'),
            letterSpacing: self::oneOf($data['letterSpacing'] ?? null, self::SPACING_STEPS, 'normal'),
            lineHeight: self::oneOf($data['lineHeight'] ?? null, self::SPACING_STEPS, 'normal'),
            flags: $flags,
        );
    }

    /** Значение булевой настройки. */
    public function flag(string $key): bool
    {
        return $this->flags[$key] ?? false;
    }

    /**
     * Значение произвольной настройки в виде строки — для сравнения
     * с data-bes-a11y-value в разметке.
     */
    public function value(string $key): string
    {
        return match ($key) {
            'scheme' => $this->scheme,
            'images' => $this->images,
            'fontFamily' => $this->fontFamily,
            'letterSpacing' => $this->letterSpacing,
            'lineHeight' => $this->lineHeight,
            default => '',
        };
    }

    /** Масштаб шрифта в процентах, как он показывается в панели. */
    public function fontScalePercent(): int
    {
        return (int)round($this->fontScale * 100);
    }

    /**
     * Границы здесь жёсткие и не зависят от настроек модуля: это защита от
     * подменённой cookie, а не пользовательская настройка. Настраиваемые
     * min/max применяются в браузере, при нажатии на «плюс» и «минус».
     */
    private static function clampScale(mixed $value): float
    {
        if (!is_int($value) && !is_float($value)) {
            return 1.0;
        }

        return max(0.5, min(3.0, (float)$value));
    }

    /**
     * @param list<string> $allowed
     */
    private static function oneOf(mixed $value, array $allowed, string $fallback): string
    {
        return is_string($value) && in_array($value, $allowed, true) ? $value : $fallback;
    }
}
