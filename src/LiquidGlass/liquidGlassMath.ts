/**
 * Liquid Glass math: refraction table, displacement map, specular rim mask and edge shade mask.
 * Pure functions, no React. Based on the approach from
 * https://kube.io/blog/liquid-glass-css-svg/ (the specular rim and the edge shade are our own construction).
 *
 * Математика Liquid Glass: таблица преломления, карта смещений, маска блика и маска тени по краю.
 * Чистые функции, без React. Основано на подходе из статьи
 * https://kube.io/blog/liquid-glass-css-svg/ (блик и тень по краю построены нами самостоятельно).
 */

/**
 * Number of samples along the bezel. 128 matches the 8-bit resolution of the displacement map.
 * Число отсчётов вдоль кромки. 128 соответствует 8-битной точности карты смещений.
 */
export const SAMPLES = 128;

/**
 * Width of the thin outline of the edge shade, in CSS px.
 * Ширина тонкого контура тени по краю, в CSS px.
 */
export const OUTLINE_WIDTH = 1.4;

/**
 * The only height profile f(x): a plano-convex lens with a bevel. x = 0 at the outer edge,
 * x = 1 at the end of the bezel, further in the glass is flat. f(x) = 1 - (1 - x)^3.
 *
 * Единственный профиль высоты f(x): плоско-выпуклая линза с фаской. x = 0 у внешнего края,
 * x = 1 в конце кромки, дальше внутрь стекло плоское. f(x) = 1 - (1 - x)^3.
 */
const bevel = (x: number): number => 1 - Math.pow(1 - x, 3);

/**
 * Numeric derivative of f at x (central difference, clamped to [0, 1]).
 * Численная производная f в точке x (центральная разность, зажатая в [0, 1]).
 */
function derivative(f: (x: number) => number, x: number): number {
  const e = 0.001;
  const lo = Math.max(0, x - e);
  const hi = Math.min(1, x + e);
  return (f(hi) - f(lo)) / (hi - lo);
}

export interface RefractionTable {
  /**
   * Signed displacement in px for each sample. Positive points towards the panel centre.
   * Смещение в px для каждого отсчёта, со знаком. Положительное направлено к центру панели.
   */
  displacement: Float64Array;
  /**
   * Largest absolute displacement in px.
   * Наибольшее по модулю смещение в px.
   */
  maxAbs: number;
}

/**
 * Snell's law along one radius of the bezel. The incoming ray is vertical, the glass height at
 * distance d from the edge is h = H * f(d / B), the surface slope is H * f'(x) / B.
 *
 * Закон Снеллиуса вдоль одного радиуса кромки. Входящий луч вертикален, высота стекла на
 * расстоянии d от края h = H * f(d / B), наклон поверхности H * f'(x) / B.
 */
export function computeRefractionTable(
  bezelWidth: number,
  glassHeight: number,
  ior: number,
): RefractionTable {
  const displacement = new Float64Array(SAMPLES);
  const n = Math.max(1, ior);
  let maxAbs = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const x = i / (SAMPLES - 1);
    const h = glassHeight * bevel(x);
    const slope = (glassHeight * derivative(bevel, x)) / bezelWidth;
    const t1 = Math.atan(Math.abs(slope)); // angle of incidence / угол падения
    const t2 = Math.asin(Math.min(1, Math.sin(t1) / n)); // angle of refraction / угол преломления
    displacement[i] = Math.sign(slope) * h * Math.tan(t1 - t2);
    maxAbs = Math.max(maxAbs, Math.abs(displacement[i]));
  }
  // Below 1e-3 px the map would only be numeric noise (for example at n = 1).
  // Меньше 1e-3 px карта была бы просто численным шумом (например, при n = 1).
  return { displacement, maxAbs: maxAbs < 1e-3 ? 0 : maxAbs };
}

/**
 * Normalised signed displacement in [-1, 1] at x in [0, 1], linearly interpolated.
 * Нормированное смещение со знаком в [-1, 1] в точке x из [0, 1], с линейной интерполяцией.
 */
