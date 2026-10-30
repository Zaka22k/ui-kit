# ProgressRing

Круговой SVG-индикатор загрузки с плавным появлением, работающий в неопределённом (непрерывное вращение дуги) и определённом (заполнение кольца от 0 до 100%) режимах.

## Параметры

| Название параметра | Тип | Описание |
| --- | --- | --- |
| `loading` | `boolean` | Управляет видимостью индикатора. По умолчанию `false` (кольцо скрыто через `opacity: 0`, уменьшено до `scale(0.75)`, не перехватывает клики, стоит на паузе и имеет `aria-hidden="true"`). |
| `progress` | `number` | Процент выполнения от `0` до `100`. Если передано конечное число (`Number.isFinite`), включает определённый режим с фоновой дорожкой; значения вне диапазона автоматически ограничиваются до `0` и `100`. Если не задан — работает неопределённый режим. |
| `size` | `number \| string` | Ширина и высота SVG-элемента. Число задаёт размер в пикселях, строка — любую CSS-единицу (например, `"2rem"`). По умолчанию `28`. |
| `strokeWidth` | `number` | Толщина линии кольца в координатах `viewBox="0 0 24 24"`. Радиус окружности вычисляется как `(24 - strokeWidth) / 2`. По умолчанию `2.5`. |
| `className` | `string` | Пользовательский CSS-класс, добавляется к корневому элементу `<svg>`. По умолчанию `""`. |
| `ref` | `Ref<SVGSVGElement>` | Ссылка на корневой DOM-элемент `<svg>`. |
| `...props` | `SVGProps<SVGSVGElement>` | Остальные атрибуты `<svg>` (`style`, `aria-label`, `aria-labelledby`, `id`, `data-*` и др.). Передаются в конец тега `<svg>`, поэтому могут переопределить его базовые атрибуты. |

## Быстрый старт

```tsx
import { ProgressRing } from "./ProgressRing";

export default function App() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      {/* Неопределённый режим (вращение) */}
      <ProgressRing loading aria-label="Загрузка данных" />

      {/* Определённый режим (заполнение на 45%) */}
      <ProgressRing loading progress={45} aria-label="Загрузка файла" />
    </div>
  );
}
```

## Примеры использования

### 1. Плавное появление и скрытие (`loading`)
Компонент всегда остаётся в DOM, поэтому переключение `loading` из `true` в `false` позволяет плавно скрыть кольцо с анимацией прозрачности и масштаба (`0.25s`). Если нужно полностью убрать элемент из потока разметки, используйте условный рендеринг.

```tsx
{/* Плавное затухание по завершении загрузки (место в разметке сохраняется) */}
<ProgressRing
  loading={!isDone}
  progress={uploadPercent}
  aria-label="Загрузка архива"
/>

{/* Полное удаление из DOM */}
{isFetching && <ProgressRing loading aria-label="Обновление" />}
```

### 2. Настройка размера, толщины и цвета
Дуга индикатора использует `currentColor` (по умолчанию токен `--TextFillColorSecondaryBrush`), поэтому цвет линии легко переопределить через инлайн-стиль `color` или CSS-класс. Фоновая дорожка в определённом режиме всегда использует токен `--TextFillColorTertiaryBrush`.

```tsx
<ProgressRing loading size={16} strokeWidth={3} aria-label="Мини-индикатор" />

<ProgressRing
  loading
  size={48}
  strokeWidth={2}
  style={{ color: "var(--AccentFillColorDefaultBrush)" }}
  aria-label="Акцентный индикатор"
/>
```

### 3. Определённый режим с динамическим прогрессом
При передаче числа в `progress` (включая `0`) появляется бледная кольцевая дорожка, а заполнение дуги плавно анимируется при каждом обновлении значения. На `<svg>` автоматически выставляются `aria-valuenow`, `aria-valuemin={0}` и `aria-valuemax={100}`.

```tsx
const [progress, setProgress] = useState(0);

<ProgressRing
  loading
  progress={progress}
  size="2.5rem"
  aria-label="Скачивание обновления"
/>
```

### 4. Использование внутри кнопки или формы
Чтобы разместить индикатор рядом с текстом кнопки, передайте `color: "currentColor"` и компактный `size`.

```tsx
<Button type="submit" appearance="primary" disabled={isPending} width={160}>
  {isPending ? (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <ProgressRing loading size={16} style={{ color: "currentColor" }} aria-hidden="true" />
      Сохранение…
    </span>
  ) : (
    "Сохранить"
  )}
</Button>
```

## Ограничения

- **По умолчанию невидим:** Без передачи пропа `loading={true}` компонент `<ProgressRing />` рендерится полностью прозрачным (`opacity: 0`) и со скрытой доступностью (`aria-hidden="true"`).
- **Занимает место в скрытом состоянии:** При `loading={false}` элемент `<svg>` остаётся в DOM и резервирует свои габариты `size × size`.
- **Переопределение системных атрибутов через `...props`:** Так как `{...props}` разворачивается в самом конце тега `<svg>`, передача в пропсы `width`, `height`, `viewBox`, `role` или `aria-hidden` перезапишет вычисленные внутри компонента значения.
- **Нет отдельного пропа для цвета:** Цвет активной дуги задаётся через CSS-свойство `color` в `style` или `className`, а цвет подложки (`track`) жёстко привязан к CSS-токену `--TextFillColorTertiaryBrush`.
- **Отсутствие подписи по умолчанию:** Для доступности при `loading={true}` необходимо явно передавать `aria-label` или `aria-labelledby` (если индикатор не декоративный).