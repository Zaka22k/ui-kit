/**
 * Reading of the `--fg-*` CSS tokens: registration with types, reading from the computed style,
 * and a hook that keeps the values up to date when the theme or the styles change.
 *
 * Чтение CSS-токенов `--fg-*`: регистрация с типами, чтение из вычисленного стиля
 * и хук, который держит значения актуальными при смене темы или стилей.
 */
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { useIsomorphicLayoutEffect } from "../utils/useIsomorphicLayoutEffect";
import { FROSTED_GLASS_TOKENS } from "./frostedGlassOptions";
import type { TokenDef, TokenValues } from "./frostedGlassOptions";

const SYNTAX: Record<TokenDef["kind"], string> = {
  number: "<number>",
  length: "<length>",
  angle: "<angle>",
  bool: "<number>",
  color: "<color>",
};

let registered: boolean | null = null;

/**
 * Registers every token as a typed CSS property (`CSS.registerProperty`). The browser then computes
 * calc(), var(), rem and color-mix() itself, and a value of the wrong type counts as "not set".
 * Called once, automatically. Where the API is missing, plain numbers and px are still understood.
 *
 * Регистрирует каждый токен как типизированное CSS-свойство (`CSS.registerProperty`). Тогда браузер сам
 * считает calc(), var(), rem и color-mix(), а значение неверного типа считается «не задан».
 * Вызывается один раз, автоматически. Там, где API нет, обычные числа и px всё равно понимаются.
 */
export function registerFrostedGlassTokens(): boolean {
  if (registered !== null) return registered;
  if (typeof window === "undefined") return false;
  if (!(window.CSS && typeof CSS.registerProperty === "function")) {
    registered = false;
    return false;
  }
  for (const def of FROSTED_GLASS_TOKENS) {
    try {
      CSS.registerProperty({
        name: def.token,
        syntax: `${SYNTAX[def.kind]} | none`,
        inherits: true,
        initialValue: "none",
      });
    } catch {
      // Already registered (for example by an @property rule). / Уже зарегистрирован (например, правилом @property).
    }
  }
  registered = true;
  return true;
}

const clamp = (v: number, def: TokenDef): number =>
  Math.min(def.max ?? Infinity, Math.max(def.min ?? -Infinity, v));

/**
 * Turns the computed value of one token into a JS value. Returns undefined when the token is not set
 * or cannot be read.
 * Превращает вычисленное значение одного токена в значение JS. Возвращает undefined, если токен не задан
 * или не читается.
 */
function parseToken(def: TokenDef, raw: string): number | boolean | string | undefined {
  if (raw === "" || raw === "none") return undefined;
  switch (def.kind) {
    case "color":
      return raw;
    case "bool":
      if (/^(false|off)$/i.test(raw)) return false;
      if (/^(true|on)$/i.test(raw)) return true;
      return Number.isFinite(parseFloat(raw)) ? parseFloat(raw) !== 0 : undefined;
    case "angle": {
      const m = /^(-?[\d.]+(?:e-?\d+)?)(deg|rad|turn|grad)?$/i.exec(raw);
      if (!m) return undefined;
      const n = parseFloat(m[1]);
      const unit = (m[2] ?? "deg").toLowerCase();
      const deg = unit === "rad" ? (n * 180) / Math.PI : unit === "turn" ? n * 360 : unit === "grad" ? n * 0.9 : n;
      return clamp(deg, def);
    }
    case "length": {
      // Typed tokens come back in px. Untyped ones are understood only in px or as a bare number
      // (rem, calc() and the like need the typed registration).
      // Типизированные токены приходят в px. Нетипизированные понимаются только в px или голым числом
      // (для rem, calc() и подобного нужна типизированная регистрация).
      const m = /^(-?[\d.]+(?:e-?\d+)?)(px)?$/i.exec(raw);
      return m ? clamp(parseFloat(m[1]), def) : undefined;
    }
    default: {
      const n = Number(raw);
      return raw !== "" && Number.isFinite(n) ? clamp(n, def) : undefined;
    }
  }
}

/**
 * Reads all tokens of an element. Only the tokens that are set are in the result.
 * Читает все токены элемента. В результате только заданные токены.
 */
export function readTokenValues(el: HTMLElement): TokenValues {
  registerFrostedGlassTokens();
  const cs = getComputedStyle(el);
  const out: Record<string, unknown> = {};
  for (const def of FROSTED_GLASS_TOKENS) {
    const value = parseToken(def, cs.getPropertyValue(def.token).trim());
    if (value !== undefined) out[def.key] = value;
  }
  return out as TokenValues;
}

