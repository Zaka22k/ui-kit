# SegmentedControl

Универсальный переключатель сегментов: форм-контрол в стиле macOS (`solid`), стеклянная панель навигации (`glass`) и прокручиваемый ряд фильтров-«пилюль» (`pills`). Работает в одиночном режиме (как группа радиокнопок) и во множественном (как набор кнопок-переключателей).

## Параметры

### SegmentedControl

| Название параметра | Тип                                  | Описание                                                                                                                                                                                                       |
| ------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`            | `readonly SegmentItem<T>[]`          | Сегменты данными. Если не передан, используйте `<Segment>` в `children`. Ключом служит `value`, поэтому значения должны быть уникальными.                                                                       |
| `children`         | `ReactNode`                          | Сегменты в виде `<Segment>`. Используются, когда `items` не передан.                                                                                                                                           |
| `value`            | `T`                                  | Выбранное значение в одиночном режиме (контролируемый режим).                                                                                                                                                  |
| `defaultValue`     | `T`                                  | Начальное значение в одиночном режиме (неконтролируемый режим).                                                                                                                                                |
| `onValueChange`    | `(val: T) => void`                   | Вызывается при выборе другого сегмента в одиночном режиме. Повторный клик по выбранному сегменту не вызывает его.                                                                                              |
| `values`           | `T[]`                                | Выбранные значения во множественном режиме (контролируемый режим).                                                                                                                                             |
| `defaultValues`    | `T[]`                                | Начальные значения во множественном режиме (неконтролируемый режим).                                                                                                                                           |
| `onValuesChange`   | `(vals: T[]) => void`                | Вызывается при каждом переключении сегмента во множественном режиме и получает новый массив.                                                                                                                   |
| `variant`          | `"solid" \| "glass" \| "pills"`      | Стиль отображения. По умолчанию `"solid"`.                                                                                                                                                                     |
| `layout`           | `"inline" \| "stacked"`              | `"inline"` (по умолчанию) — иконка и текст в строку; `"stacked"` — иконка над текстом, высота `58px`.                                                                                                          |
| `appearance`       | `"neutral" \| "accent"`              | `"neutral"` (по умолчанию) — нейтральные цвета; `"accent"` — выбранный сегмент окрашивается в `--control-accent`.                                                                                               |
| `fullWidth`        | `boolean`                            | Растягивает контрол на всю ширину контейнера. По умолчанию `false`.                                                                                                                                            |
| `equalWidth`       | `boolean`                            | `true` (по умолчанию) — сегменты одной ширины; `false` — ширина по содержимому.                                                                                                                                |
| `disabled`         | `boolean`                            | Блокирует весь контрол: сегменты получают нативный `disabled`, затемняются, группа — `aria-disabled="true"`. По умолчанию `false`.                                                                             |
| `className`        | `string`                             | Пользовательский CSS-класс корневого элемента (в режиме `glass` это `FrostedGlass`).                                                                                                                           |
| `style`            | `CSSProperties`                      | Инлайн-стили корневого элемента.                                                                                                                                                                               |
| `ref`              | `Ref<HTMLDivElement>`                | Ссылка на корневой элемент.                                                                                                                                                                                    |
| `...props`         | `HTMLAttributes<HTMLDivElement>`     | Остальные атрибуты корневого `<div>` (`aria-label`, `aria-labelledby`, `id`, `onKeyDown`, `data-*` и др.). `onChange` и `defaultValue` исключены. Атрибуты `role` и `aria-disabled` задаются компонентом.      |

Режим выбирается автоматически: если передан хотя бы один из `values`, `defaultValues`, `onValuesChange`, контрол работает во множественном режиме, иначе — в одиночном. Тип `T` (`string | number`) выводится из `items` или `value`.

### Segment и SegmentItem

Поля элемента `items` совпадают с пропсами `<Segment>`.

| Название параметра | Тип                                     | Описание                                                                                                                                                              |
| ------------------ | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`            | `string \| number`                      | Уникальный идентификатор сегмента. Обязателен.                                                                                                                        |
| `label`            | `ReactNode`                             | Текст сегмента. Значение `0` отображается.                                                                                                                            |
| `children`         | `ReactNode`                             | Содержимое сегмента вместо `label` (только у `<Segment>`). Если передано, `label` игнорируется.                                                                       |
| `icon`             | `ReactNode`                             | Иконка перед текстом (в `stacked` — над текстом).                                                                                                                     |
| `activeIcon`       | `ReactNode`                             | Иконка, которая заменяет `icon`, пока сегмент выбран.                                                                                                                 |
| `disabled`         | `boolean`                               | Блокирует только этот сегмент.                                                                                                                                        |
| `tooltip`          | `string`                                | Нативная подсказка (`title`). Для сегмента без текста также служит доступным именем.                                                                                  |
| `aria-label`       | `string`                                | Доступное имя. Обязательно для сегмента без текста, если не задан `tooltip`.                                                                                          |
| `...props`         | `HTMLAttributes<HTMLButtonElement>`     | Остальные атрибуты `<button>` (только у `<Segment>`; `onClick` исключён). Передаются в конец тега, поэтому могут переопределить `tabIndex`, `role` и другие.          |

## Быстрый старт

```tsx
import { SegmentedControl } from "@ui-kit/components";

export default function App() {
  return (
    <SegmentedControl
      aria-label="Вид отображения"
      defaultValue="map"
      items={[
        { value: "map", label: "Карта" },
        { value: "list", label: "Список" },
      ]}
      onValueChange={(view) => console.log(view)}
    />
  );
}
```

