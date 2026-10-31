# LiquidGlass

Панель, которая преломляет то, что лежит за ней. Подходит и как подложка, и как основа для стеклянных кнопок и полей ввода.

Преломление построено на SVG-фильтре `feDisplacementMap` внутри `backdrop-filter`, блик и тень по краю это обычные слои панели.

- Преломление работает только в Chromium (Chrome, Edge, Opera, Android). В остальных браузерах и на iOS панель показывает обычное размытие (`fallbackBlur`), блик и тень по краю видны везде.
- Остался один профиль кромки: плоско-выпуклая линза с фаской. Купола, мениска при нажатии, дисперсии цвета и внешней тени больше нет.

## Файлы

| Файл                     | Что внутри                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| `LiquidGlass.tsx`        | React-компонент                                                                                           |
| `liquidGlassOptions.ts`  | Типы параметров, значения по умолчанию (`LIQUID_GLASS_DEFAULTS`), таблица токенов (`LIQUID_GLASS_TOKENS`) |
| `liquidGlassTokens.ts`   | Чтение токенов `--lg-*` и их слежение за сменой темы                                                      |
| `liquidGlassMath.ts`     | Чистая математика: закон Снеллиуса, карта смещений, маски блика и тени                                    |
| `liquidGlass.tokens.css` | Справочник токенов и примеры (всё закомментировано)                                                       |
| `index.ts`               | Публичные экспорты                                                                                        |

Файл с математикой называется `liquidGlassMath.ts`, а не `liquidGlass.ts`: на Windows и macOS имена `liquidGlass.ts` и `LiquidGlass.tsx` отличаются только регистром и конфликтуют.

## Быстрый старт

```tsx
import { LiquidGlass } from "@ui-kit/components";

// Подложка
<LiquidGlass width={320} height={160} radius={32}>
  Содержимое
</LiquidGlass>

// Кнопка: interactive включает свечение и пружинный масштаб
<LiquidGlass interactive width={160} height={52} radius={26} bezel={18} glassHeight={28}>
  <button type="button">Готово</button>
</LiquidGlass>

// Акцентная кнопка: цвет стекла и блика из токенов дизайн-системы
<LiquidGlass
  interactive
  tint="color-mix(in srgb, var(--AccentFillColorDefaultBrush) 70%, transparent)"
  specularColor="color-mix(in srgb, var(--AccentFillColorDefaultBrush) 25%, white)"
  glowColor="var(--TextOnAccentFillColorPrimaryBrush)"
>
  ...
</LiquidGlass>
```

Размер можно задать числом, любым CSS-размером, `"auto"` или через `style`/класс. Карты строятся по замеренному размеру и по реально нарисованному радиусу, поэтому `style={{ borderRadius: "var(--circular-radius)" }}` и `width: "100%"` работают.

Панель принимает любые атрибуты `div` (`className`, `style`, `onClick`, `ref` и так далее). `style` перекрывает всё, что компонент выставляет сам.

## Токены

Каждый параметр это пропс и одновременно CSS-переменная `--lg-*`. **Порядок приоритета: токен, затем пропс, затем значение по умолчанию.**

Токен можно объявить в таблице стилей, на корне темы, на любом предке, в классе или в `style`:

```css
:root {
  --lg-edge-opacity: var(
    --edgeShadowOpacity
  ); /* 0.4 в светлой теме, 0 в тёмной */
}
.glass-accent {
  --lg-tint: color-mix(
    in srgb,
    var(--AccentFillColorDefaultBrush) 70%,
    transparent
  );
  --lg-radius: var(--CircularCornerRadius);
}
```

```tsx
<LiquidGlass style={{ "--lg-bezel": "24px" } as React.CSSProperties} />
```

Типы токенов: длина (`24px`, `1.5rem`, `calc(...)`, `var(...)`), число, угол (`-110deg`, `0.25turn`), цвет (любой CSS-цвет, включая `color-mix()`), переключатель (`0` или `1`).

| Токен                   | Пропс                 | Тип           | По умолчанию          |
| ----------------------- | --------------------- | ------------- | --------------------- |
| `--lg-width`            | `width`               | длина         | 320                   |
| `--lg-height`           | `height`              | длина         | 160                   |
| `--lg-radius`           | `radius`              | длина         | 9999                  |
| `--lg-bezel`            | `bezel`               | длина         | 30                    |
| `--lg-glass-height`     | `glassHeight`         | длина         | 50                    |
| `--lg-ior`              | `ior`                 | число 1…3     | 1.5                   |
| `--lg-strength`         | `strength`            | число 0…3     | 1                     |
| `--lg-blur`             | `blur`                | длина         | 0.25                  |
| `--lg-saturation`       | `saturation`          | число 0…5     | 1.4                   |
| `--lg-fallback-blur`    | `fallbackBlur`        | длина         | 24                    |
| `--lg-tint`             | `tint`                | цвет          | `rgba(255,255,255,0)` |
| `--lg-tint-opacity`     | `tintOpacity`         | число 0…1     | не задан              |
| `--lg-edge-opacity`     | `edgeShadowOpacity`   | число 0…1     | 0.35                  |
| `--lg-edge-width`       | `edgeShadowWidth`     | длина         | 8                     |
| `--lg-edge-direction`   | `edgeShadowDirection` | число 0…1     | 0.65                  |
| `--lg-specular-color`   | `specularColor`       | цвет          | `#ffffff`             |
| `--lg-specular-opacity` | `specularOpacity`     | число 0…1     | 0.6                   |
| `--lg-specular-width`   | `specularWidth`       | длина         | 2                     |
| `--lg-light-angle`      | `specularAngle`       | угол          | -110                  |
| `--lg-effects`          | `interactive`         | 0 / 1         | 0                     |
| `--lg-glow-hover`       | `glowHover`           | число 0…1     | 0.25                  |
| `--lg-glow-press`       | `glowPress`           | число 0…1     | 0.6                   |
| `--lg-glow-edge`        | `glowEdge`            | число 0…1     | 1                     |
| `--lg-glow-size`        | `glowSize`            | длина         | 160                   |
| `--lg-glow-color`       | `glowColor`           | цвет          | `#ffffff`             |
| `--lg-hover-scale`      | `hoverScale`          | число 0.5…1.5 | 1                     |
| `--lg-press-scale`      | `pressScale`          | число 0.5…1.5 | 1.06                  |
| `--lg-bounce`           | `bounce`              | число 0…1     | 0.6                   |
| `--lg-stiffness`        | `stiffness`           | число 20…2000 | 300                   |

