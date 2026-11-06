# ThemeProvider

Провайдер цветовой схемы и акцентного цвета приложения, который синхронизирует выбранную тему (`light`, `dark`, `auto`) и системный или кастомный акцент с атрибутами `<html>`, CSS-токенами (`light-dark()`) и браузерными cookies (`app-theme`, `app-accent`).

## Параметры

### 1. Свойства `ThemeProvider` (`ThemeProviderProps`)

| Название параметра | Тип                           | Описание                                                                                                                                                                 |
| ------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `children`         | `ReactNode`                   | Дочерние элементы приложения, внутри которых будет доступен хук `useTheme()`.                                                                                            |
| `initialTheme`     | `"light" \| "dark" \| "auto"` | Начальная тема оформления (например, прочитанная на сервере из cookie `app-theme`). По умолчанию `"light"`.                                                              |
| `initialAccent`    | `AccentColor`                 | Начальный акцентный цвет: один из 13 системных цветов (`SystemAccent`) или любая валидная CSS-строка цвета (прочитанная из cookie `app-accent`). По умолчанию `"green"`. |

### 2. Значения и методы хука `useTheme()` (`ThemeContextValue`)

| Название параметра | Тип                             | Описание                                                                                                                                                              |
| ------------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `theme`            | `"light" \| "dark" \| "auto"`   | Текущий выбранный режим темы.                                                                                                                                         |
| `resolvedTheme`    | `"light" \| "dark"`             | Фактически применённая тема: если `theme === "auto"`, возвращает текущую системную тему ОС (`prefers-color-scheme`), иначе совпадает с `theme`.                       |
| `accent`           | `AccentColor`                   | Текущий акцентный цвет (имя из `SYSTEM_ACCENTS` или произвольный CSS-цвет).                                                                                           |
| `setTheme`         | `(theme: Theme) => void`        | Устанавливает тему (`"light"`, `"dark"` или `"auto"`), обновляет `data-theme` на `<html>` и сохраняет выбор в cookie `app-theme` на 1 год.                            |
| `toggleTheme`      | `() => void`                    | Переключает тему между `"light"` и `"dark"` (если текущая тема была `"auto"`, отталкивается от фактической системной темы и переводит в противоположный явный режим). |
| `setAccent`        | `(accent: AccentColor) => void` | Меняет акцентный цвет, обновляет `data-accent` (и `--accent-base` для кастомных цветов) на `<html>` и сохраняет выбор в cookie `app-accent` на 1 год. Значение, которое не является CSS-цветом, игнорируется (с предупреждением в консоли).                 |

### 3. Экспортируемые константы и типы

| Имя              | Значение / Тип                                                                                                               | Описание                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `SYSTEM_ACCENTS` | `readonly ["red", "orange", "yellow", "green", "mint", "teal", "cyan", "blue", "indigo", "purple", "pink", "brown", "gray"]` | Массив всех встроенных системных акцентов, адаптированных под светлую и тёмную тему в `theme.css`.                    |
| `Theme`          | `"light" \| "dark" \| "auto"`                                                                                                | Тип режима цветовой схемы.                                                                                            |
| `ResolvedTheme`  | `"light" \| "dark"`                                                                                                          | Тип вычисленной темы без `"auto"`.                                                                                    |
| `SystemAccent`   | `(typeof SYSTEM_ACCENTS)[number]`                                                                                            | Объединение строковых литералов 13 системных акцентов.                                                                |
| `AccentColor`    | `SystemAccent \| (string & {})`                                                                                              | Тип акцента с автодополнением системных цветов и поддержкой любого кастомного CSS-цвета (`#hex`, `rgb()`, `oklch()`). |
| `ThemeProviderProps` | `interface` | Свойства `ThemeProvider` (`children`, `initialTheme`, `initialAccent`). |
| `ThemeContextValue` | `interface` | Тип значения, которое возвращает `useTheme()`. |

## Быстрый старт

Оберните корневой макет в `ThemeProvider` (сам файл уже импортирует глобальные `theme.css` и `tokens.css`):

```tsx
import { ThemeProvider } from "@ui-kit/components";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" data-theme="light" data-accent="green">
      <body>
        <ThemeProvider initialTheme="light" initialAccent="green">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Управляйте темой и акцентом из любого клиентского компонента через хук `useTheme()`:

```tsx
"use client";
import { useTheme } from "@ui-kit/components";

