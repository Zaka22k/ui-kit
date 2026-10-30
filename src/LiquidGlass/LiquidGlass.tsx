"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  HTMLAttributes,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { createGlassMaps } from "./liquidGlassMath";
import { resolveOptions } from "./liquidGlassOptions";
import type { LiquidGlassOptions } from "./liquidGlassOptions";
import {
  useIsomorphicLayoutEffect,
  useLiquidGlassTokens,
} from "./liquidGlassTokens";

/**
 * Props of LiquidGlass: all glass options plus any native div attribute.
 * Пропсы LiquidGlass: все параметры стекла и любые атрибуты div.
 */
export interface LiquidGlassProps
  extends LiquidGlassOptions, Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children?: ReactNode;
}

/**
 * Chromium is the only engine that accepts an SVG filter in backdrop-filter.
 * Chromium — единственный движок, который принимает SVG-фильтр в backdrop-filter.
 */
function supportsSvgBackdropFilter(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // On iOS every browser runs on WebKit, where url(#filter) in backdrop-filter does not work.
  // На iOS все браузеры используют движок WebKit, где url(#filter) в backdrop-filter не работает.
  if (/CriOS|FxiOS|EdgiOS|OPiOS|iPhone|iPad|iPod/.test(ua)) return false;
  return /Chrome\/|Chromium\/|Edg\//.test(ua);
}

/**
 * Short string hash (djb2) for the filter id.
 * Короткий хеш строки (djb2) для id фильтра.
 */
function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/**
 * Measured box of the panel: size and the corner radius that is really drawn.
 * Замеренный прямоугольник панели: размер и радиус углов, который реально нарисован.
 */
interface Box {
  w: number;
  h: number;
  r: number;
}

/**
 * Reads the size and the drawn radius from the element, so a radius set by `style`, a class or a
 * token is respected. The first value of border-radius is used, a percentage is taken of the width.
 * Читает размер и нарисованный радиус из элемента, поэтому радиус из `style`, класса или токена
 * учитывается. Берётся первое значение border-radius, проценты считаются от ширины.
 */
