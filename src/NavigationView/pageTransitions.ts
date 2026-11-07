"use client";

import { createContext, useContext } from "react";
import { useIsomorphicLayoutEffect } from "../utils/useIsomorphicLayoutEffect";

/* ------------------------------------------------------------------ */
/* Переходы между страницами NavigationView                            */
/* ------------------------------------------------------------------ */

/** Ключ страницы. Для роутера это `pathname`. */
export type PageKey = string | number;

/**
 * Как страница, на которую перешли, связана с прежней (только для ключей-путей,
 * то есть строк, начинающихся с «/»; для остальных ключей всегда "peer"):
 * - "child": новая лежит глубже прежней (`/a` → `/a/new`);
 * - "parent": новая лежит выше прежней (`/a/new` → `/a`);
 * - "peer": остальное (`/a` → `/b`, `/a/1` → `/a/2`).
 */
export type PageRelation = "peer" | "child" | "parent";

/** "back" при переходе на страницу выше по пути, иначе "forward". */
export type PageDirection = "forward" | "back";

export interface PageTransitionInfo {
  /** Ключ страницы, которая уходит. */
  from: PageKey;
  /** Ключ страницы, которая появляется. */
  to: PageKey;
  relation: PageRelation;
  direction: PageDirection;
}

/** Одна дорожка анимации: аргументы `Element.animate()`. */
export interface PageAnimation {
  keyframes: Keyframe[] | PropertyIndexedKeyframes;
  /** `fill` по умолчанию `"backwards"`. После конца эффект снимается. */
  options?: KeyframeAnimationOptions;
}

export type PageTransitionName =
  | "auto"
  | "entrance"
  | "drillIn"
  | "slide"
  | "suppress";

/**
 * Что может вернуть свой переход: дорожки анимации, имя встроенного перехода
 * либо `null` (без анимации).
 */
export type PageTransitionResult =
  | PageAnimation
  | PageAnimation[]
  | PageTransitionName
  | null
  | undefined;

export type PageTransitionFn = (
  info: PageTransitionInfo,
) => PageTransitionResult;

/** Имя встроенного перехода или своя функция. */
export type PageTransitionSetting = PageTransitionName | PageTransitionFn;

/* ------------------------------------------------------------------ */
/* Время и кривые (Motion in Windows)                                  */
/* ------------------------------------------------------------------ */

export const pageMotion = {
  duration: {
    /** Bare Minimum: затухание. */
    fade: 83,
    fast: 167,
    normal: 250,
    /** Direct Entrance: появление страницы. */
    slow: 333,
  },
  easing: {
    /** Direct Entrance (Fast In): появление. */
    directEntrance: "cubic-bezier(0, 0, 0, 1)",
    /** Existing Elements (Point to Point): перемещение уже видимого. */
    pointToPoint: "cubic-bezier(0.55, 0.55, 0, 1)",
    linear: "linear",
  },
} as const;

const fadeIn = (): PageAnimation => ({
  keyframes: [{ opacity: 0 }, { opacity: 1 }],
  options: {
    duration: pageMotion.duration.fade,
    easing: pageMotion.easing.linear,
  },
});

const toCss = (value: number | string): string =>
  typeof value === "number" ? `${value}px` : value;

type BuiltIn = (info: PageTransitionInfo) => PageAnimation[];

/* ------------------------------------------------------------------ */
/* Встроенные переходы                                                 */
/* ------------------------------------------------------------------ */

export interface EntranceOptions {
  /** Длительность сдвига, мс. По умолчанию 333. */
  duration?: number;
  /** Сдвиг снизу: число (px) или CSS-значение. По умолчанию `--nav-page-shift`. */
  distance?: number | string;
}

/** Page refresh: страница выезжает снизу и проявляется. */
export function entranceTransition({
  duration = pageMotion.duration.slow,
  distance = "var(--nav-page-shift)",
}: EntranceOptions = {}): BuiltIn {
  const shift = toCss(distance);
  return () => [
    {
      keyframes: [
        { transform: `translateY(${shift})` },
        { transform: "translateY(0)" },
      ],
      options: { duration, easing: pageMotion.easing.directEntrance },
    },
    fadeIn(),
  ];
}

export interface DrillInOptions {
  duration?: number;
  /**
   * Масштаб, с которого страница появляется при переходе вглубь (меньше 1).
   * При возврате она появляется с зеркальным масштабом `2 - scale`.
   * По умолчанию `--nav-page-drill-scale`.
   */
  scale?: number | string;
}

/** Drill: вглубь страница вырастает из меньшего размера, назад ужимается из большего. */
export function drillInTransition({
  duration = pageMotion.duration.slow,
  scale = "var(--nav-page-drill-scale)",
}: DrillInOptions = {}): BuiltIn {
  return ({ direction }) => {
    const from = direction === "back" ? `calc(2 - ${scale})` : String(scale);
    return [
      {
        keyframes: [{ transform: `scale(${from})` }, { transform: "scale(1)" }],
        options: { duration, easing: pageMotion.easing.directEntrance },
      },
      fadeIn(),
    ];
  };
}

export type SlideEffect = "auto" | "fromLeft" | "fromRight";

export interface SlideOptions {
  /**
   * Откуда выезжает страница. "auto": справа при переходе вперёд, слева при
   * возврате. По умолчанию "auto".
   */
  effect?: SlideEffect;
  duration?: number;
  /** Сдвиг по горизонтали: число (px) или CSS-значение. По умолчанию `--nav-page-slide-shift`. */
  distance?: number | string;
}

