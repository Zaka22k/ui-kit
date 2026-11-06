"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  HTMLAttributes,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { useForwardedRef } from "../utils/useForwardedRef";
import { useIsomorphicLayoutEffect } from "../utils/useIsomorphicLayoutEffect";
import { edgeShadows, shadowCss } from "./frostedGlassMath";
import { resolveOptions } from "./frostedGlassOptions";
import type { FrostedGlassOptions } from "./frostedGlassOptions";
import { useFrostedGlassTokens } from "./frostedGlassTokens";

/**
 * Props of FrostedGlass: all glass options plus any native div attribute.
 * Пропсы FrostedGlass: все параметры стекла и любые атрибуты div.
 */
export interface FrostedGlassProps
  extends FrostedGlassOptions, Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children?: ReactNode;
}

/**
 * True when the browser can blur what is behind an element. Every current engine can (Safari under the
 * -webkit- prefix); only old or locked-down browsers cannot, and they get `fallbackTint` instead.
 * True, если браузер умеет размывать то, что за элементом. Умеют все современные движки (Safari под
 * префиксом -webkit-); не умеют только старые или урезанные браузеры, им достаётся `fallbackTint`.
 */
function supportsBackdropFilter(): boolean {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return true;
  return (
    CSS.supports("backdrop-filter", "blur(1px)") ||
    CSS.supports("-webkit-backdrop-filter", "blur(1px)")
  );
}

/**
 * Overlay layers sit under the content and over the panel background. Later layers lie above earlier ones.
 * Слои-наложения лежат под содержимым и над фоном панели. Более поздние слои лежат выше ранних.
 */
const OVERLAY_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: -1,
  borderRadius: "inherit",
  pointerEvents: "none",
};

/**
 * A frosted panel: it blurs whatever is behind it and keeps the edge highlight, the edge shade and the
 * hover and press effects of Liquid Glass, but does not refract.
 *
 * The blur is a plain CSS `backdrop-filter` (with the -webkit- prefix for Safari), so it works in every
 * current browser and costs the browser nothing extra. The edge highlight and the edge shade are two
 * layers made of CSS `inset box-shadow` (no canvas, no images): the shape follows the border-radius of the
 * panel, so nothing is measured or rebuilt when the size changes. The panel can have a fixed size, a
 * percentage, or 'auto'.
 *
 * Every option is a prop and also a CSS token `--fg-*`; the token wins. Set tokens in a stylesheet,
 * on a theme root, or in `style`. The list of tokens is FROSTED_GLASS_TOKENS and the README.
 *
 * Матовая панель: размывает то, что находится за ней, и сохраняет блик, тень по краю и эффекты наведения и
 * нажатия Liquid Glass, но не преломляет.
 *
 * Размытие это обычный CSS `backdrop-filter` (с префиксом -webkit- для Safari), поэтому оно работает во всех
 * современных браузерах и ничего лишнего не стоит. Блик и тень по краю это два слоя
 * на CSS `inset box-shadow` (без canvas и картинок): форму даёт border-radius панели, поэтому при смене
 * размера ничего не замеряется и не пересобирается. Размер может быть фиксированным, в процентах или 'auto'.
 *
 * Каждый параметр это пропс и одновременно CSS-токен `--fg-*`; токен главнее. Токены задаются в таблице
 * стилей, на корне темы или в `style`. Список токенов: FROSTED_GLASS_TOKENS и README.
 */
