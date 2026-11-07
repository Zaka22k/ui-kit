# ContextMenu

Контекстное меню, которое открывается в заданной точке окна: панель с пунктами, иконками, подсказками-сочетаниями клавиш и разделителями. Рисуется порталом в `document.body`, сама выбирает сторону раскрытия, чтобы не выйти за край окна, и поддерживает управление с клавиатуры.

Компонент управляется родителем: он сам не слушает правый клик и не хранит состояние «открыто». Родитель показывает `<ContextMenu>` (например, по `onContextMenu` или клавише `ContextMenu` / `Shift+F10`) и убирает его в `onClose`. Так работают `List` (`itemMenu`) и `DataGrid` (`rowMenu`).

## Параметры

### 1. Свойства `ContextMenu` (`ContextMenuProps`)

| Название параметра | Тип                                 | Описание                                                                                                                                                                                      |
| ------------------ | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`            | `readonly ContextMenuItem[]`        | Обязательный массив пунктов (`ContextMenuAction`) и разделителей (`ContextMenuSeparator`).                                                                                                      |
| `x`                | `number`                            | Горизонтальная координата точки раскрытия в координатах окна (`clientX`).                                                                                                                       |
| `y`                | `number`                            | Вертикальная координата точки раскрытия в координатах окна (`clientY`).                                                                                                                         |
| `onClose`          | `(restoreFocus: boolean) => void`   | Обязательный колбэк: меню просит закрыться. `restoreFocus` равен `true` после выбора пункта, `Escape` и `Tab` (верните фокус на элемент, откуда меню открыли), и `false` при нажатии вне меню, прокрутке, изменении размера окна и потере фокуса окном. |
| `activateFirst`    | `boolean`                           | Сразу подсветить первый доступный пункт. Используйте при открытии с клавиатуры. По умолчанию `false`.                                                                                           |
| `aria-label`       | `string`                            | Доступное имя меню. Рекомендуется задавать: без него скринридер читает просто «меню».                                                                                                         |
| `className`        | `string`                            | Пользовательский CSS-класс для панели меню.                                                                                                                                                     |

Типы `ContextMenuProps`, `ContextMenuAction`, `ContextMenuSeparator` и `ContextMenuItem` экспортируются из пакета.

### 2. Пункт меню (`ContextMenuAction`)

| Название параметра | Тип          | Описание                                                                                                                      |
| ------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `string`     | Обязательный идентификатор, уникальный в пределах меню (используется как `key`).                                              |
| `label`            | `ReactNode`  | Текст пункта. Обрезается многоточием, если не помещается.                                                                      |
| `icon`             | `ReactNode`  | Иконка `16×16px`. Если иконка есть хотя бы у одного пункта, под иконки резервируется место у всех.                            |
| `hint`             | `string`     | Подсказка справа, например сочетание клавиш. Только отображается: клавиши не привязываются.                                    |
| `danger`           | `boolean`    | Красный пункт для опасных действий.                                                                                           |
| `disabled`         | `boolean`    | Затемняет пункт (`aria-disabled="true"`), пропускается при навигации с клавиатуры, выбрать его нельзя.                        |
| `onSelect`         | `() => void` | Вызывается после закрытия меню (сначала `onClose(true)`, потом `onSelect`).                                                   |

### 3. Разделитель (`ContextMenuSeparator`)

Объект `{ type: "separator", id?: string }` рисует тонкую линию (`role="separator"`) между группами пунктов.

## Быстрый старт

```tsx
import { useState } from "react";
import { ContextMenu, type ContextMenuItem } from "@ui-kit/components";

const items: ContextMenuItem[] = [
  { id: "open", label: "Открыть", hint: "Enter", onSelect: () => open() },
  { id: "rename", label: "Переименовать", hint: "F2", onSelect: () => rename() },
  { type: "separator" },
  { id: "delete", label: "Удалить", danger: true, onSelect: () => remove() },
];

