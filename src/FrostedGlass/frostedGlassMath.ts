/**
 * Frosted Glass edge shadows: the specular rim and the edge shade as lists of CSS `inset box-shadow`.
 * Pure functions, no React, no canvas, no maps. There is no refraction here: the glass only blurs what is
 * behind it, the blur itself is a plain CSS backdrop-filter.
 *
 * How it works. An inset shadow with an offset along the light direction is thinner on the side facing
 * the light and thicker on the opposite side, so the direction dependence comes from the offset alone, and
 * the shape (radius, pill, circle) comes from the border-radius of the layer. For an edge with the outward
 * normal n and the light l (c = n·l) the border of an inset shadow lies at depth e = spread - offset·n,
 * and its brightness profile is alpha * Phi((e - d) / sigma), sigma = blur / 2.
 * The numbers in EDGE_FIT were fitted to the profiles of the former canvas masks (rim: lit = max(c,0) +
 * 0.5*max(-c,0); shade: an outline 1.4 px plus a soft part (1 - d/w)^2 * (1 - dir*c)).
 *
 * Тени по краю Frosted Glass: блик и тень как списки CSS `inset box-shadow`.
 * Чистые функции, без React, canvas и карт. Преломления здесь нет: стекло только размывает то, что за ним,
 * а само размытие это обычный CSS backdrop-filter.
 *
 * Как это работает. Inset-тень со смещением вдоль света тоньше на стороне лампы и толще на противоположной,
 * поэтому направленность даёт одно смещение, а форму (радиус, «таблетка», круг) берёт border-radius слоя.
 * Для края с внешней нормалью n и светом l (c = n·l) граница inset-тени лежит на глубине
 * e = spread - offset·n, а яркость профиля равна alpha * Phi((e - d) / sigma), sigma = blur / 2.
 * Числа в EDGE_FIT подобраны по профилям прежних масок на canvas (блик: lit = max(c,0) + 0.5*max(-c,0);
 * тень: контур 1.4 px и мягкая часть (1 - d/w)^2 * (1 - dir*c)).
 */

/**
 * One inset shadow. Lengths in CSS px, alpha 0..1. The colour is added by the caller.
 * Одна inset-тень. Длины в CSS px, alpha 0..1. Цвет добавляет вызывающий.
 */
export interface EdgeShadow {
  x: number;
  y: number;
  blur: number;
  spread: number;
  alpha: number;
}

/**
 * Both lists of shadows.
 * Оба списка теней.
 */
export interface EdgeShadows {
  /** Specular rim. / Блик. */
  rim: EdgeShadow[];
  /** Outline and soft inner shadow. / Контур и мягкая внутренняя тень. */
  shade: EdgeShadow[];
}

/**
 * Fitted constants. Rim: `ka`, `kb` set the thickness of the core (ka + kb*c, in units of the rim width),
 * `ks`, `s0` its softness, `a0`, `a1` its alpha; `ga`, `gb`, `gs`, `gl` are the wide glow (thickness
 * ga + gb*c in px, softness, alpha). Shade: `to`, `so`, `ao` is the outline; `p1`, `q1`, `r1`, `r0`, `a0`
 * the soft part (thickness p1*w - q1*dir*w*c, softness r1*w + r0, alpha a0).
 *
 * Подобранные константы. Блик: `ka`, `kb` задают толщину ядра (ka + kb*c в долях ширины блика),
 * `ks`, `s0` его мягкость, `a0`, `a1` прозрачность; `ga`, `gb`, `gs`, `gl` широкое свечение (толщина
 * ga + gb*c в px, мягкость, прозрачность). Тень: `to`, `so`, `ao` контур; `p1`, `q1`, `r1`, `r0`, `a0`
 * мягкая часть (толщина p1*w - q1*dir*w*c, мягкость r1*w + r0, прозрачность a0).
 */
export const EDGE_FIT = {
  rim: { ka: -0.3718, kb: 1.2317, ks: 0.2981, s0: 0.1158, a0: 0.3056, a1: 0.0466, ga: -6.6158, gb: 19.6696, gs: 8.5221, gl: 0.1416 },
  shade: { to: 0.494, so: 0.0792, ao: 0.4456, p1: 0.1896, q1: 0.2938, r1: 0.2991, r0: 0.1163, a0: 0.5321 },
} as const;

/**
 * Builds the shadows of the rim and of the edge shade. `lightDeg`: 0 is right, 90 is down, -110 is up and
 * to the left. `dirK` is the directionality of the soft shadow, 0..1.
 * Строит тени блика и тени по краю. `lightDeg`: 0 вправо, 90 вниз, -110 вверх и влево.
 * `dirK` направленность мягкой тени, 0..1.
 */
export function edgeShadows(
  specularWidth: number,
  edgeShadowWidth: number,
  lightDeg: number,
  dirK: number,
): EdgeShadows {
  const a = (lightDeg * Math.PI) / 180;
  const lx = Math.cos(a);
  const ly = Math.sin(a);
  const W = Math.max(0.5, specularWidth);
  const w = Math.max(1, edgeShadowWidth);
  const dir = Math.min(1, Math.max(0, dirK));
  const R = EDGE_FIT.rim;
  const S = EDGE_FIT.shade;
  const rim: EdgeShadow[] = [];
  const shade: EdgeShadow[] = [];
  // k is the offset along the light in px (negative: towards the lit side).
  // k это смещение вдоль света в px (минус: к стороне лампы).
  const add = (list: EdgeShadow[], k: number, spread: number, blur: number, alpha: number) => {
    if (alpha > 0.002) {
      list.push({ x: lx * k, y: ly * k, blur: Math.max(0, blur), spread, alpha: Math.min(1, alpha) });
    }
  };

  // Rim: a core and a wide glow, each as a pair: the lit side and the opposite side at half strength.
  // Блик: ядро и широкое свечение, каждое парой: сторона лампы и противоположная сторона вполсилы.
  const core = Math.min(1, R.a0 + R.a1 * W);
  const sigma = R.ks * W + R.s0;
  for (const [sign, f] of [[-1, 1], [1, 0.5]] as const) {
    add(rim, sign * R.kb * W, R.ka * W, 2 * sigma, core * f);
    add(rim, sign * R.gb, R.ga, 2 * R.gs, R.gl * f);
  }

  // Shade: a thin outline all around and a soft part shifted towards the light (deeper on the far side).
  // Тень: тонкий контур по всему периметру и мягкая часть, смещённая к лампе (глубже с дальней стороны).
  add(shade, 0, S.to, 2 * S.so, S.ao);
  add(shade, S.q1 * dir * w, S.p1 * w, 2 * (S.r1 * w + S.r0), S.a0);
  return { rim, shade };
}

/**
 * A list of shadows as a `box-shadow` value. `colorOf(alpha)` returns the CSS colour of a shadow.
 * Список теней в виде значения `box-shadow`. `colorOf(alpha)` возвращает CSS-цвет тени.
 */
export function shadowCss(list: readonly EdgeShadow[], colorOf: (alpha: number) => string): string {
  const n = (v: number) => `${+v.toFixed(2)}px`;
  return list
    .map((s) => `inset ${n(s.x)} ${n(s.y)} ${n(s.blur)} ${n(s.spread)} ${colorOf(+s.alpha.toFixed(3))}`)
    .join(", ");
}
