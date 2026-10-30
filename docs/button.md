# Button

Кнопка на основе стеклянной подложки `LiquidGlass` и нативного элемента `<button>`, поддерживающая три варианта оформления (`normal`, `primary`, `destructive`) и два режима отображения: текстовый или только с иконкой.

## Параметры

| Название параметра | Тип | Описание |
| --- | --- | --- |
| `appearance` | `"normal" \| "primary" \| "destructive"` | Визуальный стиль кнопки. По умолчанию `"normal"` (полупрозрачная заливка). `"primary"` — сплошная акцентная заливка для главных действий, `"destructive"` — для опасных действий (удаление, отмена) с критическим красным текстом. |
| `children` | `ReactNode` | Текстовое содержимое кнопки. Нельзя использовать одновременно с `icon`. |
| `icon` | `ReactNode` | Иконка кнопки (20×20px). Включает квадратный режим «только иконка» и требует обязательного указания `aria-label`. |
| `aria-label` | `string` | Обязательная текстовая метка для доступности при использовании параметра `icon`. |
| `width` | `number \| string` | Ширина кнопки (число трактуется как пиксели). По умолчанию `"auto"`. Игнорируется в режиме иконки. |
| `height` | `number \| string` | Высота кнопки. По умолчанию `36`. В режиме `icon` задаёт также и ширину, делая кнопку квадратной. |
| `type` | `"button" \| "submit" \| "reset"` | Нативный тип кнопки. По умолчанию `"button"`. При `"submit"` кнопка автоматически переходит в состояние `disabled` во время отправки формы (`useFormStatus`). |
| `disabled` | `boolean` | Отключает кнопку, блокирует интерактивность подложки `LiquidGlass` и пересчёт карт преломления. |
| `className` | `string` | Пользовательский CSS-класс. Применяется к внешней обёртке `LiquidGlass`, а не к нативному `<button>`. |
| `style` | `CSSProperties` | Инлайн-стили. Применяются к внешней обёртке `LiquidGlass`. |
| `ref` | `Ref<HTMLButtonElement>` | Ссылка, указывающая напрямую на нативный элемент `<button>`. |
| `...props` | `ButtonHTMLAttributes<HTMLButtonElement>` | Остальные стандартные атрибуты (`onClick`, `title`, `form`, `formAction`, `data-*`, `aria-*`) передаются в нативный `<button>`. |

## Быстрый старт

```tsx
import Button from "./Button";

export default function App() {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Button onClick={() => console.log("Saved")}>Сохранить</Button>
      <Button appearance="primary" onClick={() => console.log("Sent")}>Отправить</Button>
      <Button appearance="destructive" onClick={() => console.log("Deleted")}>Удалить</Button>
      <Button icon={<PlusIcon />} aria-label="Добавить" onClick={() => console.log("Added")} />
    </div>
  );
}
```

## Примеры использования

### 1. Управление размерами
Вы можете задавать фиксированную или адаптивную ширину и высоту. Внутреннее содержимое всегда выравнивается по центру с отступами `5px 12px`.

```tsx
<Button width={160}>Фиксированная ширина</Button>
<Button width="100%">На всю ширину контейнера</Button>
<Button height={44}>Высокая кнопка</Button>
```

### 2. Кнопка-иконка
В режиме иконки кнопка становится квадратной (ширина приравнивается к `height`). Иконка рендерится в контейнере 20×20px и наследует `currentColor`.

```tsx
<Button icon={<SettingsIcon />} aria-label="Настройки" />
<Button 
  icon={<TrashIcon />} 
  appearance="destructive" 
  aria-label="Удалить" 
  height={32} 
/>
```

### 3. Работа с формами (Next.js / React 19)
Компонент интегрирован с хуком `useFormStatus` из `react-dom`: кнопка с `type="submit"` автоматически блокируется (`disabled`), пока форма находится в состоянии `pending`. Рекомендуется задавать фиксированную `width`, если текст кнопки меняется при отправке, чтобы избежать лишнего пересчёта стеклянной подложки.

```tsx
<form action={formAction}>
  <Button type="submit" appearance="primary" width={140}>
    Сохранить
  </Button>
  <Button type="reset">
    Сбросить
  </Button>
</form>
```

### 4. Позиционирование и управление фокусом
Так как `className` и `style` попадают на внешнюю обёртку `LiquidGlass`, используйте их для позиционирования во флекс- или грид-контейнерах, а `ref` — для программного фокуса на самом `<button>`.

```tsx
const buttonRef = useRef<HTMLButtonElement>(null);

<Button
  ref={buttonRef}
  className={styles.toolbarButton}
  style={{ marginLeft: "auto" }}
  onClick={() => buttonRef.current?.focus()}
>
  Далее
</Button>
```

## Ограничения

- **Нельзя совмещать текст и иконку:** Типизация TypeScript и логика рендера строго разделяют `children` и `icon`. Передать оба свойства одновременно нельзя.
- **Обязательный `aria-label` для иконок:** Использование `icon` без `aria-label` вызовет ошибку типизации TypeScript.
- **Проверка `icon` на `null`/`undefined`:** Режим иконки включается при любом значении `icon != null`. Передача `icon={false}` приведёт к рендеру пустой квадратной кнопки.
- **Игнорирование `width` в режиме иконки:** При передаче `icon` ширина кнопки всегда жёстко равна её высоте (`height`).
- **Стилизация через `className` и `style`:** Эти пропсы передаются в обёртку `LiquidGlass`, а не в тег `<button>`. Переопределить внутренние стили самой кнопки (фон, текст, рамку, `:hover`) через них нельзя — для этого нужно менять CSS-токены или `Button.module.css`.
- **Защита базового тона:** В инлайн-стилях обёртки по умолчанию задан `backgroundColor: "var(--button-tint)"`. Если передать свой `backgroundColor` внутри пропа `style`, он перезапишет системный тон подложки.