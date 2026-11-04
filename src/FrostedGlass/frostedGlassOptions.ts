/**
 * Options of FrostedGlass, their defaults and the table of CSS tokens.
 * Every option can also be set with a CSS variable `--fg-*`; the table at the bottom lists them all.
 *
 * Параметры FrostedGlass, их значения по умолчанию и таблица CSS-токенов.
 * Любой параметр можно задать и CSS-переменной `--fg-*`; полный список в таблице внизу файла.
 */

/**
 * Visual parameters of the glass. Every one is optional, the defaults are in FROSTED_GLASS_DEFAULTS.
 * A CSS token `--fg-*` set on the element or on any ancestor wins over the prop.
 *
 * Визуальные параметры стекла. Все необязательные, значения по умолчанию лежат в FROSTED_GLASS_DEFAULTS.
 * CSS-токен `--fg-*`, заданный на самом элементе или на любом предке, главнее пропса.
 */
export interface FrostedGlassOptions {
  // ---- Size / Размер ----

  /**
   * Panel width: a number in px or any CSS size. 'auto' sizes by content. Token: --fg-width (a length).
   * Ширина панели: число в px или любой CSS-размер. 'auto' берёт размер по содержимому. Токен: --fg-width (длина).
   */
  width?: number | string;
  /**
   * Panel height: a number in px or any CSS size. 'auto' sizes by content. Token: --fg-height (a length).
   * Высота панели: число в px или любой CSS-размер. 'auto' берёт размер по содержимому. Токен: --fg-height (длина).
   */
  height?: number | string;
  /**
   * Corner radius in px. A value above half the shorter side gives a pill or a circle. Token: --fg-radius.
   * Радиус углов в px. Значение больше половины короткой стороны даёт «таблетку» или круг. Токен: --fg-radius.
   */
  radius?: number;

  // ---- Blur / Размытие ----

  /**
   * Gaussian blur of the backdrop in px: the frosting itself. Token: --fg-blur (a length).
   * Гауссово размытие фона за стеклом в px: сама «матовость». Токен: --fg-blur (длина).
   */
  blur?: number;
  /**
   * Backdrop saturation multiplier. 1 leaves colours unchanged. Token: --fg-saturation.
   * Множитель насыщенности фона. 1 не меняет цвета. Токен: --fg-saturation.
   */
  saturation?: number;

  // ---- Tint / Цвет стекла ----

  /**
   * Colour of the glass: any CSS colour, 'var(--token)' and color-mix() included. Its own alpha is used
   * unless `tintOpacity` is set. Token: --fg-tint.
   * Цвет стекла: любой CSS-цвет, в том числе 'var(--token)' и color-mix(). Используется его собственная
   * прозрачность, если не задан `tintOpacity`. Токен: --fg-tint.
   */
  tint?: string;
  /**
   * Opacity of the tint, 0..1. When set it replaces the alpha of `tint`. Token: --fg-tint-opacity.
   * Непрозрачность цвета стекла, 0..1. Если задана, заменяет прозрачность `tint`. Токен: --fg-tint-opacity.
   */
  tintOpacity?: number;
  /**
   * Fill used instead of the blur where the browser has no backdrop-filter at all. Token: --fg-fallback-tint.
   * Заливка вместо размытия в браузере, где backdrop-filter нет совсем. Токен: --fg-fallback-tint.
   */
  fallbackTint?: string;

  // ---- Edge shade / Тень по краю ----

  /**
   * Strength of the thin outline and the soft inner shadow along the edge, 0..1. 0 turns it off.
   * Token: --fg-edge-opacity (for example 'var(--edgeShadowOpacity)').
   * Сила тонкого контура и мягкой внутренней тени по краю, 0..1. 0 отключает.
   * Токен: --fg-edge-opacity (например, 'var(--edgeShadowOpacity)').
   */
  edgeShadowOpacity?: number;
  /**
   * Width of the soft inner shadow in px. The outline itself is always about 1.4 px. Token: --fg-edge-width.
   * Ширина мягкой внутренней тени в px. Сам контур всегда около 1.4 px. Токен: --fg-edge-width.
   */
  edgeShadowWidth?: number;
  /**
   * How much the soft shadow depends on the light, 0..1. 0 is an even ring, 1 gives no shadow at all on
   * the side facing the light and a deep one on the opposite side. The outline stays even.
   * Token: --fg-edge-direction.
   * Насколько мягкая тень зависит от света, 0..1. 0 даёт равномерное кольцо, 1 убирает тень на стороне
   * лампы совсем и делает её глубокой на противоположной. Контур остаётся равномерным.
   * Токен: --fg-edge-direction.
   */
  edgeShadowDirection?: number;

