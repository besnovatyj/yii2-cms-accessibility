/*
 * Copyright (c) 2026 Besnovatyj. Licensed under the MIT License.
 */

import {UI_CLASS} from '../dom/selectors';
import type {A11yConfig, A11yState, Feature, FeatureContext} from '../types';

/**
 * Максимальная длина куска, отдаваемого синтезатору за раз.
 *
 * ⚠ Не увеличивать. Chrome обрывает произнесение примерно на пятнадцатой
 * секунде, если текст ушёл одной длинной репликой: срабатывает watchdog
 * фонового процесса синтеза. Лечится нарезкой на короткие реплики, которые
 * ставятся в очередь и произносятся подряд — очередь watchdog не трогает.
 * 180 символов на скорости 1.0 — это около десяти секунд.
 */
const CHUNK_LIMIT = 180;

/** Сколько текста максимум читаем с одного элемента, чтобы не уйти в бесконечность. */
const MAX_TEXT = 8000;

/**
 * Синтезатор речи.
 *
 * Три момента, на которых обычно ломается озвучка в браузере, и что с ними
 * сделано:
 *
 * 1. Голоса приезжают асинхронно. В Chrome первый вызов getVoices() почти
 *    всегда возвращает пустой массив — список подтягивается позже и приходит
 *    событием voiceschanged. Если выбрать голос сразу и запомнить, озвучка
 *    молчит до перезагрузки страницы. Поэтому голос разрешается лениво,
 *    при каждом произнесении, и кешируется только после успеха.
 *
 * 2. Длинные реплики обрываются (см. CHUNK_LIMIT).
 *
 * 3. cancel() асинхронен. Вызов speak() сразу после cancel() в Chrome иногда
 *    попадает в ещё не закрытую очередь и теряется. Отсюда постановка через
 *    микрозадачу в flush().
 */
export class SpeechReader implements Feature {
    public readonly id = 'speech';

    private voice: SpeechSynthesisVoice | null = null;
    private queue: string[] = [];
    private enabled = false;

    private readonly onClick = (event: MouseEvent): void => {
        const target = event.target;
        if (!(target instanceof Element) || target.closest(`.${UI_CLASS}`) !== null) {
            return;
        }

        const text = SpeechReader.extractText(target);
        if (text !== '') {
            this.speak(text);
        }
    };

    public constructor(private readonly config: Readonly<A11yConfig>) {
    }

    /** Поддерживается ли синтез речи браузером. */
    public static get supported(): boolean {
        return typeof window !== 'undefined'
            && 'speechSynthesis' in window
            && 'SpeechSynthesisUtterance' in window;
    }

    public sync(state: Readonly<A11yState>, _ctx: FeatureContext): void {
        const shouldEnable = state.enabled && state.speech && SpeechReader.supported;

        if (shouldEnable === this.enabled) {
            return;
        }

        this.enabled = shouldEnable;

        if (shouldEnable) {
            document.addEventListener('click', this.onClick);
        } else {
            document.removeEventListener('click', this.onClick);
            this.stop();
        }
    }

    public destroy(): void {
        document.removeEventListener('click', this.onClick);
        this.enabled = false;
        this.stop();
    }

    /**
     * Произнести текст, прервав текущее чтение.
     *
     * Вызывается и для содержимого страницы, и для коротких объявлений об
     * изменении настройки — разницы для синтезатора нет.
     */
    public speak(text: string): void {
        if (!this.enabled) {
            return;
        }

        const normalized = text.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
        if (normalized === '') {
            return;
        }

        this.queue = SpeechReader.split(normalized);
        this.flush();
    }

    /** Прочитать выделенный фрагмент, а если ничего не выделено — основной текст. */
    public speakSelection(): void {
        const selection = window.getSelection()?.toString() ?? '';
        if (selection.trim() !== '') {
            this.speak(selection);
            return;
        }

        const main = document.querySelector('main, [role="main"], article') ?? document.body;
        this.speak(SpeechReader.extractText(main));
    }

