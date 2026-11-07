# Toolbar

Система компонентов панели инструментов (`Toolbar`, `ToolbarGroup`, `ToolbarButton`, `ToolbarDivider`, `ToolbarSpacer`) для компоновки заголовка и групп действий внутри шапки страницы `Page`.

## Параметры

### 1. Свойства `Toolbar` (`ToolbarProps`)

| Название параметра | Тип                                                        | Описание                                                                                                    |
| ------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `leading`          | `ReactNode`                                                | Левая зона перед заголовком страницы (например, кнопка «Назад» или боковые действия).                       |
| `title`            | `ReactNode`                                                | Заголовок панели инструментов (рендерится внутри левой зоны сразу после `leading`).                         |
| `center`           | `ReactNode`                                                | Центральная зона для основных групп частых действий. Центрируется в доступном пространстве.                 |
| `trailing`         | `ReactNode`                                                | Правая зона для поиска, второстепенных кнопок и главного действия страницы (всегда прижата к правому краю). |
| `className`        | `string`                                                   | Пользовательский CSS-класс для корневого элемента `<header>`.                                               |
| `ref`              | `Ref<HTMLElement>`                                         | Ссылка на корневой `<header>`.                                                                              |
| `...rest`          | `Omit<HTMLAttributes<HTMLElement>, "title" \| "children">` | Остальные нативные атрибуты `<header>` (`style`, `id`, `aria-label`, `role`, `data-*` и др.). Роль `toolbar` не задана; если нужна, передайте `role="toolbar"` и `aria-label` сами (клавиатурную навигацию стрелками при этом нужно реализовать самостоятельно).                       |

### 2. Свойства `ToolbarGroup` (`ToolbarGroupProps`)

| Название параметра | Тип                                                | Описание                                                                                                      |
| ------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `children`         | `ReactNode`                                        | Дочерние элементы группы (`ToolbarButton`, `ToolbarDivider`, `MenuButton` с `appearance="plain"`).            |
| `height`           | `number`                                           | Высота стеклянной капсулы в пикселях. По умолчанию `36` (`TOOLBAR_GROUP_HEIGHT`).                             |
| `width`            | `number \| string`                                 | Ширина стеклянной капсулы. По умолчанию `"auto"`.                                                             |
| `ref`              | `Ref<HTMLDivElement>`                              | Ссылка на корневой элемент группы.                                                                            |
| `className`        | `string`                                           | Пользовательский CSS-класс для обёртки `FrostedGlass` (`role="group"`).                                        |
| `style`            | `CSSProperties`                                    | Инлайн-стили для `FrostedGlass` (накладываются поверх базового тона `backgroundColor: "var(--toolbar-tint)"`). |
| `...rest`          | `Omit<HTMLAttributes<HTMLDivElement>, "children">` | Остальные атрибуты `<div>`, пробрасываемые на `FrostedGlass`. Передавайте `aria-label` или `aria-labelledby`: у `role="group"` должно быть имя, иначе скринридер читает просто «группа».                                                  |

### 3. Свойства `ToolbarButton` (`ToolbarButtonProps`)

| Название параметра | Тип                                       | Описание                                                                                                                          |
| ------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `icon`             | `ReactNode`                               | Иконка кнопки (отображается перед `children`). Если кнопка содержит только иконку без текста, TypeScript требует `aria-label` или `aria-labelledby`. |
| `children`         | `ReactNode`                               | Текстовая подпись кнопки.                                                                                                         |
| `type`             | `"button" \| "submit" \| "reset"`         | Нативный тип кнопки. По умолчанию `"button"`.                                                                                     |
| `className`        | `string`                                  | Пользовательский CSS-класс для элемента `<button>`.                                                                               |
| `ref`              | `Ref<HTMLButtonElement>`                  | Ссылка на нативный элемент `<button>`.                                                                                            |
| `...rest`          | `ButtonHTMLAttributes<HTMLButtonElement>` | Остальные атрибуты `<button>` (`onClick`, `disabled`, `form`, `formAction`, `aria-*` и др.).                                      |

### 4. Свойства `ToolbarSpacer` (`ToolbarSpacerProps`) и `ToolbarDivider`

| Компонент / Параметр         | Тип       | Описание                                                                                                                                                                                  |
| ---------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ToolbarSpacer` (`flexible`) | `boolean` | Пробел между элементами тулбара (`aria-hidden="true"`). При `false` (по умолчанию) имеет ширину `8px`, а с учётом зазора `12px` по обе стороны (`gap` зоны) расстояние между соседями получается `32px`. При `true` — растягивается на всё свободное место (`flex: 1 1 0`). |
| `ToolbarDivider`             | —         | Вертикальный разделитель `1×16px` (`role="separator"`, `aria-orientation="vertical"`) для разделения кнопок внутри `ToolbarGroup`. Не принимает параметров.                               |

## Быстрый старт

```tsx
import {
  Toolbar,
  ToolbarGroup,
  ToolbarButton,
  ToolbarDivider,
  Button,
} from "@ui-kit/components";

