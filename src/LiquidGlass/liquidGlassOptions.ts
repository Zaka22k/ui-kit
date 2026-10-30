/**
 * Options of LiquidGlass, their defaults and the table of CSS tokens.
 * Every option can also be set with a CSS variable `--lg-*`; the table at the bottom lists them all.
 *
 * Параметры LiquidGlass, их значения по умолчанию и таблица CSS-токенов.
 * Любой параметр можно задать и CSS-переменной `--lg-*`; полный список в таблице внизу файла.
 */

/**
 * Visual parameters of the glass. Every one is optional, the defaults are in LIQUID_GLASS_DEFAULTS.
 * A CSS token `--lg-*` set on the element or on any ancestor wins over the prop.
 *
 * Визуальные параметры стекла. Все необязательные, значения по умолчанию лежат в LIQUID_GLASS_DEFAULTS.
 * CSS-токен `--lg-*`, заданный на самом элементе или на любом предке, главнее пропса.
 */
export interface LiquidGlassOptions {
  // ---- Size / Размер ----

  /**
   * Panel width: a number in px or any CSS size. 'auto' sizes by content. Token: --lg-width (a length).
   * Ширина панели: число в px или любой CSS-размер. 'auto' берёт размер по содержимому. Токен: --lg-width (длина).
   */
  width?: number | string;
  /**
   * Panel height: a number in px or any CSS size. 'auto' sizes by content. Token: --lg-height (a length).
   * Высота панели: число в px или любой CSS-размер. 'auto' берёт размер по содержимому. Токен: --lg-height (длина).
   */
  height?: number | string;
  /**
   * Corner radius in px. A value above half the shorter side gives a pill or a circle. Token: --lg-radius.
   * Радиус углов в px. Значение больше половины короткой стороны даёт «таблетку» или круг. Токен: --lg-radius.
   */
  radius?: number;

  // ---- Refraction / Преломление ----

  /**
   * Bezel width in px: the zone along the edge where light is refracted. Token: --lg-bezel.
   * Ширина кромки в px: зона у края, где свет преломляется. Токен: --lg-bezel.
   */
  bezel?: number;
  /**
   * Glass height in px above the background. Larger values refract more. Token: --lg-glass-height.
   * Высота стекла над фоном в px. Чем больше, тем сильнее преломление. Токен: --lg-glass-height.
   */
  glassHeight?: number;
  /**
   * Refractive index n. 1 means no refraction, 1.5 is ordinary glass. Token: --lg-ior.
   * Показатель преломления n. 1 означает «без преломления», 1.5 соответствует обычному стеклу. Токен: --lg-ior.
   */
  ior?: number;
  /**
   * Multiplier of the displacement scale. 0 turns refraction off. Token: --lg-strength.
   * Множитель смещения. 0 отключает преломление. Токен: --lg-strength.
   */
  strength?: number;
  /**
   * Gaussian blur of the backdrop in px. Token: --lg-blur.
   * Гауссово размытие фона за стеклом в px. Токен: --lg-blur.
   */
  blur?: number;
  /**
   * Backdrop saturation multiplier. 1 leaves colours unchanged. Token: --lg-saturation.
   * Множитель насыщенности фона. 1 не меняет цвета. Токен: --lg-saturation.
   */
  saturation?: number;
  /**
   * Blur in px used where SVG backdrop filters are not supported (everything except Chromium).
   * Token: --lg-fallback-blur.
   * Размытие в px там, где SVG-фильтр в backdrop-filter не поддерживается (всё, кроме Chromium).
   * Токен: --lg-fallback-blur.
   */
  fallbackBlur?: number;

  // ---- Tint / Цвет стекла ----

  /**
   * Colour of the glass: any CSS colour, 'var(--token)' and color-mix() included. Its own alpha is used
   * unless `tintOpacity` is set. Token: --lg-tint.
   * Цвет стекла: любой CSS-цвет, в том числе 'var(--token)' и color-mix(). Используется его собственная
   * прозрачность, если не задан `tintOpacity`. Токен: --lg-tint.
   */
  tint?: string;
  /**
   * Opacity of the tint, 0..1. When set it replaces the alpha of `tint`. Token: --lg-tint-opacity.
   * Непрозрачность цвета стекла, 0..1. Если задана, заменяет прозрачность `tint`. Токен: --lg-tint-opacity.
   */
  tintOpacity?: number;

  // ---- Edge shade / Тень по краю ----