export function QuickThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Тема: {resolvedTheme === "dark" ? "Тёмная" : "Светлая"}
    </button>
  );
}
```

## Примеры использования

### 1. Бесшовная работа с SSR без мигания темы (Next.js App Router)

Поскольку `ThemeProvider` после каждой смены темы или акцента записывает `app-theme` и `app-accent` в `document.cookie` (`max-age=31536000; path=/; SameSite=Lax`, на https дополнительно `Secure`), серверный `layout.tsx` может прочитать их через `cookies()` и сразу отрендерить `<html data-theme="..." data-accent="...">` до гидратации React.

```tsx
// app/layout.tsx
import { cookies } from "next/headers";
import {
  ThemeProvider,
  SYSTEM_ACCENTS,
  type Theme,
  type AccentColor,
} from "@ui-kit/components";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const rawTheme = cookieStore.get("app-theme")?.value;
  const theme: Theme =
    rawTheme === "light" || rawTheme === "dark" || rawTheme === "auto"
      ? rawTheme
      : "light";

  const accent: AccentColor = cookieStore.get("app-accent")?.value ?? "green";

  const isSystem = (SYSTEM_ACCENTS as readonly string[]).includes(accent);

  return (
    <html
      lang="ru"
      data-theme={theme}
      data-accent={isSystem ? accent : "custom"}
      style={
        !isSystem
          ? ({ "--accent-base": accent } as React.CSSProperties)
          : undefined
      }
    >
      <body>
        <ThemeProvider initialTheme={theme} initialAccent={accent}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. Панель выбора системного или кастомного акцентного цвета

Если передать в `setAccent` цвет из `SYSTEM_ACCENTS`, на `<html>` установится `data-accent="<цвет>"`, который активирует парные светлые и тёмные токены (а для `"yellow"` автоматически заменит `--text-selected` на тёмный текст для читаемости). Если передать произвольный HEX/RGB-цвет, компонент выставит `data-accent="custom"` и запишет значение напрямую в инлайн-переменную `--accent-base`.

```tsx
"use client";
import { useTheme, SYSTEM_ACCENTS } from "@ui-kit/components";

export function AccentPicker() {
  const { accent, setAccent } = useTheme();

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {SYSTEM_ACCENTS.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={accent === item}
          onClick={() => setAccent(item)}
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            border:
              accent === item
                ? "2px solid var(--control-accent)"
                : "1px solid var(--separator)",
          }}
        >
          {item}
        </button>
      ))}

      {/* Произвольный кастомный цвет */}
      <input
        type="color"
        aria-label="Свой акцентный цвет"
        value={accent.startsWith("#") ? accent : "#28cd41"}
        onChange={(e) => setAccent(e.target.value)}
      />
    </div>
  );
}
```

### 3. Переключатель трёх режимов (`light`, `dark`, `auto`)

В режиме `"auto"` CSS-свойство `color-scheme: light dark` и медиазапрос `(prefers-color-scheme: light)` автоматически переключают все CSS-переменные, построенные на функции `light-dark()`, а `resolvedTheme` в React реактивно обновляется при смене системной темы ОС.

```tsx
"use client";
import { useTheme, type Theme } from "@ui-kit/components";

const MODES: { value: Theme; label: string }[] = [
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
  { value: "auto", label: "Авто (ОС)" },
];

export function ThemeModeSelector() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            disabled={theme === m.value}
            onClick={() => setTheme(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>
      {theme === "auto" && (
        <p className="CaptionTextBlockStyle">
          Сейчас активна {resolvedTheme === "dark" ? "тёмная" : "светлая"}{" "}
          системная схема
        </p>
      )}
    </div>
  );
}
```

## Ограничения

- **Только внутри `<ThemeProvider>`:** Вызов `useTheme()` вне провайдера выбросит ошибку `"useTheme должен использоваться внутри ThemeProvider"`.
- **Гидратация `resolvedTheme` при `initialTheme="auto"`:** На сервере функция `getSystemTheme()` всегда возвращает `"dark"` (так как `window` недоступен). Если пользователь с `initialTheme="auto"` откроет сайт со светлой системной темой ОС, во время SSR `resolvedTheme` будет `"dark"` до монтирования на клиенте. Чтобы избежать несовпадения разметки при гидратации, используйте для стилизации CSS-переменные (`var(--...)`), а не ветвление JSX по `resolvedTheme`.
- **Отсутствие `--control-accent-rgb` у `"gray"` и кастомных акцентов:** В `theme.css` для `[data-accent="gray"]` и кастомных цветов (`data-accent="custom"`) переменная `--control-accent-rgb` не переопределяется и сохраняет значение по умолчанию (`--system-green-rgb`). Для работы с прозрачностью акцента рекомендуется использовать `color-mix(in srgb, var(--control-accent) ..., transparent)` вместо `rgba(var(--control-accent-rgb), ...)`. Сами компоненты набора эту переменную не используют.
- **Контрастность текста на кастомных светлых акцентах:** Переменная `--text-selected` (цвет текста на акцентном фоне) автоматически переключается на тёмный цвет только для системного акцента `data-accent="yellow"`. При передаче очень светлого кастомного цвета (например, `#ffff99`) текст на акцентных кнопках останется белым (`#ffffff`).
- **Требования к браузеру:** Цветовые токены в `theme.css` используют `light-dark()` (Chrome 123+, Safari 17.5+, Firefox 120+) и `color-mix()` (Chrome 111+, Safari 16.2+, Firefox 113+). Остальные компоненты добавляют вложенный CSS (Chrome 120+, Safari 17.2+, Firefox 117+) и `:has()` (Chrome 105+, Safari 15.4+, Firefox 121+). Для всего набора ориентируйтесь на Chrome 123+, Safari 17.5+, Firefox 121+ (Firefox 128+, если используется `tintOpacity` у `FrostedGlass`).
- **Тема до выполнения эффекта провайдера:** Без атрибута `data-theme` на `<html>` по `theme.css` действует тёмная схема, хотя `initialTheme` по умолчанию равен `"light"`. Провайдер выставляет `data-theme` в эффекте, уже после первой отрисовки, поэтому всегда задавайте `data-theme` на `<html>` на сервере (как в примерах выше), иначе возможно мигание.
- **Cookie пишутся только после смены значения:** При монтировании cookie не создаётся и не обновляется. Пока пользователь ничего не менял, сервер видит пустую cookie и использует значения по умолчанию (`"light"` и `"green"`).
- **Проверка цвета акцента:** Строка, не входящая в `SYSTEM_ACCENTS`, проверяется через `CSS.supports("color", …)`. `setAccent` с невалидным цветом ничего не меняет, а невалидный `initialAccent` (например, из испорченной cookie) после монтирования заменяется на `"green"`, и cookie перезаписывается. На сервере, где проверить цвет нельзя, значение принимается как есть.
- **Токены подключаются вместе с провайдером:** `theme.css` и `tokens.css` импортируются только из файла `ThemeProvider`. Без него (или без самостоятельного подключения этих стилей) компоненты не получат цветов и размеров.