export default function App() {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      Нажмите правой кнопкой мыши
      {menu && (
        <ContextMenu
          aria-label="Действия с файлом"
          items={items}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
```

## Примеры использования

### 1. Открытие с клавиатуры и возврат фокуса

Передайте `activateFirst`, когда меню открыто клавишей, и верните фокус на исходный элемент, если `onClose` получил `restoreFocus = true`.

```tsx
const triggerRef = useRef<HTMLElement | null>(null);
const [menu, setMenu] = useState<{ x: number; y: number; keyboard: boolean } | null>(null);

const openFromKeyboard = (e: React.KeyboardEvent<HTMLElement>) => {
  if (e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) {
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    triggerRef.current = e.currentTarget;
    setMenu({ x: r.left, y: r.bottom, keyboard: true });
  }
};

{menu && (
  <ContextMenu
    items={items}
    x={menu.x}
    y={menu.y}
    activateFirst={menu.keyboard}
    onClose={(restoreFocus) => {
      setMenu(null);
      if (restoreFocus) triggerRef.current?.focus();
    }}
  />
)}
```

### 2. Иконки, подсказки и недоступные пункты

```tsx
const items: ContextMenuItem[] = [
  { id: "copy", label: "Копировать", icon: <CopyIcon />, hint: "Ctrl+C", onSelect: copy },
  { id: "paste", label: "Вставить", icon: <PasteIcon />, hint: "Ctrl+V", disabled: !canPaste },
];
```

### 3. Использование в `List` и `DataGrid`

`List` и `DataGrid` открывают `ContextMenu` сами: достаточно вернуть массив пунктов из `itemMenu` и `rowMenu` (см. `docs/list.md` и `docs/dataGrid.md`). Меню открывается по правому клику, а также клавишей `ContextMenu` и `Shift+F10`.

### 4. Клавиатура и доступность

- Панель — `role="menu"` с виртуальным фокусом: сам фокус остаётся на контейнере, а текущий пункт указывается через `aria-activedescendant`.
- `ArrowDown` и `ArrowUp` двигают подсветку по кругу, `Home` и `End` переходят к первому и последнему пункту, буква переводит к следующему пункту, чья подпись начинается с неё.
- `Enter` и `Space` выбирают подсвеченный пункт, `Escape` и `Tab` закрывают меню (с `restoreFocus = true`).
- Подсветка следует и за указателем (`onMouseMove`).
- Клавиши меню останавливают всплытие, поэтому `Escape` не закрывает расположенный под меню `Modal`.
- При `forced-colors: active` подсвеченный пункт выделяется `Highlight` и `HighlightText`.

## Ограничения

- **Управляется родителем:** Компонент не обрабатывает `contextmenu` и не хранит состояние открытости. Ему нужны координаты `x` и `y` и колбэк `onClose`; без `onClose` меню не закроется.
- **Закрытие по событиям окна:** Меню закрывается (`onClose(false)`) при нажатии вне панели, прокрутке вне панели, изменении размера окна и потере фокуса окном (`blur`). Правый клик внутри панели браузерное меню не открывает.
- **Нет подменю и анимации закрытия:** Поддерживается один уровень пунктов; при закрытии меню исчезает сразу.
- **Подсказки не привязывают клавиши:** `hint` только выводит текст. Обработку сочетаний клавиш нужно написать самому.
- **Позиция считается один раз:** Точка раскрытия учитывается при показе и при смене `x`, `y` или `items`. Если места справа или снизу не хватает, меню раскрывается влево или вверх от точки, а затем сдвигается внутрь окна (отступ `8px`). Размеры окна берутся без полосы прокрутки.
- **Цвета:** Панель использует `--material-popover-bg` с размытием. Красный `danger` на светлом фоне имеет контраст около `3.5:1`.
- **Подписи:** Для скринридера задавайте `aria-label` на меню.
- **Зависимость от глобальных стилей:** Для типографики пунктов подключите класс `BodyTextBlockStyle` и токены темы.