function lookup(table: RefractionTable, x: number): number {
  if (table.maxAbs === 0) return 0;
  const p = Math.min(1, Math.max(0, x)) * (SAMPLES - 1);
  const i = Math.floor(p);
  const j = Math.min(SAMPLES - 1, i + 1);
  const k = p - i;
  return (
    (table.displacement[i] * (1 - k) + table.displacement[j] * k) / table.maxAbs
  );
}

/**
 * Calls `visit` for every pixel of a rounded rectangle that lies closer to the edge than `depth`.
 * It gets the buffer offset, the distance d from the edge and the outward unit normal (nx, ny).
 * Pixels deeper than `depth` are skipped without any maths, so a large panel costs only its border.
 *
 * Вызывает `visit` для каждого пикселя скруглённого прямоугольника, который ближе к краю, чем `depth`.
 * Передаёт смещение в буфере, расстояние d от края и внешнюю единичную нормаль (nx, ny).
 * Пиксели глубже `depth` пропускаются без вычислений, поэтому большая панель стоит как её рамка.
 */
function walkEdge(
  W: number,
  H: number,
  R: number,
  depth: number,
  visit: (i: number, d: number, nx: number, ny: number) => void,
): void {
  const cx = W / 2;
  const cy = H / 2;
  const hx = W / 2 - R;
  const hy = H / 2 - R;
  for (let y = 0; y < H; y++) {
    const py = y + 0.5 - cy;
    const qy = Math.abs(py) - hy;
    for (let x = 0; x < W; x++) {
      const px = x + 0.5 - cx;
      const qx = Math.abs(px) - hx;
      // Quick rejection of the flat middle. / Быстрое отсечение плоской середины.
      if (qx < -depth && qy < -depth) continue;
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const len = ox > 0 && oy > 0 ? Math.hypot(ox, oy) : ox + oy;
      // Signed distance to the rounded rectangle (negative inside). / Расстояние со знаком (внутри отрицательное).
      const sd = len + Math.min(Math.max(qx, qy), 0) - R;
      if (sd >= 0 || -sd >= depth) continue;
      const sx = px < 0 ? -1 : 1;
      const sy = py < 0 ? -1 : 1;
      let nx: number;
      let ny: number;
      if (qx > 0 && qy > 0 && len > 0) {
        nx = (sx * ox) / len;
        ny = (sy * oy) / len;
      } else if (qx > qy) {
        nx = sx;
        ny = 0;
      } else {
        nx = 0;
        ny = sy;
      }
      visit((y * W + x) * 4, -sd, nx, ny);
    }
  }
}

/**
 * Fills the displacement map: R = x, G = y, 128 = no shift. The middle of the panel stays neutral.
 * Заполняет карту смещений: R = x, G = y, 128 = без сдвига. Середина панели остаётся нейтральной.
 */
function fillDisplacement(
  W: number,
  H: number,
  R: number,
  B: number,
  table: RefractionTable,
  data: Uint8ClampedArray,
): void {
  // 0xFF808080 in little-endian memory is R=128 G=128 B=128 A=255. The constant is built from bytes,
  // so it is right on any endianness. / Константа собрана из байтов, поэтому верна при любом порядке байтов.
  const neutral = new Uint32Array(
    new Uint8ClampedArray([128, 128, 128, 255]).buffer,
  )[0];
  new Uint32Array(data.buffer).fill(neutral);
  walkEdge(W, H, R, B, (i, d, nx, ny) => {
    const m = lookup(table, d / B);
    data[i] = Math.round(128 - nx * m * 127); // inward = -normal / внутрь = -нормаль
    data[i + 1] = Math.round(128 - ny * m * 127);
  });
}

/** Parameters of the edge masks. All lengths are in canvas pixels. / Параметры масок края. Все длины в пикселях канваса. */
interface EdgeMaskOptions {
  width: number;
  height: number;
  radius: number;
  bezel: number;
  specularAngle: number;
  specularWidth: number;
  edgeShadowWidth: number;
  edgeShadowDirection: number;
  outlineWidth: number;
}