  // ---- Highlight / Блик ----

  /**
   * Colour of the edge highlight: any CSS colour or token. Use it for accent buttons.
   * Token: --fg-specular-color.
   * Цвет блика на краю: любой CSS-цвет или токен. Нужен для акцентных кнопок. Токен: --fg-specular-color.
   */
  specularColor?: string;
  /**
   * Brightness of the edge highlight, 0..1. Token: --fg-specular-opacity.
   * Яркость блика на краю, 0..1. Токен: --fg-specular-opacity.
   */
  specularOpacity?: number;
  /**
   * Thickness of the edge highlight in px. Token: --fg-specular-width.
   * Толщина блика на краю в px. Токен: --fg-specular-width.
   */
  specularWidth?: number;
  /**
   * Direction of the light in degrees. 0 is right, 90 is down, -110 is up and to the left.
   * Token: --fg-light-angle (an angle, for example -110deg).
   * Направление света в градусах. 0 вправо, 90 вниз, -110 вверх и влево.
   * Токен: --fg-light-angle (угол, например -110deg).
   */
  specularAngle?: number;

  // ---- Hover and press / Наведение и нажатие ----

  /**
   * Turns on the hover and press effects (glow and a springy scale). Off by default, so a panel used as a
   * plain backdrop stays static; switch it on for buttons, fields and other controls.
   * Token: --fg-effects (0 or 1).
   * Включает эффекты наведения и нажатия (свечение и пружинный масштаб). По умолчанию выключено, поэтому
   * панель-подложка остаётся статичной; включайте для кнопок, полей и других элементов управления.
   * Токен: --fg-effects (0 или 1).
   */
  interactive?: boolean;
  /**
   * Glow opacity on hover, 0..1. Token: --fg-glow-hover.
   * Яркость свечения при наведении, 0..1. Токен: --fg-glow-hover.
   */
  glowHover?: number;
  /**
   * Glow opacity while pressed, 0..1. Token: --fg-glow-press.
   * Яркость свечения при нажатии, 0..1. Токен: --fg-glow-press.
   */
  glowPress?: number;
  /**
   * Strength of the lit edge, 0..1: a multiplier of the glow level. Token: --fg-glow-edge.
   * Сила подсвеченного края, 0..1: множитель уровня свечения. Токен: --fg-glow-edge.
   */
  glowEdge?: number;
  /**
   * Radius of the glow spot in px. Token: --fg-glow-size.
   * Радиус пятна свечения в px. Токен: --fg-glow-size.
   */
  glowSize?: number;
  /**
   * Glow colour: any CSS colour or token. Token: --fg-glow-color.
   * Цвет свечения: любой CSS-цвет или токен. Токен: --fg-glow-color.
   */
  glowColor?: string;
  /**
   * Scale while hovered. 1 means no change. Applied with a spring. Token: --fg-hover-scale.
   * Масштаб при наведении. 1 означает «без изменений». Применяется пружиной. Токен: --fg-hover-scale.
   */
  hoverScale?: number;
  /**
   * Scale while pressed, for example 1.06. Applied with a spring, so it overshoots on release.
   * Token: --fg-press-scale.
   * Масштаб при нажатии, например 1.06. Применяется пружиной, поэтому при отпускании есть перелёт.
   * Токен: --fg-press-scale.
   */
  pressScale?: number;
  /**
   * Springiness 0..1. 0 settles without overshoot, 1 swings several times. Token: --fg-bounce.
   * Упругость 0..1. 0 возвращается без перелёта, 1 колеблется несколько раз. Токен: --fg-bounce.
   */
  bounce?: number;
  /**
   * Stiffness of the spring. Higher is faster (roughly 100 slow, 300 normal, 600 snappy).
   * Token: --fg-stiffness.
   * Жёсткость пружины. Чем больше, тем быстрее (примерно 100 медленно, 300 обычно, 600 резко).
   * Токен: --fg-stiffness.
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
export const FROSTED_GLASS_DEFAULTS = {
  width: 320,
  height: 160,
  radius: 9999,
  blur: 20,
  saturation: 1.4,
  tint: "rgba(255, 255, 255, 0)",
  fallbackTint: "rgba(255, 255, 255, 0.55)",
  edgeShadowOpacity: 0.35,
  edgeShadowWidth: 8,
  edgeShadowDirection: 0.65,
  specularColor: "#ffffff",
  specularOpacity: 0.6,
  specularWidth: 2,
  specularAngle: -110,
  interactive: false,
  glowHover: 0.25,
  glowPress: 0.6,
  glowEdge: 1,
  glowSize: 160,
  glowColor: "#ffffff",
  hoverScale: 1,
  pressScale: 1.06,
  bounce: 0.6,
  stiffness: 300,
} as const satisfies Required<Omit<FrostedGlassOptions, "tintOpacity">>;

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
  key: keyof FrostedGlassOptions;
  /** CSS custom property. / CSS-переменная. */
  token: `--fg-${string}`;
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
export const FROSTED_GLASS_TOKENS: readonly TokenDef[] = [
  { key: "width", token: "--fg-width", kind: "length", min: 0, max: 5000 },
  { key: "height", token: "--fg-height", kind: "length", min: 0, max: 5000 },
  { key: "radius", token: "--fg-radius", kind: "length", min: 0, max: 9999 },
  { key: "blur", token: "--fg-blur", kind: "length", min: 0, max: 100 },
  { key: "saturation", token: "--fg-saturation", kind: "number", min: 0, max: 5 },
  { key: "tint", token: "--fg-tint", kind: "color" },
  { key: "fallbackTint", token: "--fg-fallback-tint", kind: "color" },
  { key: "tintOpacity", token: "--fg-tint-opacity", kind: "number", min: 0, max: 1 },
  { key: "edgeShadowOpacity", token: "--fg-edge-opacity", kind: "number", min: 0, max: 1 },
  { key: "edgeShadowWidth", token: "--fg-edge-width", kind: "length", min: 1, max: 80 },
  { key: "edgeShadowDirection", token: "--fg-edge-direction", kind: "number", min: 0, max: 1 },
  { key: "specularColor", token: "--fg-specular-color", kind: "color" },
  { key: "specularOpacity", token: "--fg-specular-opacity", kind: "number", min: 0, max: 1 },
  { key: "specularWidth", token: "--fg-specular-width", kind: "length", min: 0.5, max: 30 },
  { key: "specularAngle", token: "--fg-light-angle", kind: "angle", min: -720, max: 720 },
  { key: "interactive", token: "--fg-effects", kind: "bool" },
  { key: "glowHover", token: "--fg-glow-hover", kind: "number", min: 0, max: 1 },
  { key: "glowPress", token: "--fg-glow-press", kind: "number", min: 0, max: 1 },
  { key: "glowEdge", token: "--fg-glow-edge", kind: "number", min: 0, max: 1 },
  { key: "glowSize", token: "--fg-glow-size", kind: "length", min: 10, max: 1200 },
  { key: "glowColor", token: "--fg-glow-color", kind: "color" },
  { key: "hoverScale", token: "--fg-hover-scale", kind: "number", min: 0.5, max: 1.5 },
  { key: "pressScale", token: "--fg-press-scale", kind: "number", min: 0.5, max: 1.5 },
  { key: "bounce", token: "--fg-bounce", kind: "number", min: 0, max: 1 },
  { key: "stiffness", token: "--fg-stiffness", kind: "number", min: 20, max: 2000 },
];

/**
 * Values read from the tokens. Only the tokens that are set are present.
 * Значения, прочитанные из токенов. Присутствуют только заданные токены.
 */
export type TokenValues = {
  [K in keyof FrostedGlassOptions]?: FrostedGlassOptions[K];
};

/**
 * Options after merging: token, then prop, then default.
 * Параметры после слияния: токен, затем пропс, затем значение по умолчанию.
 */
export type ResolvedOptions = Required<Omit<FrostedGlassOptions, "tintOpacity" | "width" | "height">> & {
  width: number | string;
  height: number | string;
  tintOpacity: number | undefined;
};

/**
 * Merges tokens, props and defaults. A token wins over a prop, a prop wins over the default.
 * Сливает токены, пропсы и значения по умолчанию. Токен главнее пропса, пропс главнее значения по умолчанию.
 */
export function resolveOptions(
  props: FrostedGlassOptions,
  tokens: TokenValues,
): ResolvedOptions {
  const out: Record<string, unknown> = {};
  const keys = Object.keys(FROSTED_GLASS_DEFAULTS) as (keyof typeof FROSTED_GLASS_DEFAULTS)[];
  for (const key of keys) {
    out[key] = tokens[key] ?? props[key] ?? FROSTED_GLASS_DEFAULTS[key];
  }
  out.tintOpacity = tokens.tintOpacity ?? props.tintOpacity;
  return out as ResolvedOptions;
}