Значения токенов вне диапазона ограничиваются (пропсы не ограничиваются). Неверное по типу значение токена считается незаданным, тогда работает пропс.

**Как работают токены**

- При первом использовании каждый токен регистрируется через `CSS.registerProperty` с типом. Поэтому браузер сам считает `calc()`, `rem`, `var()` и `color-mix()`. Там, где API нет, понимаются только числа и `px`.
- Токены читаются после каждого рендера компонента. Кроме того, перечитываются при смене атрибута у любого предка (`class`, `data-theme`, inline-стиль с пользовательскими свойствами) и при смене системной цветовой схемы, не чаще раза в кадр.
- Не замечается смена токена, вызванная только правилом стилей без смены атрибутов (например, `:hover` у предка). Для такого случая перерисуйте компонент или задавайте токен через `style`.

## Цвет блика и стекла

`specularColor` красит блик по краю, `glowColor` свечение при наведении, `tint` само стекло. Для акцентных кнопок задайте все три. Прозрачность `tint` берётся из самого цвета; `tintOpacity` заменяет её.

## Края: тень и блик

- Тонкий контур 1.4 px одинаков по всему периметру. Мягкая внутренняя тень зависит от света: на стороне лампы она слабее, на противоположной глубже. Степень задаёт `edgeShadowDirection` (0 даёт равномерное кольцо).
- Блик всегда лежит поверх тени, поэтому высветляет внутренний склон тени, и стекло выглядит живым и на светлой подложке. На освещённой стороне блик частично перекрывает тёмный контур. Если это не нравится, увеличьте `edgeShadowOpacity`.
- Внешней тени у панели нет. Если она нужна, задайте `style={{ boxShadow: "..." }}`.

## Наведение и нажатие

С `interactive` (или `--lg-effects: 1`) появляется пятно свечения под курсором, подсвеченный край и пружинная анимация масштаба (`hoverScale`, `pressScale`, `bounce`, `stiffness`). Пружина пишет свойство `scale` прямо в элемент без перерисовки React и отключается при `prefers-reduced-motion`. На сенсорных экранах наведение не включается, нажатие работает.

Панель-подложку оставляйте без `interactive`, она остаётся статичной.

## Миграция с GlassPanel

| Было                                                            | Стало                                                      |
| --------------------------------------------------------------- | ---------------------------------------------------------- |
| `GlassPanel`, `GlassPanelProps`, `GLASS_DEFAULTS`               | `LiquidGlass`, `LiquidGlassProps`, `LIQUID_GLASS_DEFAULTS` |
| `liquidGlass.ts`                                                | `liquidGlassMath.ts`                                       |
| `profile` (`squircle`, `circle`, `concave`, `lip`)              | убран, один профиль                                        |
| `dispersion`                                                    | убран                                                      |
| `boxShadow`, `outerShadowOpacity`                               | убраны, внешней тени нет (используйте `style.boxShadow`)   |
| `specularOpacity="var(--x)"` и другие значения-токены в пропсах | задавайте токен `--lg-specular-opacity: var(--x)` в CSS    |
| `edgeShadowOpacity="var(--edgeShadowOpacity)"`                  | `--lg-edge-opacity: var(--edgeShadowOpacity)` на `:root`   |
| `edgeShadowWidth="var(--glass-edge-width)"`                     | `--lg-edge-width: var(--glass-edge-width)`                 |
| `glowColor` (CSS-цвет)                                          | без изменений                                              |

Пример для `SearchField`:

```tsx
<LiquidGlass
  style={{
    height: "var(--height)",
    width: "100%",
    minWidth: 0,
    borderRadius: "var(--circular-radius)",
    display: "flex",
    alignItems: "center",
  }}
  fallbackBlur={24}
  specularWidth={2}
  specularAngle={-125}
>
```

`boxShadow: "none"` больше не нужен.

## Проверка

Компонент собран и проверен в Chromium с React 19: слои и их порядок, токены (`calc()`, `rem`, `var()`, `color-mix()`), смена темы, радиус из CSS-переменной, наведение, нажатие и пружина, `tintOpacity`, цвет блика. Типы проверены `tsc --strict` на заглушках типов React (реестр npm был недоступен), поэтому прогоните `tsc` в своём проекте с настоящими `@types/react`. Тесты в репозиторий не входят.