  /**
   * Strength of the thin outline and the soft inner shadow along the edge, 0..1. 0 turns it off.
   * Token: --lg-edge-opacity (for example 'var(--edgeShadowOpacity)').
   * Сила тонкого контура и мягкой внутренней тени по краю, 0..1. 0 отключает.
   * Токен: --lg-edge-opacity (например, 'var(--edgeShadowOpacity)').
   */
  edgeShadowOpacity?: number;
  /**
   * Width of the soft inner shadow in px. The outline itself is always about 1.4 px. Token: --lg-edge-width.
   * Ширина мягкой внутренней тени в px. Сам контур всегда около 1.4 px. Токен: --lg-edge-width.
   */
  edgeShadowWidth?: number;
  /**
   * How much the soft shadow depends on the light, 0..1. 0 is an even ring, 1 gives no shadow at all on
   * the side facing the light and a deep one on the opposite side. The outline stays even.
   * Token: --lg-edge-direction.
   * Насколько мягкая тень зависит от света, 0..1. 0 даёт равномерное кольцо, 1 убирает тень на стороне
   * лампы совсем и делает её глубокой на противоположной. Контур остаётся равномерным.
   * Токен: --lg-edge-direction.
   */
  edgeShadowDirection?: number;
  /**
   * Draw the highlight above the edge shade (true) or under it (false). Above, the highlight brightens
   * the inner slope of the shade, so the glass stays alive on a light background.
   * Token: --lg-specular-over-shade (0 or 1).
   * Рисовать блик поверх тени по краю (true) или под ней (false). Поверх блик высветляет внутренний склон
   * тени, и стекло остаётся живым на светлом фоне. Токен: --lg-specular-over-shade (0 или 1).
   */
  specularOverShade?: boolean;

  // ---- Highlight / Блик ----

  /**
   * Colour of the edge highlight: any CSS colour or token. Use it for accent buttons.
   * Token: --lg-specular-color.
   * Цвет блика на краю: любой CSS-цвет или токен. Нужен для акцентных кнопок. Токен: --lg-specular-color.
   */
  specularColor?: string;
  /**
   * Brightness of the edge highlight, 0..1. Token: --lg-specular-opacity.
   * Яркость блика на краю, 0..1. Токен: --lg-specular-opacity.
   */
  specularOpacity?: number;
  /**
   * Thickness of the edge highlight in px. Token: --lg-specular-width.
   * Толщина блика на краю в px. Токен: --lg-specular-width.
   */
  specularWidth?: number;
  /**
   * Direction of the light in degrees. 0 is right, 90 is down, -110 is up and to the left.
   * Token: --lg-light-angle (an angle, for example -110deg).
   * Направление света в градусах. 0 вправо, 90 вниз, -110 вверх и влево.
   * Токен: --lg-light-angle (угол, например -110deg).
   */
  specularAngle?: number;

  // ---- Hover and press / Наведение и нажатие ----

  /**
   * Turns on the hover and press effects (glow and a springy scale). Off by default, so a panel used as a
   * plain backdrop stays static; switch it on for buttons, fields and other controls.
   * Token: --lg-effects (0 or 1).
   * Включает эффекты наведения и нажатия (свечение и пружинный масштаб). По умолчанию выключено, поэтому
   * панель-подложка остаётся статичной; включайте для кнопок, полей и других элементов управления.
   * Токен: --lg-effects (0 или 1).
   */
  interactive?: boolean;
  /**
   * Glow opacity on hover, 0..1. Token: --lg-glow-hover.
   * Яркость свечения при наведении, 0..1. Токен: --lg-glow-hover.
   */
  glowHover?: number;
  /**
   * Glow opacity while pressed, 0..1. Token: --lg-glow-press.
   * Яркость свечения при нажатии, 0..1. Токен: --lg-glow-press.
   */
  glowPress?: number;
  /**
   * Strength of the lit edge, 0..1: a multiplier of the glow level. Token: --lg-glow-edge.
   * Сила подсвеченного края, 0..1: множитель уровня свечения. Токен: --lg-glow-edge.
   */
  glowEdge?: number;
  /**
   * Radius of the glow spot in px. Token: --lg-glow-size.
   * Радиус пятна свечения в px. Токен: --lg-glow-size.
   */
  glowSize?: number;
  /**
   * Glow colour: any CSS colour or token. Token: --lg-glow-color.
   * Цвет свечения: любой CSS-цвет или токен. Токен: --lg-glow-color.
   */
  glowColor?: string;
  /**
   * The glow follows the pointer. When false it sits in the centre of the panel. Token: --lg-glow-follow (0 or 1).
   * Свечение следует за указателем. Если false, оно находится в центре панели. Токен: --lg-glow-follow (0 или 1).
   */
  glowFollow?: boolean;
  /**
   * Scale while hovered. 1 means no change. Applied with a spring. Token: --lg-hover-scale.
   * Масштаб при наведении. 1 означает «без изменений». Применяется пружиной. Токен: --lg-hover-scale.
   */
  hoverScale?: number;
  /**
   * Scale while pressed, for example 1.06. Applied with a spring, so it overshoots on release.
   * Token: --lg-press-scale.
   * Масштаб при нажатии, например 1.06. Применяется пружиной, поэтому при отпускании есть перелёт.
   * Токен: --lg-press-scale.
   */
  pressScale?: number;
  /**
   * Springiness 0..1. 0 settles without overshoot, 1 swings several times. Token: --lg-bounce.
   * Упругость 0..1. 0 возвращается без перелёта, 1 колеблется несколько раз. Токен: --lg-bounce.
   */
  bounce?: number;
  /**
   * Stiffness of the spring. Higher is faster (roughly 100 slow, 300 normal, 600 snappy).
   * Token: --lg-stiffness.
   * Жёсткость пружины. Чем больше, тем быстрее (примерно 100 медленно, 300 обычно, 600 резко).
   * Токен: --lg-stiffness.
   */
  stiffness?: number;
}