/**
 * Fills two alpha masks (their colour and brightness are applied later in CSS):
 *  - specData: the rim highlight, brighter on the side facing the light (white RGB),
 *  - shadeData: a thin uniform outline plus a soft inner shadow that is lighter on the lit side
 *    and deeper on the opposite side (black RGB).
 *
 * Заполняет две маски по альфе (цвет и яркость применяются позже в CSS):
 *  - specData: блик по контуру, ярче со стороны света (RGB белый),
 *  - shadeData: тонкий равномерный контур и мягкая внутренняя тень, светлее со стороны света
 *    и глубже с противоположной (RGB чёрный).
 */
function fillEdgeMasks(
  o: EdgeMaskOptions,
  specData: Uint8ClampedArray,
  shadeData: Uint8ClampedArray,
): void {
  const rimW = o.specularWidth;
  const shadeW = Math.max(1, o.edgeShadowWidth);
  const a = (o.specularAngle * Math.PI) / 180;
  const lx = Math.cos(a);
  const ly = Math.sin(a);
  const depth = Math.max(o.bezel, rimW, shadeW, o.outlineWidth);

  walkEdge(o.width, o.height, o.radius, depth, (i, d, nx, ny) => {
    const edgeAA = Math.min(1, d); // anti-aliasing of the outer pixel / сглаживание крайнего пикселя
    // c > 0: the side that faces the light, c < 0: the side in the shade.
    // c > 0: сторона, обращённая к свету, c < 0: сторона в тени.
    const c = nx * lx + ny * ly;

    // Rim: full strength towards the light, half as bright on the opposite side.
    // Блик: на полную силу к свету, вдвое слабее с противоположной стороны.
    const lit = Math.max(c, 0) + 0.5 * Math.max(-c, 0);
    const t = Math.max(0, 1 - d / rimW);
    const rim = t * t * (3 - 2 * t);
    const wide = 0.18 * Math.pow(Math.max(0, 1 - d / o.bezel), 2);
    const specAlpha = Math.round(
      255 * Math.min(1, lit * Math.min(1, rim + wide) * edgeAA),
    );
    if (specAlpha > 0) {
      specData[i] = 255;
      specData[i + 1] = 255;
      specData[i + 2] = 255;
      specData[i + 3] = specAlpha;
    }

    // Shade: the outline is the same all around, only the soft part depends on the light.
    // Тень: контур одинаков по всему периметру, от света зависит только мягкая часть.
    const outline = Math.max(0, 1 - d / o.outlineWidth);
    const soft =
      Math.pow(Math.max(0, 1 - d / shadeW), 2) *
      (1 - o.edgeShadowDirection * c);
    shadeData[i + 3] = Math.round(
      255 * Math.min(1, outline + 0.4 * soft) * edgeAA,
    );
  });
}

/**
 * Input of createGlassMaps. Lengths are in CSS px.
 * Вход createGlassMaps. Длины в CSS px.
 */
export interface GlassMapOptions {
  /** Panel size in CSS px. / Размер панели в CSS px. */
  width: number;
  height: number;
  /** Corner radius, clamped to half of the shorter side. / Радиус углов, ограничивается половиной короткой стороны. */
  radius: number;
  bezel: number;
  glassHeight: number;
  ior: number;
  strength: number;
  specularAngle: number;
  specularWidth: number;
  /** Width of the soft inner edge shadow in CSS px. / Ширина мягкой внутренней тени в CSS px. */
  edgeShadowWidth: number;
  /** How much the soft shadow depends on the light, 0..1. / Насколько мягкая тень зависит от света, 0..1. */
  edgeShadowDirection: number;
  /**
   * Encode the displacement map. Pass false where SVG backdrop filters are unsupported. Default true.
   * Строить ли карту смещений. Передайте false там, где SVG backdrop-фильтры не поддерживаются. По умолчанию true.
   */
  refraction?: boolean;
  /**
   * Pixel ratio the edge masks are rendered at (1 or 2), so thin lines stay crisp. Default 1.
   * Плотность пикселей, с которой строятся маски края (1 или 2), чтобы тонкие линии оставались чёткими. По умолчанию 1.
   */
  pixelRatio?: number;
}

