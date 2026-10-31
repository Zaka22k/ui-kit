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
| `className`        | `string`                                                   | Пользовательский CSS-класс для корневого элемента `<header role="toolbar">`.                                |
| `...rest`          | `Omit<HTMLAttributes<HTMLElement>, "title" \| "children">` | Остальные нативные атрибуты `<header>` (`style`, `id`, `aria-label`, `data-*` и др.).                       |

### 2. Свойства `ToolbarGroup` (`ToolbarGroupProps`)

| Название параметра | Тип                                                | Описание                                                                                                      |
| ------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `children`         | `ReactNode`                                        | Дочерние элементы группы (`ToolbarButton`, `ToolbarDivider`, `MenuButton` с `appearance="plain"`).            |
| `height`           | `number`                                           | Высота стеклянной капсулы в пикселях. По умолчанию `36` (`TOOLBAR_GROUP_HEIGHT`).                             |
| `width`            | `number \| string`                                 | Ширина стеклянной капсулы. По умолчанию `"auto"`.                                                             |
| `className`        | `string`                                           | Пользовательский CSS-класс для обёртки `LiquidGlass` (`role="group"`).                                        |
| `style`            | `CSSProperties`                                    | Инлайн-стили для `LiquidGlass` (накладываются поверх базового тона `backgroundColor: "var(--toolbar-tint)"`). |
| `...rest`          | `Omit<HTMLAttributes<HTMLDivElement>, "children">` | Остальные атрибуты `<div>`, пробрасываемые на `LiquidGlass`.                                                  |

### 3. Свойства `ToolbarButton` (`ToolbarButtonProps`)

| Название параметра | Тип                                       | Описание                                                                                                                          |
| ------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `icon`             | `ReactNode`                               | Иконка кнопки (отображается перед `children`). Если кнопка содержит только иконку без текста, обязательно передайте `aria-label`. |
| `children`         | `ReactNode`                               | Текстовая подпись кнопки.                                                                                                         |
| `type`             | `"button" \| "submit" \| "reset"`         | Нативный тип кнопки. По умолчанию `"button"`.                                                                                     |
| `className`        | `string`                                  | Пользовательский CSS-класс для элемента `<button>`.                                                                               |
| `ref`              | `Ref<HTMLButtonElement>`                  | Ссылка на нативный элемент `<button>`.                                                                                            |
| `...rest`          | `ButtonHTMLAttributes<HTMLButtonElement>` | Остальные атрибуты `<button>` (`onClick`, `disabled`, `form`, `formAction`, `aria-*` и др.).                                      |

### 4. Свойства `ToolbarSpacer` (`ToolbarSpacerProps`) и `ToolbarDivider`

| Компонент / Параметр         | Тип       | Описание                                                                                                                                                                                  |
| ---------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ToolbarSpacer` (`flexible`) | `boolean` | Пробел между элементами тулбара (`aria-hidden="true"`). При `false` (по умолчанию) создаёт фиксированный отступ `8px`, при `true` — растягивается на всё свободное место (`flex: 1 1 0`). |
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
  showBackButton
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

Когда шапка рендерится отдельно от `<form>` (например, через портал в `Page`), используйте атрибут `form={formId}` и `type="submit"` / `type="reset"`, чтобы управлять формой из тулбара.

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

Используйте `ToolbarSpacer` для добавления фиксированного (`8px`) или гибкого (`flexible`) расстояния между группами элементов внутри одной зоны.

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

## Ограничения

- **Запрет на вложение стеклянных компонентов в `ToolbarGroup`:** Не помещайте `<Button>`, `<SearchField>` или `<MenuButton appearance="glass">` внутрь `<ToolbarGroup>`. Вложенный `backdrop-filter` не видит фон страницы сквозь родительское стекло и создаёт визуальные артефакты.
- **Отсутствие авто-блокировки через `useFormStatus`:** В отличие от `Button`, компонент `ToolbarButton` не вызывает внутри себя `useFormStatus()`, поэтому при отправке формы состояние `disabled={isPending}` нужно передавать явно.
- **Перезапись системного тона группы:** `ToolbarGroup` задаёт цвет стекла через инлайн-стиль `backgroundColor: "var(--toolbar-tint)"`. Если передать собственный `backgroundColor` в проп `style`, он перезапишет системный тон.
- **Контроль доступности для кнопок-иконок:** В отличие от `Button`, тип `ToolbarButtonProps` не требует `aria-label` на уровне компиляции TypeScript, поэтому при передаче `icon` без `children` разработчик должен сам проследить за наличием `aria-label`.