    public pause(): void {
        if (SpeechReader.supported && speechSynthesis.speaking) {
            speechSynthesis.pause();
        }
    }

    public resume(): void {
        if (SpeechReader.supported && speechSynthesis.paused) {
            speechSynthesis.resume();
        }
    }

    public stop(): void {
        this.queue = [];
        if (SpeechReader.supported) {
            speechSynthesis.cancel();
        }
    }

    /**
     * Отправить очередь в синтезатор.
     *
     * cancel() и speak() разнесены микрозадачей: в Chrome вызов speak()
     * непосредственно после cancel() может попасть в ещё не закрытую очередь
     * и не прозвучать.
     */
    private flush(): void {
        speechSynthesis.cancel();

        queueMicrotask(() => {
            const voice = this.resolveVoice();

            for (const chunk of this.queue) {
                const utterance = new SpeechSynthesisUtterance(chunk);
                utterance.lang = this.config.speechLang;
                utterance.rate = this.config.speechRate;
                if (voice !== null) {
                    utterance.voice = voice;
                }
                speechSynthesis.speak(utterance);
            }

            this.queue = [];
        });
    }

    /**
     * Подобрать голос под язык из конфигурации.
     *
     * Точное совпадение (`ru-RU`) предпочтительнее совпадения по языку (`ru`),
     * локальный голос — сетевому: сетевой добавляет задержку и отваливается
     * без интернета.
     */
    private resolveVoice(): SpeechSynthesisVoice | null {
        if (this.voice !== null) {
            return this.voice;
        }

        const voices = speechSynthesis.getVoices();
        if (voices.length === 0) {
            // Список ещё не приехал. Ничего не кешируем — на следующем
            // произнесении попробуем снова. Голос по умолчанию у синтезатора
            // всё равно есть, реплика прозвучит.
            return null;
        }

        const wanted = this.config.speechLang.toLowerCase();
        const language = wanted.split('-')[0] ?? wanted;

        const candidates = voices.filter(
            (v) => v.lang.toLowerCase().replace('_', '-').startsWith(language),
        );
        if (candidates.length === 0) {
            return null;
        }

        const exact = candidates.filter(
            (v) => v.lang.toLowerCase().replace('_', '-') === wanted,
        );
        const pool = exact.length > 0 ? exact : candidates;

        this.voice = pool.find((v) => v.localService) ?? pool[0] ?? null;

        return this.voice;
    }

    /**
     * Нарезать текст на реплики не длиннее CHUNK_LIMIT.
     *
     * Режем по границам предложений, а если предложение длиннее лимита — по
     * пробелам. Резать посреди слова нельзя: синтезатор произнесёт обрубок.
     */
    private static split(text: string): string[] {
        const sentences = text.match(/[^.!?…]+[.!?…]*\s*/g) ?? [text];
        const chunks: string[] = [];
        let current = '';

        const push = (piece: string): void => {
            if (current.length + piece.length <= CHUNK_LIMIT) {
                current += piece;
                return;
            }
            if (current !== '') {
                chunks.push(current.trim());
            }
            current = piece;
        };

        for (const sentence of sentences) {
            if (sentence.length <= CHUNK_LIMIT) {
                push(sentence);
                continue;
            }

            for (const word of sentence.split(/(?<=\s)/)) {
                push(word);
            }
        }

        if (current.trim() !== '') {
            chunks.push(current.trim());
        }

        return chunks;
    }

    /**
     * Достать читаемый текст из элемента.
     *
     * Скрытые ветки и служебная разметка отбрасываются: озвучивать содержимое
     * закрытого выпадающего меню — верный способ запутать человека, который
     * не видит экран.
     */
    private static extractText(element: Element): string {
        const clone = element.cloneNode(true);
        if (!(clone instanceof Element)) {
            return '';
        }

        for (const junk of clone.querySelectorAll('script, style, noscript, [aria-hidden="true"], [hidden]')) {
            junk.remove();
        }

        return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
    }
}
