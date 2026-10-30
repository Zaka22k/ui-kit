"use client";

/**
 * Reading of the `--lg-*` CSS tokens: registration with types, reading from the computed style,
 * and a hook that keeps the values up to date when the theme or the styles change.
 *
 * Чтение CSS-токенов `--lg-*`: регистрация с типами, чтение из вычисленного стиля
 * и хук, который держит значения актуальными при смене темы или стилей.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { LIQUID_GLASS_TOKENS } from "./liquidGlassOptions";
import type { TokenDef, TokenValues } from "./liquidGlassOptions";

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
export function registerLiquidGlassTokens(): boolean {
  if (registered !== null) return registered;
  if (typeof window === "undefined") return false;
  if (!(window.CSS && typeof CSS.registerProperty === "function")) {
    registered = false;
    return false;
  }
  for (const def of LIQUID_GLASS_TOKENS) {
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
function parseToken(
  def: TokenDef,
  raw: string,
): number | boolean | string | undefined {
  if (raw === "" || raw === "none") return undefined;
  switch (def.kind) {
    case "color":
      return raw;
    case "bool":
      if (/^(false|off)$/i.test(raw)) return false;
      if (/^(true|on)$/i.test(raw)) return true;
      return Number.isFinite(parseFloat(raw))
        ? parseFloat(raw) !== 0
        : undefined;
    case "angle": {
      const m = /^(-?[\d.]+(?:e-?\d+)?)(deg|rad|turn|grad)?$/i.exec(raw);
      if (!m) return undefined;
      const n = parseFloat(m[1]);
      const unit = (m[2] ?? "deg").toLowerCase();
      const deg =
        unit === "rad"
          ? (n * 180) / Math.PI
          : unit === "turn"
            ? n * 360
            : unit === "grad"
              ? n * 0.9
              : n;
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
  registerLiquidGlassTokens();
  const cs = getComputedStyle(el);
  const out: Record<string, unknown> = {};
  for (const def of LIQUID_GLASS_TOKENS) {
    const value = parseToken(def, cs.getPropertyValue(def.token).trim());
    if (value !== undefined) out[def.key] = value;
  }
  return out as TokenValues;
}

const EMPTY: TokenValues = {};

/**
 * Keeps the token values of an element up to date. They are read after every render of the component
 * and again when something that can change them happens: an attribute of any ancestor changes
 * (class, data-theme, or an inline style that declares custom properties), or the system colour scheme
 * changes. Reads are merged into one per frame. Changes made only by a stylesheet rule that starts to
 * apply without any attribute change (for example :hover on an ancestor) are not noticed.
 *
 * Держит значения токенов элемента актуальными. Они читаются после каждого рендера компонента и ещё раз,
 * когда происходит то, что может их изменить: меняется атрибут любого предка (class, data-theme или
 * inline-стиль с пользовательскими свойствами) либо системная цветовая схема. Чтения объединяются
 * в одно за кадр. Изменения, вызванные только правилом таблицы стилей без смены атрибутов
 * (например, :hover у предка), не замечаются.
 */
export function useLiquidGlassTokens(
  ref: RefObject<HTMLElement | null>,
): TokenValues {
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
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        read.current();
      });
    };

    const observer = new MutationObserver((records) => {
      for (const r of records) {
        // Inline styles are watched only when they carry custom properties, so ordinary
        // style animation of an ancestor does not cost a read per frame.
        // Inline-стили отслеживаются, только если в них есть пользовательские свойства, чтобы обычная
        // анимация style у предка не стоила чтения на каждый кадр.
        if (r.attributeName === "style") {
          const now = (r.target as Element).getAttribute("style") ?? "";
          if (!now.includes("--") && !(r.oldValue ?? "").includes("--"))
            continue;
        }
        schedule();
        return;
      }
    });
    for (let n = el.parentElement; n; n = n.parentElement) {
      observer.observe(n, { attributes: true, attributeOldValue: true });
    }
    const mq =
      typeof matchMedia === "function"
        ? matchMedia("(prefers-color-scheme: dark)")
        : null;
    mq?.addEventListener("change", schedule);

    return () => {
      observer.disconnect();
      mq?.removeEventListener("change", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);

  return tokens;
}