const EMPTY: TokenValues = {};

// ---- One shared observer / Один общий наблюдатель ----

/**
 * A glass panel that wants to hear about changes of its ancestors.
 * Панель, которой нужно знать об изменениях своих предков.
 */
interface Subscriber {
  el: HTMLElement;
  notify: () => void;
}

const subscribers = new Set<Subscriber>();
let observer: MutationObserver | null = null;
let schemeQuery: MediaQueryList | null = null;

/**
 * Parts of an inline style that change all the time and never carry a token: the spring `scale` and the
 * pointer position of FrostedGlass itself. They are cut out before the old and the new style are compared.
 * Части inline-стиля, которые меняются постоянно и токенов не несут: пружинный `scale` и положение
 * указателя самого FrostedGlass. Перед сравнением старого и нового стиля они вырезаются.
 */
const VOLATILE_STYLE = /(?<![\w-])(?:scale|--fg-pointer-[xy])\s*:[^;]*;?/g;

/**
 * Whether an attribute change can affect tokens. Inline styles count only when they carry custom
 * properties and really changed, so ordinary style animation does not cost a read per frame.
 * Может ли смена атрибута повлиять на токены. Inline-стили учитываются, только если в них есть
 * пользовательские свойства и стиль правда изменился, чтобы обычная анимация style не стоила чтения
 * на каждый кадр.
 */
function isRelevant(r: MutationRecord): boolean {
  if (r.attributeName !== "style") return true;
  const now = ((r.target as Element).getAttribute("style") ?? "").replace(VOLATILE_STYLE, "");
  const before = (r.oldValue ?? "").replace(VOLATILE_STYLE, "");
  return now !== before && (now.includes("--") || before.includes("--"));
}

const notifyAll = () => {
  subscribers.forEach((s) => s.notify());
};

function startObserving() {
  observer = new MutationObserver((records) => {
    const relevant = records.filter(isRelevant);
    if (relevant.length === 0) return;
    // Only the ancestors of a panel matter; its own attributes are read after each render.
    // Важны только предки панели; её собственные атрибуты читаются после каждого рендера.
    subscribers.forEach((s) => {
      if (relevant.some((r) => r.target !== s.el && r.target.contains(s.el))) s.notify();
    });
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeOldValue: true,
    subtree: true,
  });
  if (typeof matchMedia === "function") {
    schemeQuery = matchMedia("(prefers-color-scheme: dark)");
    schemeQuery.addEventListener("change", notifyAll);
  }
}

function stopObserving() {
  observer?.disconnect();
  observer = null;
  schemeQuery?.removeEventListener("change", notifyAll);
  schemeQuery = null;
}

/**
 * Keeps the token values of an element up to date. They are read after every render of the component
 * and again when something that can change them happens: an attribute of any ancestor changes
 * (class, data-theme, or an inline style that declares custom properties), or the system colour scheme
 * changes. All panels share one MutationObserver on the document, and every panel merges its reads into
 * one per frame. Changes made only by a stylesheet rule that starts to apply without any attribute change
 * (for example :hover on an ancestor) are not noticed.
 *
 * Держит значения токенов элемента актуальными. Они читаются после каждого рендера компонента и ещё раз,
 * когда происходит то, что может их изменить: меняется атрибут любого предка (class, data-theme или
 * inline-стиль с пользовательскими свойствами) либо системная цветовая схема. Все панели делят один
 * MutationObserver на документ, а каждая панель объединяет свои чтения в одно за кадр. Изменения,
 * вызванные только правилом таблицы стилей без смены атрибутов (например, :hover у предка), не замечаются.
 */
export function useFrostedGlassTokens(ref: RefObject<HTMLElement | null>): TokenValues {
  const [tokens, setTokens] = useState<TokenValues>(EMPTY);
  const last = useRef("{}");

  const read = useRef(() => {});
  read.current = () => {
    const el = ref.current;
    if (!el) return;
    const next = readTokenValues(el);
    const key = JSON.stringify(next);
    if (key === last.current) return;
    last.current = key;
    setTokens(Object.keys(next).length ? next : EMPTY);
  };

  // After every render: the element's own class and style may have changed.
  // После каждого рендера: собственные class и style элемента могли измениться.
  useIsomorphicLayoutEffect(() => {
    read.current();
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const notify = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        read.current();
      });
    };

    const subscriber: Subscriber = { el, notify };
    subscribers.add(subscriber);
    if (subscribers.size === 1) startObserving();

    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) stopObserving();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);

  return tokens;
}