function measureBox(el: HTMLElement): Box {
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const first = getComputedStyle(el).borderTopLeftRadius.split(" ")[0] ?? "0";
  let r = parseFloat(first) || 0;
  if (first.endsWith("%")) r = (r / 100) * w;
  return { w, h, r: Math.round(r * 100) / 100 };
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
 * Style of a layer whose shape comes from a mask image; colour and opacity are plain CSS.
 * Стиль слоя, форма которого берётся из маски; цвет и непрозрачность обычные CSS.
 */
const maskLayer = (url: string): CSSProperties => ({
  ...OVERLAY_STYLE,
  WebkitMaskImage: `url(${url})`,
  maskImage: `url(${url})`,
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
});

/**
 * A panel that refracts whatever is behind it, like Apple's Liquid Glass.
 *
 * Refraction is an SVG displacement filter used as a backdrop-filter (Chromium only, other browsers
 * get a plain blur). The edge highlight and the edge shade are ordinary layers of the panel itself,
 * so they also show up in browsers without the filter. All maps are built from the measured size
 * and radius, so the panel can have a fixed size, a percentage, or 'auto'.
 *
 * Every option is a prop and also a CSS token `--lg-*`; the token wins. Set tokens in a stylesheet,
 * on a theme root, or in `style`. The list of tokens is LIQUID_GLASS_TOKENS and the README.
 *
 * Панель, которая преломляет то, что находится за ней, как Liquid Glass у Apple.
 *
 * Преломление — это SVG-фильтр смещения в backdrop-filter (только Chromium, остальные браузеры
 * получают обычное размытие). Блик и тень по краю — обычные слои самой панели, поэтому они видны
 * и там, где фильтра нет. Все карты строятся по замеренным размеру и радиусу, поэтому размер может
 * быть фиксированным, в процентах или 'auto'.
 *
 * Каждый параметр — это пропс и одновременно CSS-токен `--lg-*`; токен главнее. Токены задаются в
 * таблице стилей, на корне темы или в `style`. Список токенов: LIQUID_GLASS_TOKENS и README.
 */
export const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(
  function LiquidGlass(
    {
      width,
      height,
      radius,
      bezel,
      glassHeight,
      ior,
      strength,
      blur,
      saturation,
      fallbackBlur,
      tint,
      tintOpacity,
      edgeShadowOpacity,
      edgeShadowWidth,
      edgeShadowDirection,
      specularOverShade,
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
      glowFollow,
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
    const innerRef = useRef<HTMLDivElement | null>(null);
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        innerRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    // Token, then prop, then default. / Токен, затем пропс, затем значение по умолчанию.
    const tokens = useLiquidGlassTokens(innerRef);
    const o = resolveOptions(
      {
        width,
        height,
        radius,
        bezel,
        glassHeight,
        ior,
        strength,
        blur,
        saturation,
        fallbackBlur,
        tint,
        tintOpacity,
        edgeShadowOpacity,
        edgeShadowWidth,
        edgeShadowDirection,
        specularOverShade,
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
        glowFollow,
        hoverScale,
        pressScale,
        bounce,
        stiffness,
      },
      tokens,
    );

    const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const [box, setBox] = useState<Box | null>(null);
    const [svgFilterOk, setSvgFilterOk] = useState(false);

    // Measure the panel after every render (a class or a token may have changed the radius)
    // and on every layout change.
    // Замеряем панель после каждого рендера (класс или токен мог изменить радиус) и при любых
    // изменениях раскладки.
    const measure = useRef(() => {});
    measure.current = () => {
      const el = innerRef.current;
      if (!el) return;
      const next = measureBox(el);
      setBox((prev) =>
        prev && prev.w === next.w && prev.h === next.h && prev.r === next.r
          ? prev
          : next,
      );
    };
    useIsomorphicLayoutEffect(() => {
      measure.current();
    });
    useIsomorphicLayoutEffect(() => {
      setSvgFilterOk(supportsSvgBackdropFilter());
      const el = innerRef.current;
      if (!el || typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(() => measure.current());
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    // Opacities and colours are applied in CSS, so they are not dependencies: changing them does not
    // rebuild the maps.
    // Непрозрачности и цвета применяются через CSS и не входят в зависимости: их смена не пересобирает карты.
    const maps = useMemo(() => {
      if (!box || box.w < 2 || box.h < 2) return null;
      return createGlassMaps({
        width: box.w,
        height: box.h,
        radius: box.r,
        bezel: o.bezel,
        glassHeight: o.glassHeight,
        ior: o.ior,
        strength: o.strength,
        specularAngle: o.specularAngle,
        specularWidth: o.specularWidth,
        edgeShadowWidth: o.edgeShadowWidth,
        edgeShadowDirection: o.edgeShadowDirection,
        refraction: svgFilterOk,
        pixelRatio:
          typeof window === "undefined"
            ? 1
            : Math.min(2, window.devicePixelRatio || 1),
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      svgFilterOk,
      box,
      o.bezel,
      o.glassHeight,
      o.ior,
      o.strength,
      o.specularAngle,
      o.specularWidth,
      o.edgeShadowWidth,
      o.edgeShadowDirection,
    ]);

    // A new id for every new filter makes Chrome re-evaluate the backdrop filter.
    // Новый id у каждого нового фильтра заставляет Chrome заново применить backdrop-filter.
    const filterKey = [
      box?.w,
      box?.h,
      box?.r,
      o.bezel,
      o.glassHeight,
      o.ior,
      o.strength,
      o.blur,
      o.saturation,
    ].join("|");
    const filterId = useMemo(
      () => `lg-${baseId}-${hashString(filterKey)}`,
      [baseId, filterKey],
    );

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
        const dt = Math.min(0.032, (now - s.last) / 1000);
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
      if (!el || !o.glowFollow) return;
      const r = el.getBoundingClientRect();
      const k = r.width / (el.offsetWidth || 1) || 1;
      el.style.setProperty("--lg-pointer-x", `${(e.clientX - r.left) / k}px`);
      el.style.setProperty("--lg-pointer-y", `${(e.clientY - r.top) / k}px`);
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
    const glowAt = o.glowFollow
      ? "var(--lg-pointer-x, 50%) var(--lg-pointer-y, 50%)"
      : "50% 50%";
    const glowFade = `opacity ${glowActive ? 120 : 450}ms ease-out`;

    // Refraction works only in Chromium; elsewhere a plain blur is used.
    // Преломление работает только в Chromium; в остальных браузерах обычное размытие.
    const refracts =
      svgFilterOk &&
      maps !== null &&
      maps.displacementUrl !== "" &&
      box !== null;
    const backdrop = refracts
      ? `url(#${filterId})`
      : `blur(${o.fallbackBlur}px) saturate(${o.saturation})`;

    // `tintOpacity` replaces the alpha of the tint colour (relative colour syntax).
    // `tintOpacity` заменяет прозрачность цвета стекла (синтаксис относительных цветов).
    const background =
      o.tintOpacity === undefined
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

    // Edge layers. The later one lies above the earlier one, `specularOverShade` picks the order.
    // Слои края. Более поздний лежит выше раннего, порядок выбирает `specularOverShade`.
    const shadeLayer =
      maps && o.edgeShadowOpacity > 0 ? (
        <div
          key="shade"
          aria-hidden="true"
          style={{
            ...maskLayer(maps.edgeShadowUrl),
            backgroundColor: "#000",
            opacity: o.edgeShadowOpacity,
          }}
        />
      ) : null;
    const rimLayer =
      maps && o.specularOpacity > 0 ? (
        <div
          key="rim"
          aria-hidden="true"
          style={{
            ...maskLayer(maps.specularUrl),
            backgroundColor: o.specularColor,
            opacity: o.specularOpacity,
          }}
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
        {/* SVG filter: blur, then displacement by the map, then saturation. / SVG-фильтр: размытие, смещение по карте, насыщенность. */}
        {refracts && maps && box && (
          <svg
            aria-hidden="true"
            focusable="false"
            width={0}
            height={0}
            style={{ position: "absolute", pointerEvents: "none" }}
          >
            <filter
              id={filterId}
              filterUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={box.w}
              height={box.h}
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation={o.blur}
                result="blur"
              />
              <feImage
                href={maps.displacementUrl}
                x={0}
                y={0}
                width={box.w}
                height={box.h}
                preserveAspectRatio="none"
                result="map"
              />
              <feDisplacementMap
                in="blur"
                in2="map"
                scale={maps.scale}
                xChannelSelector="R"
                yChannelSelector="G"
                result="disp"
              />
              <feColorMatrix
                in="disp"
                type="saturate"
                values={String(o.saturation)}
              />
            </filter>
          </svg>
        )}

        {/* Edge shade and highlight. / Тень и блик по краю. */}
        {o.specularOverShade ? (
          <>
            {shadeLayer}
            {rimLayer}
          </>
        ) : (
          <>
            {rimLayer}
            {shadeLayer}
          </>
        )}

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