export default function AppHeader() {
  return (
    <Toolbar
      title="Документы"
      center={
        <ToolbarGroup aria-label="Инструменты списка">
          <ToolbarButton icon={<SortIcon />} aria-label="Сортировка" />
          <ToolbarDivider />
          <ToolbarButton icon={<FilterIcon />} aria-label="Фильтр" />
        </ToolbarGroup>
      }
      trailing={<Button appearance="primary">Создать</Button>}
    />
  );
}
```

## Примеры использования

### 1. Использование внутри компонента `Page` и правило «против стекла в стекле»

Одиночные кнопки (`Button`) и поле поиска (`SearchField`) уже имеют собственную подложку, поэтому они размещаются в зонах тулбара напрямую. В `ToolbarGroup` оборачиваются только две и более связанные кнопки `ToolbarButton` (или `MenuButton` с `appearance="plain"`), у которых нет собственного стекла.

```tsx
<Page
  title="Файлы"
  onBack={goBack}
  toolbar={{
    center: (
      <ToolbarGroup>
        <ToolbarButton icon={<SortIcon />} aria-label="Сортировка" />
        <ToolbarDivider />
        <ToolbarButton icon={<FilterIcon />} aria-label="Фильтр" />
        <ToolbarDivider />
        <ToolbarButton icon={<TrashIcon />} aria-label="Удалить" />
      </ToolbarGroup>
    ),
    trailing: (
      <>
        <SearchField placeholder="Поиск файлов…" width={220} />
        <Button icon={<MoreIcon />} aria-label="Ещё" />
        <Button appearance="primary">Готово</Button>
      </>
    ),
  }}
>
  {/* Контент страницы */}
</Page>
```

### 2. Привязка кнопок тулбара к форме на странице (`form` и `formAction`)

Шапка и форма — соседние элементы страницы, поэтому кнопка тулбара оказывается вне `<form>`. Используйте атрибут `form={formId}` и `type="submit"` / `type="reset"`, чтобы управлять формой из тулбара.

```tsx
const formId = "article-edit-form";

<Toolbar
  title="Редактирование"
  trailing={
    <>
      <ToolbarGroup>
        <ToolbarButton type="reset" form={formId} disabled={isPending}>
          Сбросить
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          type="submit"
          form={formId}
          formAction={saveDraftAction}
          disabled={isPending}
        >
          В черновик
        </ToolbarButton>
      </ToolbarGroup>

      <Button
        type="submit"
        form={formId}
        appearance="primary"
        disabled={isPending}
        width={130}
      >
        {isPending ? "Сохранение…" : "Сохранить"}
      </Button>
    </>
  }
/>;
```

### 3. Разделение групп с помощью `ToolbarSpacer`

Используйте `ToolbarSpacer` для добавления фиксированного (ширина `8px`, вместе с зазорами зоны `32px`) или гибкого (`flexible`) расстояния между группами элементов внутри одной зоны.

```tsx
<Toolbar
  leading={<Button icon={<SidebarIcon />} aria-label="Боковая панель" />}
  center={
    <>
      <ToolbarGroup>
        <ToolbarButton icon={<UndoIcon />} aria-label="Отменить" />
        <ToolbarDivider />
        <ToolbarButton icon={<RedoIcon />} aria-label="Повторить" />
      </ToolbarGroup>
      <ToolbarSpacer />
      <ToolbarGroup>
        <ToolbarButton icon={<BoldIcon />} aria-label="Жирный" />
        <ToolbarButton icon={<ItalicIcon />} aria-label="Курсив" />
      </ToolbarGroup>
    </>
  }
/>
```

### 4. Кнопки-переключатели и состояния

`ToolbarButton` реагирует на наведение (`--fill-secondary`) и нажатие (`--fill-primary`). Включённое состояние показывается стилем для `aria-pressed="true"` (или `aria-current="true"`).

```tsx
<ToolbarGroup aria-label="Форматирование">
  <ToolbarButton
    icon={<BoldIcon />}
    aria-label="Жирный"
    aria-pressed={bold}
    onClick={() => setBold(!bold)}
  />
  <ToolbarButton
    icon={<ItalicIcon />}
    aria-label="Курсив"
    aria-pressed={italic}
    onClick={() => setItalic(!italic)}
  />
</ToolbarGroup>
```

### 5. Раскладка зон

Зоны `Toolbar` лежат в одной строке с зазором `12px`. `leading` и `title` не сжимаются (сжимается только заголовок с многоточием), `center` занимает всё оставшееся место и центрирует содержимое между левой и правой зонами, `trailing` всегда прижат к правому краю и не сжимается. Высота кнопки `ToolbarButton` равна высоте группы минус `4px`, минимальная ширина `32px`. Константа `TOOLBAR_GROUP_HEIGHT` (`36`) экспортируется из пакета.

## Ограничения

- **Запрет на вложение стеклянных компонентов в `ToolbarGroup`:** Не помещайте `<Button>`, `<SearchField>` или `<MenuButton appearance="glass">` внутрь `<ToolbarGroup>`. Вложенный `backdrop-filter` не видит фон страницы сквозь родительское стекло и создаёт визуальные артефакты.
- **Отсутствие авто-блокировки через `useFormStatus`:** В отличие от `Button`, компонент `ToolbarButton` не вызывает внутри себя `useFormStatus()`, поэтому при отправке формы состояние `disabled={isPending}` нужно передавать явно.
- **Перезапись системного тона группы:** `ToolbarGroup` задаёт цвет стекла через инлайн-стиль `backgroundColor: "var(--toolbar-tint)"`. Если передать собственный `backgroundColor` в проп `style`, он перезапишет системный тон.
- **Кнопки-иконки требуют имя:** Тип `ToolbarButtonProps` разрешает `icon` без `children` только вместе с `aria-label` или `aria-labelledby`. Для кнопки с текстом имя не нужно.
- **Узкие экраны:** Зоны не сворачиваются и не переносятся, поэтому широкая панель в `trailing` может выйти за пределы шапки.
- **Высокая контрастность:** В режиме `forced-colors` у группы появляется рамка, а кнопки используют системные цвета (`ButtonText`, `Highlight`, `GrayText`).