/**
 * Result of createGlassMaps.
 * Результат createGlassMaps.
 */
export interface GlassMaps {
  /** PNG data URL for feDisplacementMap. Empty string when `refraction` is false. / PNG data URL для feDisplacementMap. Пустая строка, если `refraction` равен false. */
  displacementUrl: string;
  /** PNG data URL, white with alpha, used as a CSS mask of the rim highlight. / PNG data URL, белый с альфой, CSS-маска блика. */
  specularUrl: string;
  /** PNG data URL, black with alpha, used as a CSS mask of the edge shade. / PNG data URL, чёрный с альфой, CSS-маска тени по краю. */
  edgeShadowUrl: string;
  /** Value for feDisplacementMap `scale`. / Значение `scale` для feDisplacementMap. */
  scale: number;
  /** Largest displacement in px, before the strength multiplier. / Наибольшее смещение в px до умножения на strength. */
  maxDisplacement: number;
}

/**
 * Builds the maps on canvas. Returns null on the server or when canvas is unavailable.
 * Строит карты на канвасе. Возвращает null на сервере или когда канвас недоступен.
 */
export function createGlassMaps(o: GlassMapOptions): GlassMaps | null {
  if (typeof document === "undefined") return null;
  const W = Math.round(o.width);
  const H = Math.round(o.height);
  if (W < 2 || H < 2) return null;

  // Clamp the radius and the bezel to what fits into the panel.
  // Ограничиваем радиус и кромку тем, что помещается в панель.
  const R = Math.min(Math.max(0, o.radius), W / 2, H / 2);
  const B = Math.max(1, Math.min(o.bezel, Math.min(W, H) / 2));
  const k = Math.max(1, Math.round(o.pixelRatio ?? 1));

  const paint = (
    w: number,
    h: number,
    fill: (data: Uint8ClampedArray) => void,
  ): string | null => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const img = ctx.createImageData(w, h);
    fill(img.data);
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL("image/png");
  };

  const table = computeRefractionTable(B, o.glassHeight, o.ior);
  const displacementUrl =
    o.refraction === false
      ? ""
      : paint(W, H, (data) => fillDisplacement(W, H, R, B, table, data));
  if (displacementUrl === null) return null;

  // Both masks are drawn into one pass, the buffers are split afterwards.
  // Обе маски считаются за один проход, потом буферы разносятся по двум канвасам.
  const Wk = W * k;
  const Hk = H * k;
  const spec = new Uint8ClampedArray(Wk * Hk * 4);
  const shade = new Uint8ClampedArray(Wk * Hk * 4);
  fillEdgeMasks(
    {
      width: Wk,
      height: Hk,
      radius: R * k,
      bezel: B * k,
      specularAngle: o.specularAngle,
      specularWidth: Math.max(0.5, o.specularWidth) * k,
      edgeShadowWidth: o.edgeShadowWidth * k,
      edgeShadowDirection: Math.min(1, Math.max(0, o.edgeShadowDirection)),
      outlineWidth: OUTLINE_WIDTH * k,
    },
    spec,
    shade,
  );
  const specularUrl = paint(Wk, Hk, (data) => data.set(spec));
  const edgeShadowUrl = paint(Wk, Hk, (data) => data.set(shade));
  if (specularUrl === null || edgeShadowUrl === null) return null;

  return {
    displacementUrl,
    specularUrl,
    edgeShadowUrl,
    // Per the SVG spec the offset is scale * (C - 0.5), so a 0..255 channel spans +-scale/2.
    // По спецификации SVG смещение равно scale * (C - 0.5), поэтому канал 0..255 даёт диапазон ±scale/2.
    scale: ((table.maxAbs * 255) / 127) * o.strength,
    maxDisplacement: table.maxAbs,
  };
}
