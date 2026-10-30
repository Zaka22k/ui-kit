# MenuButton

Кнопка с иконкой (по умолчанию «три точки»), чья стеклянная подложка `LiquidGlass` при нажатии плавно вырастает в выпадающее меню в `document.body`, а при закрытии складывается обратно в прямоугольник кнопки.

## Параметры

### 1. Свойства `MenuButton` (`MenuButtonProps`)

| Название параметра | Тип | Описание |
| --- | --- | --- |
| `items` | `readonly MenuEntry[]` | Обязательный массив элементов меню (пункты действий `MenuItem` и разделители `MenuSeparator`). |
| `appearance` | `"glass" \| "plain"` | Визуальный режим кнопки: `"glass"` (по умолчанию, со собственной стеклянной подложкой `LiquidGlass`) или `"plain"` (прозрачная кнопка без стекла для размещения внутри `ToolbarGroup`). |
| `icon` | `ReactNode` | Иконка кнопки. По умолчанию отображается SVG-иконка из трёх горизонтальных точек (`16×16px`). |
| `size` | `number` | Сторона квадратной кнопки в пикселях для режима `appearance="glass"`. По умолчанию `36`. В режиме `"plain"` размер задаётся родительской группой. |
| `align` | `"end" \| "start"` | К какому краю кнопки привязывается меню при раскрытии: `"end"` (по умолчанию, правый край зафиксирован, меню растёт влево) или `"start"` (левый край зафиксирован, меню растёт вправо). При нехватке места разворачивается автоматически. |
| `open` | `boolean` | Управляемое состояние открытости меню. |
| `onOpenChange` | `(open: boolean) => void` | Колбэк, вызываемый при попытке открыть или закрыть меню (клик, выбор пункта, `Escape`, клик вовне, скролл). |
| `aria-label` | `string` | Доступное имя кнопки-триггера. По умолчанию `"Ещё"`. |
| `menuLabel` | `string` | Доступное имя выпадающего меню (`role="menu"`). По умолчанию берётся из `aria-label` кнопки. |
| `className` | `string` | Пользовательский CSS-класс для корня кнопки (`LiquidGlass` в режиме `"glass"` или `<button>` в режиме `"plain"`). |
| `style` | `CSSProperties` | Инлайн-стили для корня кнопки. |
| `menuClassName` | `string` | Пользовательский CSS-класс для стеклянной панели раскрытого меню (`LiquidGlass`). |
| `disabled` | `boolean` | Блокирует кнопку, отключает открытие меню и интерактивность стекла. |
| `ref` | `Ref<HTMLButtonElement>` | Ссылка на нативный элемент `<button>`. |
| `...rest` | `Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" \| "children" \| "className" \| "style" \| "onClick">` | Остальные нативные атрибуты `<button>` (`id`, `title`, `onKeyDown`, `data-*`, `aria-*` и др.). |

### 2. Элементы массива `items` (`MenuEntry`)

| Название параметра | Тип | Описание |
| --- | --- | --- |
| `label` | `ReactNode` | Текст или содержимое строки меню (`MenuItem`). |
| `icon` | `ReactNode` | Необязательная иконка перед подписью строки (`16×16px`). |
| `onSelect` | `() => void` | Обработчик выбора строки. После его вызова меню автоматически закрывается и возвращает фокус на кнопку. |
| `disabled` | `boolean` | Делает строку неактивной (`aria-disabled="true"`), пропускает её при навигации с клавиатуры и блокирует клик. |
| `destructive` | `boolean` | Окрашивает строку в критический красный цвет для опасных действий (удаление, выход). |
| `type` | `"separator"` | Если передать объект `{ type: "separator" }` (`MenuSeparator`), вместо кнопки рендерится горизонтальная линия-разделитель (`role="separator"`). |

## Быстрый старт

```tsx
import { MenuButton, type MenuEntry } from "./MenuButton";

const items: MenuEntry[] = [
  { label: "Переименовать", onSelect: () => console.log("Rename") },
  { label: "Дублировать", onSelect: () => console.log("Duplicate") },
  { label: "Поделиться", disabled: true },
  { type: "separator" },
  { label: "Удалить", destructive: true, onSelect: () => console.log("Delete") },
];

export default function App() {
  return <MenuButton items={items} aria-label="Действия с файлом" />;
}
```

## Примеры использования

### 1. Использование внутри `ToolbarGroup` (`appearance="plain"`)
Поскольку у `ToolbarGroup` уже есть собственная стеклянная подложка, передайте `appearance="plain"`, чтобы избежать двойного стекла в закрытом состоянии. При клике панель меню отрендерится через портал в `document.body` и вырастет из координат кнопки, преломляя фон страницы.

```tsx
import { ToolbarGroup, ToolbarButton, ToolbarDivider } from "../Toolbar";
import { MenuButton } from "./MenuButton";

<ToolbarGroup>
  <ToolbarButton icon={<ShareIcon />} aria-label="Поделиться" />
  <ToolbarDivider />
  <MenuButton appearance="plain" items={items} aria-label="Дополнительно" />
</ToolbarGroup>
```

### 2. Строки с иконками, выравнивание и кастомный размер
Вы можете передать собственную иконку триггера в `icon`, изменить габариты кнопки через `size` и задать направление раскрытия через `align="start"`.

```tsx
const menuWithIcons: MenuEntry[] = [
  { label: "Редактировать", icon: <EditIcon />, onSelect: handleEdit },
  { label: "Копировать ссылку", icon: <CopyIcon />, onSelect: handleCopy },
  { type: "separator" },
  { label: "Удалить", icon: <TrashIcon />, destructive: true, onSelect: handleDelete },
];

<MenuButton
  items={menuWithIcons}
  icon={<SettingsIcon />}
  size={40}
  align="start"
  aria-label="Настройки"
/>
```

### 3. Управляемый режим (`open` и `onOpenChange`)
В управляемом режиме компонент не меняет внутренний стейт сам, а сообщает о каждом намерении открыться или закрыться через `onOpenChange`.

```tsx
const [open, setOpen] = useState(false);

<MenuButton
  items={items}
  open={open}
  onOpenChange={(nextOpen) => {
    console.log("Меню:", nextOpen ? "открыто" : "закрыто");
    setOpen(nextOpen);
  }}
/>
```

### 4. Кастомизация стекла меню (`menuClassName`)
Через `menuClassName` можно переопределить CSS-переменные заливки открытого/закрытого меню и параметры преломления `LiquidGlass`:

```tsx
<MenuButton items={items} menuClassName={styles.customMenuGlass} />
```

```css
.customMenuGlass {
  --menu-tint-open: color-mix(in srgb, var(--material-popover-bg) 60%, transparent);
  --lg-bezel: 18px;
}
```

## Ограничения

- **Закрытие при любом внешнем скролле и ресайзе:** Так как анимация морфинга жёстко привязана к экранным координатам кнопки в момент открытия, любая прокрутка страницы вне меню или изменение размеров окна автоматически закрывает меню.
- **Покадровый пересчёт во время анимации:** Пружинная анимация (`requestAnimationFrame`) изменяет `width`, `height` и `--menu-radius` контейнера на каждом кадре. Избегайте создания чрезмерно длинных списков в `items`, чтобы не нагружать пересчёт стеклянной подложки.
- **Нет вложенных подменю:** Компонент поддерживает только одноуровневый список из пунктов `MenuItem` и разделителей `MenuSeparator`.
- **Зарезервированные атрибуты кнопки:** Пропсы `type`, `children` и `onClick` исключены из типов триггера — содержимое задаётся через `icon`, а клик управляет раскрытием меню.