/**
 * The only place with base settings. Every option falls back to the value here.
 * `tintOpacity` has no default: without it the alpha of `tint` is used.
 *
 * Единственное место с базовыми настройками. Любой параметр берёт значение отсюда, если не передан.
 * У `tintOpacity` значения по умолчанию нет: без него используется прозрачность `tint`.
 */
export const LIQUID_GLASS_DEFAULTS = {
  width: 320,
  height: 160,
  radius: 9999,
  bezel: 30,
  glassHeight: 50,
  ior: 1.5,
  strength: 1,
  blur: 0.25,
  saturation: 1.4,
  fallbackBlur: 24,
  tint: "rgba(255, 255, 255, 0)",
  edgeShadowOpacity: 0.15,
  edgeShadowWidth: 10,
  edgeShadowDirection: 0.65,
  specularOverShade: true,
  specularColor: "#ffffff",
  specularOpacity: 0.45,
  specularWidth: 2,
  specularAngle: -110,
  interactive: false,
  glowHover: 0.25,
  glowPress: 0.6,
  glowEdge: 1,
  glowSize: 160,
  glowColor: "#ffffff",
  glowFollow: true,
  hoverScale: 1,
  pressScale: 1.06,
  bounce: 0.6,
  stiffness: 300,
} as const satisfies Required<Omit<LiquidGlassOptions, "tintOpacity">>;

/**
 * Type of a token. It decides how the value is checked and read.
 * Тип токена. От него зависит, как значение проверяется и читается.
 */
export type TokenKind = "number" | "length" | "angle" | "bool" | "color";

/**
 * One CSS token: the option it controls, its name, its type and the allowed range.
 * Один CSS-токен: параметр, которым он управляет, имя, тип и допустимый диапазон.
 */
export interface TokenDef {
  /** Option name. / Имя параметра. */
  key: keyof LiquidGlassOptions;
  /** CSS custom property. / CSS-переменная. */
  token: `--lg-${string}`;
  kind: TokenKind;
  /** Values outside [min, max] are clamped. / Значения вне [min, max] ограничиваются. */
  min?: number;
  max?: number;
}

/**
 * All tokens. `bool` tokens take 0 or 1, `length` tokens any CSS length (calc(), rem and var() included),
 * `color` tokens any CSS colour (color-mix() included).
 *
 * Все токены. Токены `bool` принимают 0 или 1, `length` любую CSS-длину (в том числе calc(), rem и var()),
 * `color` любой CSS-цвет (в том числе color-mix()).
 */