Типы доступны из пакета: `SegmentedControlProps`, `SegmentProps`, `SegmentItem`, `SegmentValue`, `SegmentVariant`.

## Варианты отображения

### 1. `solid` — форм-контрол

Серая подложка (`--fill-secondary`) с рамкой и ползунком цвета `--control-surface`. Высота `32px` (`--ControlHeight`), `58px` при `layout="stacked"`. Подходит для переключения вида, масштаба, темы.

```tsx
<SegmentedControl
  aria-label="Вид"
  variant="solid"
  defaultValue="map"
  items={[
    { value: "map", label: "Карта" },
    { value: "list", label: "Список" },
  ]}
/>
```

### 2. `glass` — навигация

Фон и ползунок рисует `FrostedGlass` (подложка `--fill-tertiary`, ползунок `--fill-primary`). Высота `36px` при `inline` и `58px` при `stacked`. Подходит для таб-бара поверх контента.

```tsx
<SegmentedControl
  aria-label="Разделы"
  variant="glass"
  layout="stacked"
  defaultValue="home"
  items={[
    { value: "home", label: "Главная", icon: <IconHome />, activeIcon: <IconHomeFilled /> },
    { value: "chat", label: "Чаты", icon: <IconChat /> },
  ]}
/>
```

### 3. `pills` — фильтры

Горизонтальный ряд отдельных «пилюль» с прокруткой, когда они не помещаются. Выбранная пилюля закрашивается цветом `--label-primary` (при `appearance="accent"` — `--control-accent`), неактивные имеют рамку. Для фильтров удобно `equalWidth={false}`.

```tsx
<SegmentedControl
  aria-label="Категория"
  variant="pills"
  equalWidth={false}
  appearance="accent"
  defaultValue="all"
  items={[
    { value: "all", label: "Все" },
    { value: "games", label: "Игры" },
    { value: "music", label: "Музыка" },
  ]}
/>
```

## Примеры использования

### 1. Контролируемый одиночный выбор

Выбор нельзя снять: клик по выбранному сегменту ничего не меняет и не вызывает `onValueChange`.

```tsx
const [view, setView] = useState<"day" | "week" | "month">("week");

<SegmentedControl
  aria-label="Период"
  value={view}
  onValueChange={setView}
  items={[
    { value: "day", label: "День" },
    { value: "week", label: "Неделя" },
    { value: "month", label: "Месяц" },
  ]}
/>;
```

### 2. Множественный выбор

Общего ползунка нет: каждый выбранный сегмент подсвечивается сам (в `solid` и `glass` — своим кусочком стекла `--fill-secondary`, в `pills` — заливкой). Режим включается передачей `values`, `defaultValues` или `onValuesChange`.

```tsx
<SegmentedControl
  aria-label="Форматирование текста"
  defaultValues={["bold"]}
  equalWidth={false}
  items={[
    { value: "bold", icon: <IconBold />, tooltip: "Жирный" },
    { value: "italic", icon: <IconItalic />, tooltip: "Курсив" },
    { value: "underline", icon: <IconUnderline />, tooltip: "Подчёркнутый" },
  ]}
/>
```

### 3. Сегменты через `children`

`<Segment>` можно использовать только внутри `SegmentedControl`, иначе будет выброшена ошибка. Через `children` удобно задавать свою разметку и дополнительные атрибуты.

```tsx
import { SegmentedControl, Segment } from "@ui-kit/components";

<SegmentedControl aria-label="Сортировка" defaultValue="new">
  <Segment value="new" label="Новые" />
  <Segment value="top" disabled>
    Лучшие
  </Segment>
</SegmentedControl>;
```

### 4. Доступность и клавиатура

- **Одиночный режим** — `role="radiogroup"`, сегменты — `role="radio"` с `aria-checked`. В порядок табуляции попадает только выбранный сегмент (или первый доступный, если выбора нет). Стрелки переносят фокус и сразу меняют выбор, `Home` и `End` переходят к первому и последнему доступному сегменту, в RTL горизонтальные стрелки меняются местами.
- **Множественный режим** — `role="group"`, сегменты — кнопки с `aria-pressed`, в табуляции участвуют все, переключаются клавишами `Space` и `Enter`.
- Задавайте группе имя через `aria-label` или `aria-labelledby`.
- Сегмент без текста получает имя из `aria-label` или `tooltip`; без них скринридер прочитает просто «кнопка».

## Ограничения

- **Требуется `FrostedGlass` и глобальные токены:** вариант `glass` и выбранные сегменты множественного режима используют `FrostedGlass`; размеры берутся из `--ControlHeight` и `--CircularCornerRadius`, цвета — из токенов темы.
- **`pills` выходит за границы родителя:** вариант использует `margin: 0 -20px`, `padding: 4px 20px` и ширину `calc(100% + 40px)`, чтобы прокрутка доходила до краёв. Учитывайте это в контейнерах с `overflow: hidden`. С `fullWidth` остаётся строка `flex` с прокруткой.
- **Фиксированная высота:** `inline` — `32px` (`solid`) или `36px` (`glass`), `stacked` — `58px`, пилюля — `32px`. Высоту задаёт только вариант и раскладка.
- **Нет снятия выбора в одиночном режиме:** для необязательного выбора используйте множественный режим.
- **`onClick` у `<Segment>` недоступен:** реагируйте на выбор через `onValueChange` и `onValuesChange`.
- **Ползунок — только в одиночном режиме:** положение считается по `offsetLeft` и `offsetWidth` выбранной кнопки и пересчитывается при изменении размеров и содержимого.
- **Анимации:** при `prefers-reduced-motion: reduce` переходы ползунка и сегментов отключаются.