/** Horizontal slide: страница выезжает сбоку. */
export function slideTransition({
  effect = "auto",
  duration = pageMotion.duration.slow,
  distance = "var(--nav-page-slide-shift)",
}: SlideOptions = {}): BuiltIn {
  const shift = toCss(distance);
  return ({ direction }) => {
    const side =
      effect === "auto"
        ? direction === "back"
          ? "fromLeft"
          : "fromRight"
        : effect;
    const from = side === "fromLeft" ? `calc(-1 * ${shift})` : shift;
    return [
      {
        keyframes: [
          { transform: `translateX(${from})` },
          { transform: "translateX(0)" },
        ],
        options: { duration, easing: pageMotion.easing.directEntrance },
      },
      fadeIn(),
    ];
  };
}

/** Suppress: страница появляется сразу, без анимации. */
export function suppressTransition(): BuiltIn {
  return () => [];
}

/**
 * Выбор по связи страниц, как советует WinUI: соседние страницы (пункты меню) это
 * entrance, переход вглубь и возврат из неё это drillIn.
 */
export function autoTransition(): BuiltIn {
  const entrance = entranceTransition();
  const drillIn = drillInTransition();
  return (info) => (info.relation === "peer" ? entrance(info) : drillIn(info));
}

const NAMED: Record<PageTransitionName, BuiltIn> = {
  auto: autoTransition(),
  entrance: entranceTransition(),
  drillIn: drillInTransition(),
  slide: slideTransition(),
  suppress: suppressTransition(),
};

/* ------------------------------------------------------------------ */
/* Связь страниц по ключам-путям                                        */
/* ------------------------------------------------------------------ */

export function normalizePagePath(key: PageKey): string | null {
  if (typeof key !== "string" || !key.startsWith("/")) return null;
  const path = key.split(/[?#]/)[0].replace(/\/+$/, "");
  return path === "" ? "/" : path;
}

const isAncestor = (ancestor: string, path: string): boolean =>
  ancestor !== "/" && path.startsWith(`${ancestor}/`);

export function getPageRelation(from: PageKey, to: PageKey): PageRelation {
  const a = normalizePagePath(from);
  const b = normalizePagePath(to);
  if (a === null || b === null || a === b) return "peer";
  if (isAncestor(a, b)) return "child";
  if (isAncestor(b, a)) return "parent";
  return "peer";
}

export function createPageTransitionInfo(
  from: PageKey,
  to: PageKey,
): PageTransitionInfo {
  const relation = getPageRelation(from, to);
  return {
    from,
    to,
    relation,
    direction: relation === "parent" ? "back" : "forward",
  };
}

/* ------------------------------------------------------------------ */
/* Выбор и запуск                                                      */
/* ------------------------------------------------------------------ */

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function resolvePageTransition(
  setting: PageTransitionSetting,
  info: PageTransitionInfo,
  reducedMotion = false,
): PageAnimation[] {
  let result: PageTransitionResult =
    typeof setting === "function" ? setting(info) : setting;
  if (typeof result === "string") result = (NAMED[result] ?? NAMED.auto)(info);

  const animations =
    result === null || result === undefined
      ? []
      : Array.isArray(result)
        ? result
        : [result];
  return reducedMotion && animations.length > 0 ? [fadeIn()] : animations;
}

const VAR_PATTERN = /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g;

function substituteVars(value: unknown, style: CSSStyleDeclaration): unknown {
  if (typeof value !== "string" || !value.includes("var(")) return value;
  return value.replace(
    VAR_PATTERN,
    (match, name: string, fallback?: string) => {
      const resolved = style.getPropertyValue(name).trim();
      return resolved || fallback?.trim() || match;
    },
  );
}

function resolveVars(
  keyframes: PageAnimation["keyframes"],
  style: CSSStyleDeclaration,
): PageAnimation["keyframes"] {
  if (Array.isArray(keyframes)) {
    return keyframes.map(
      (frame) =>
        Object.fromEntries(
          Object.entries(frame).map(([prop, value]) => [
            prop,
            substituteVars(value, style),
          ]),
        ) as Keyframe,
    );
  }
  return Object.fromEntries(
    Object.entries(keyframes).map(([prop, value]) => [
      prop,
      Array.isArray(value)
        ? value.map((item) => substituteVars(item, style))
        : substituteVars(value, style),
    ]),
  ) as PropertyIndexedKeyframes;
}

export function playPageAnimations(
  element: HTMLElement,
  animations: PageAnimation[],
): Animation[] {
  if (typeof element.animate !== "function") return [];
  const style = getComputedStyle(element);
  return animations.map(({ keyframes, options }) =>
    element.animate(resolveVars(keyframes, style), {
      fill: "backwards",
      ...options,
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Связь Page → NavigationView                                         */
/* ------------------------------------------------------------------ */

export interface PageFrameContextValue {
  /** Переход, которым появляется страница; `undefined` возвращает настройку NavigationView. */
  setTransition: (setting: PageTransitionSetting | undefined) => void;
}

export const PageFrameContext = createContext<PageFrameContextValue | null>(
  null,
);

export function usePageTransition(setting?: PageTransitionSetting): void {
  const frame = useContext(PageFrameContext);
  useIsomorphicLayoutEffect(() => {
    frame?.setTransition(setting);
  }, [frame, setting]);
}