export const LIQUID_GLASS_TOKENS: readonly TokenDef[] = [
  { key: "width", token: "--lg-width", kind: "length", min: 0, max: 5000 },
  { key: "height", token: "--lg-height", kind: "length", min: 0, max: 5000 },
  { key: "radius", token: "--lg-radius", kind: "length", min: 0, max: 9999 },
  { key: "bezel", token: "--lg-bezel", kind: "length", min: 1, max: 300 },
  {
    key: "glassHeight",
    token: "--lg-glass-height",
    kind: "length",
    min: 0,
    max: 400,
  },
  { key: "ior", token: "--lg-ior", kind: "number", min: 1, max: 3 },
  { key: "strength", token: "--lg-strength", kind: "number", min: 0, max: 3 },
  { key: "blur", token: "--lg-blur", kind: "length", min: 0, max: 40 },
  {
    key: "saturation",
    token: "--lg-saturation",
    kind: "number",
    min: 0,
    max: 5,
  },
  {
    key: "fallbackBlur",
    token: "--lg-fallback-blur",
    kind: "length",
    min: 0,
    max: 100,
  },
  { key: "tint", token: "--lg-tint", kind: "color" },
  {
    key: "tintOpacity",
    token: "--lg-tint-opacity",
    kind: "number",
    min: 0,
    max: 1,
  },
  {
    key: "edgeShadowOpacity",
    token: "--lg-edge-opacity",
    kind: "number",
    min: 0,
    max: 1,
  },
  {
    key: "edgeShadowWidth",
    token: "--lg-edge-width",
    kind: "length",
    min: 1,
    max: 80,
  },
  {
    key: "edgeShadowDirection",
    token: "--lg-edge-direction",
    kind: "number",
    min: 0,
    max: 1,
  },
  { key: "specularOverShade", token: "--lg-specular-over-shade", kind: "bool" },
  { key: "specularColor", token: "--lg-specular-color", kind: "color" },
  {
    key: "specularOpacity",
    token: "--lg-specular-opacity",
    kind: "number",
    min: 0,
    max: 1,
  },
  {
    key: "specularWidth",
    token: "--lg-specular-width",
    kind: "length",
    min: 0.5,
    max: 30,
  },
  {
    key: "specularAngle",
    token: "--lg-light-angle",
    kind: "angle",
    min: -720,
    max: 720,
  },
  { key: "interactive", token: "--lg-effects", kind: "bool" },
  {
    key: "glowHover",
    token: "--lg-glow-hover",
    kind: "number",
    min: 0,
    max: 1,
  },
  {
    key: "glowPress",
    token: "--lg-glow-press",
    kind: "number",
    min: 0,
    max: 1,
  },
  { key: "glowEdge", token: "--lg-glow-edge", kind: "number", min: 0, max: 1 },
  {
    key: "glowSize",
    token: "--lg-glow-size",
    kind: "length",
    min: 10,
    max: 1200,
  },
  { key: "glowColor", token: "--lg-glow-color", kind: "color" },
  { key: "glowFollow", token: "--lg-glow-follow", kind: "bool" },
  {
    key: "hoverScale",
    token: "--lg-hover-scale",
    kind: "number",
    min: 0.5,
    max: 1.5,
  },
  {
    key: "pressScale",
    token: "--lg-press-scale",
    kind: "number",
    min: 0.5,
    max: 1.5,
  },
  { key: "bounce", token: "--lg-bounce", kind: "number", min: 0, max: 1 },
  {
    key: "stiffness",
    token: "--lg-stiffness",
    kind: "number",
    min: 20,
    max: 2000,
  },
];

/**
 * Values read from the tokens. Only the tokens that are set are present.
 * Значения, прочитанные из токенов. Присутствуют только заданные токены.
 */
export type TokenValues = {
  [K in keyof LiquidGlassOptions]?: LiquidGlassOptions[K];
};

/**
 * Options after merging: token, then prop, then default.
 * Параметры после слияния: токен, затем пропс, затем значение по умолчанию.
 */
export type ResolvedOptions = Required<
  Omit<LiquidGlassOptions, "tintOpacity" | "width" | "height">
> & {
  width: number | string;
  height: number | string;
  tintOpacity: number | undefined;
};

/**
 * Merges tokens, props and defaults. A token wins over a prop, a prop wins over the default.
 * Сливает токены, пропсы и значения по умолчанию. Токен главнее пропса, пропс главнее значения по умолчанию.
 */
export function resolveOptions(
  props: LiquidGlassOptions,
  tokens: TokenValues,
): ResolvedOptions {
  const out: Record<string, unknown> = {};
  const keys = Object.keys(
    LIQUID_GLASS_DEFAULTS,
  ) as (keyof typeof LIQUID_GLASS_DEFAULTS)[];
  for (const key of keys) {
    out[key] = tokens[key] ?? props[key] ?? LIQUID_GLASS_DEFAULTS[key];
  }
  out.tintOpacity = tokens.tintOpacity ?? props.tintOpacity;
  return out as ResolvedOptions;
}