export const FrostedGlass = forwardRef<HTMLDivElement, FrostedGlassProps>(
  function FrostedGlass(
    {
      width,
      height,
      radius,
      blur,
      saturation,
      tint,
      tintOpacity,
      fallbackTint,
      edgeShadowOpacity,
      edgeShadowWidth,
      edgeShadowDirection,
      specularColor,
      specularOpacity,
      specularWidth,
      specularAngle,
      interactive,
      glowHover,
      glowPress,
      glowEdge,
      glowSize,
      glowColor,
      hoverScale,
      pressScale,
      bounce,
      stiffness,
      onPointerEnter,
      onPointerLeave,
      onPointerMove,
      onPointerDown,
      style,
      children,
      ...rest
    },
    forwardedRef,
  ) {
    const { ref: innerRef, setRefs } = useForwardedRef(forwardedRef);

    // Token, then prop, then default. / Токен, затем пропс, затем значение по умолчанию.
    const tokens = useFrostedGlassTokens(innerRef);
    const o = resolveOptions(
      {
        width,
        height,
        radius,
        blur,
        saturation,
        tint,
        tintOpacity,
        fallbackTint,
        edgeShadowOpacity,
        edgeShadowWidth,
        edgeShadowDirection,
        specularColor,
        specularOpacity,
        specularWidth,
        specularAngle,
        interactive,
        glowHover,
        glowPress,
        glowEdge,
        glowSize,
        glowColor,
        hoverScale,
        pressScale,
        bounce,
        stiffness,
      },
      tokens,
    );

    const [backdropOk, setBackdropOk] = useState(true);
    useIsomorphicLayoutEffect(() => {
      setBackdropOk(supportsBackdropFilter());
    }, []);

    // Edge shadows depend only on the thickness, the width, the light and the directionality. Size and radius
    // do not matter: the layers follow the border-radius of the panel. Opacities are applied in CSS.
    // Тени по краю зависят только от толщины, ширины, света и направленности. Размер и радиус не важны:
    // слои следуют border-radius панели. Непрозрачности применяются через CSS.
    const edge = useMemo(() => {
      const e = edgeShadows(o.specularWidth, o.edgeShadowWidth, o.specularAngle, o.edgeShadowDirection);
      return {
        rim: shadowCss(e.rim, (a) => `color-mix(in srgb, ${o.specularColor} ${+(a * 100).toFixed(1)}%, transparent)`),
        shade: shadowCss(e.shade, (a) => `rgba(0, 0, 0, ${a})`),
      };
    }, [o.specularWidth, o.edgeShadowWidth, o.specularAngle, o.edgeShadowDirection, o.specularColor]);

    // ---- Hover and press effects / Эффекты наведения и нажатия ----
    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);
    const spring = useRef({ x: 1, v: 0, t: 1, raf: 0, last: 0 });
    // The loop reads the latest spring settings without restarting.
    // Цикл берёт актуальные настройки пружины без перезапуска.
    const springCfg = useRef({ stiffness: o.stiffness, bounce: o.bounce });
    springCfg.current = { stiffness: o.stiffness, bounce: o.bounce };

    const scaleTarget = !o.interactive
      ? 1
      : pressed
        ? o.pressScale
        : hovered
          ? o.hoverScale
          : 1;

    // Damped spring on the `scale` CSS property, written straight to the element (no React render per frame).
    // Затухающая пружина на CSS-свойстве `scale`, пишется прямо в элемент (без рендера React на каждый кадр).
    useEffect(() => {
      const el = innerRef.current;
      const s = spring.current;
      if (!el) return;
      s.t = scaleTarget;
      const write = (v: number) => {
        s.x = v;
        el.style.scale = v === 1 ? "" : String(v);
      };
      const reduced =
        typeof matchMedia === "function" &&
        matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        s.v = 0;
        if (s.x !== scaleTarget) write(scaleTarget);
        return;
      }
      if (s.raf) return; // a running loop picks up the new target / работающий цикл подхватит новую цель
      if (Math.abs(s.x - s.t) < 0.0004 && s.v === 0) return;
      s.last = performance.now();
      const step = (now: number) => {
        // The timestamp of requestAnimationFrame can be earlier than `performance.now()` taken when the
        // loop started, so the first step may be negative: never go back in time.
        // Метка времени requestAnimationFrame может быть раньше `performance.now()` в момент запуска цикла,
        // и первый шаг выйдет отрицательным: назад во времени не идём.
        const dt = Math.max(0, Math.min(0.032, (now - s.last) / 1000));
        s.last = now;
        const { stiffness: k, bounce: b } = springCfg.current;
        // bounce 0 is critical damping, 1 is a very light damping
        // bounce 0 — критическое затухание, 1 — очень слабое
        const c = 2 * Math.sqrt(k) * (1 - 0.88 * b);
        const n = Math.max(1, Math.ceil(dt / 0.004));
        const h = dt / n;
        for (let i = 0; i < n; i++) {
          s.v += (-k * (s.x - s.t) - c * s.v) * h;
          s.x += s.v * h;
        }
        if (Math.abs(s.x - s.t) < 0.0004 && Math.abs(s.v) < 0.004) {
          s.v = 0;
          s.raf = 0;
          write(s.t);
          return;
        }
        write(s.x);
        s.raf = requestAnimationFrame(step);
      };
      s.raf = requestAnimationFrame(step);
    }, [scaleTarget]);

    useEffect(
      () => () => {
        cancelAnimationFrame(spring.current.raf);
        spring.current.raf = 0;
      },
      [],
    );

    // Pointer position inside the panel, in its own (unscaled) px. Written to CSS variables directly.
    // Положение указателя внутри панели в её собственных px (без учёта масштаба). Пишется прямо в CSS-переменные.
    const trackPointer = (e: { clientX: number; clientY: number }) => {
      const el = innerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const k = r.width / (el.offsetWidth || 1) || 1;
      el.style.setProperty("--fg-pointer-x", `${(e.clientX - r.left) / k}px`);
      el.style.setProperty("--fg-pointer-y", `${(e.clientY - r.top) / k}px`);
    };

    const handlePointerEnter = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (o.interactive && e.pointerType !== "touch") {
        setHovered(true);
        trackPointer(e);
      }
      onPointerEnter?.(e);
    };
    const handlePointerLeave = (e: ReactPointerEvent<HTMLDivElement>) => {
      setHovered(false);
      onPointerLeave?.(e);
    };
    const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (o.interactive) trackPointer(e);
      onPointerMove?.(e);
    };
    const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (o.interactive) {
        setPressed(true);
        trackPointer(e);
        // Release is listened to on window, so letting go outside the panel still ends the press.
        // Отпускание слушаем на window, чтобы нажатие заканчивалось и за пределами панели.
        const up = () => {
          setPressed(false);
          window.removeEventListener("pointerup", up);
          window.removeEventListener("pointercancel", up);
        };
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", up);
      }
      onPointerDown?.(e);
    };

    const glowActive = o.interactive && (hovered || pressed);
    const glowLevel = !o.interactive
      ? 0
      : pressed
        ? o.glowPress
        : hovered
          ? o.glowHover
          : 0;
    const glowAt = "var(--fg-pointer-x, 50%) var(--fg-pointer-y, 50%)";
    const glowFade = `opacity ${glowActive ? 120 : 450}ms ease-out`;

    // The blur is one CSS string for every browser; the prefix is for Safari. Without backdrop-filter the
    // panel gets a plain fill instead.
    // Размытие это одна CSS-строка для всех браузеров; префикс нужен Safari. Без backdrop-filter панель
    // получает обычную заливку.
    const backdrop = backdropOk
      ? `blur(${o.blur}px) saturate(${o.saturation})`
      : undefined;

    // `tintOpacity` replaces the alpha of the tint colour (relative colour syntax).
    // `tintOpacity` заменяет прозрачность цвета стекла (синтаксис относительных цветов).
    const background = !backdropOk
      ? o.fallbackTint
      : o.tintOpacity === undefined
        ? o.tint
        : `rgb(from ${o.tint} r g b / ${o.tintOpacity})`;

    // The root carries the tint and the backdrop filter; `style` from the caller wins over all of it.
    // Корень несёт заливку и backdrop-filter; `style` от вызывающего перекрывает всё это.
    const rootStyle: CSSProperties = {
      position: "relative",
      isolation: "isolate",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      verticalAlign: "middle",
      boxSizing: "border-box",
      width: o.width,
      height: o.height,
      borderRadius: o.radius,
      backgroundColor: background,
      backdropFilter: backdrop,
      WebkitBackdropFilter: backdrop,
      ...style,
    };

    // Edge layers. The highlight always lies above the shade (it is rendered after it).
    // Слои края. Блик всегда лежит поверх тени (он отрисовывается после неё).
    const shadeLayer =
      o.edgeShadowOpacity > 0 ? (
        <div
          key="shade"
          aria-hidden="true"
          style={{ ...OVERLAY_STYLE, boxShadow: edge.shade, opacity: o.edgeShadowOpacity }}
        />
      ) : null;
    const rimLayer =
      o.specularOpacity > 0 ? (
        <div
          key="rim"
          aria-hidden="true"
          style={{ ...OVERLAY_STYLE, boxShadow: edge.rim, opacity: o.specularOpacity }}
        />
      ) : null;

    return (
      <div
        ref={setRefs}
        style={rootStyle}
        data-glass-hovered={hovered ? "" : undefined}
        data-glass-pressed={pressed ? "" : undefined}
        {...rest}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
      >
        {/* Edge shade and highlight. / Тень и блик по краю. */}
        {shadeLayer}
        {rimLayer}

        {/* Glow spot under the pointer. / Пятно свечения под указателем. */}
        {o.interactive && (
          <div
            aria-hidden="true"
            style={{
              ...OVERLAY_STYLE,
              backgroundImage: `radial-gradient(circle ${o.glowSize}px at ${glowAt}, color-mix(in srgb, ${o.glowColor} 55%, transparent) 0%, color-mix(in srgb, ${o.glowColor} 20%, transparent) 45%, transparent 100%)`,
              opacity: glowLevel,
              transition: glowFade,
            }}
          />
        )}
        {/* Lit edge, strongest near the pointer. / Подсвеченный край, ярче всего возле указателя. */}
        {o.interactive && (
          <div
            aria-hidden="true"
            style={{
              ...OVERLAY_STYLE,
              boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${o.glowColor} 90%, transparent), inset 0 0 14px color-mix(in srgb, ${o.glowColor} 50%, transparent)`,
              WebkitMaskImage: `radial-gradient(circle ${o.glowSize}px at ${glowAt}, #000, transparent)`,
              maskImage: `radial-gradient(circle ${o.glowSize}px at ${glowAt}, #000, transparent)`,
              opacity: glowLevel * o.glowEdge,
              transition: glowFade,
            }}
          />
        )}
        {children}
      </div>
    );
  },
);
