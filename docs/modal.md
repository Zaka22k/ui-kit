# Modal

Модальное окно поверх страницы с затемнённым фоном, ловушкой фокуса, блокировкой остальной страницы (`inert`), встроенной обработкой отправки форм и ошибок, которое можно использовать как декларативно через `<Modal>`, так и императивно из любого места приложения через `ModalProvider` и хук `useModal()`.

## Параметры

### 1. Свойства `Modal` (`ModalProps`)

| Название параметра     | Тип                                                         | Описание                                                                                                                                                                                           |
| ---------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isOpen`               | `boolean`                                                   | Управляет открытием окна. При закрытии проигрывается выходная анимация, после чего окно размонтируется из DOM (по `animationend`, а если событие не пришло — через `600 мс`).                                                                  |
| `onClose`              | `() => void`                                                | Вызывается без аргументов при запросе на закрытие окна (кнопка-крестик, клавиша `Escape`, клик по фону или успешное завершение действия). Пока выполняется действие, закрытие через крестик, `Escape` и фон заблокировано.                                                                         |
| `title`                | `ReactNode`                                                 | Заголовок окна. Выводится как `<h2>` и служит доступным именем диалога (`aria-labelledby`).                                                                                                                                             |
| `children`             | `ReactNode \| ((props: ModalFormRenderProps) => ReactNode)` | Содержимое окна: обычный JSX (например, для диалога подтверждения) или render-функция для интеграции с формой.                                                                                     |
| `actionText`           | `string`                                                    | Текст кнопки основного действия в футере. Если передан `onAction` или `children`-функция без `actionText`, по умолчанию выводится `"Подтвердить"`.                                                 |
| `actionAppearance`     | `"normal" \| "primary" \| "destructive"`                    | Визуальный вариант кнопки действия (`ButtonAppearance`). По умолчанию `"primary"`.                                                                                                                 |
| `onAction`             | `() => void \| Promise<void>`                               | Обработчик нажатия на кнопку действия в футере (если внутри не зарегистрирован обработчик формы через `registerAction`).                                                                           |
| `onError`              | `(error: unknown) => void`                                  | Колбэк, вызываемый при перехвате исключения из `onAction` или `registerAction`.                                                                                                                    |
| `errorMessage`         | `ReactNode \| ((error: unknown) => ReactNode)`              | Сообщение или функция форматирования ошибки для отображения в футере (`role="alert"`), если действие завершилось исключением. По умолчанию `"Не удалось выполнить действие. Попробуйте ещё раз."`. |
| `width`                | `number \| string`                                          | Ширина окна (число означает пиксели). По умолчанию `480`. На мобильных экранах (по стилям) растягивается на весь экран.                                                                            |
| `closeLabel`           | `string`                                                    | Доступное имя кнопки-крестика. По умолчанию `"Закрыть модальное окно"`.                                                                                                                         |
| `closeOnBackdropClick` | `boolean`                                                   | Разрешает закрытие окна кликом по затемнённому фону (оверлею). Клик должен начаться и закончиться на фоне, поэтому выделение текста с выходом за границы окна его не закрывает. По умолчанию `true`.                                                                                                                |

### 2. Аргументы функции `children` / `content` (`ModalFormRenderProps`)

| Название параметра | Тип                                         | Описание                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `formId`           | `string`                                    | Сгенерированный `id`, который нужно передать тегу `<form id={formId}>`. Связывает кнопку в футере и нажатие `Enter` в текстовых полях с нативной валидацией (`requestSubmit` / `reportValidity`) и отправкой этой формы. |
| `isSubmitting`     | `boolean`                                   | Флаг активного выполнения асинхронного действия (`true` во время работы `onAction` / `registerAction`). Используется для блокировки полей формы (`disabled={isSubmitting}`).                                             |
| `registerAction`   | `(fn: () => void \| Promise<void>) => void` | Регистрирует функцию отправки изнутри компонента формы. Имеет приоритет над внешним `onAction`.                                                                                                                          |

### 3. Контекст `ModalProvider` и хук `useModal()`

| Название параметра | Тип                                   | Описание                                                                                                                                                                                                     |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openModal`        | `(options: OpenModalOptions) => void` | Открывает новое модальное окно с переданными параметрами (`OpenModalOptions` включает все поля `ModalProps`, кроме `isOpen` и `children`, заменяя `children` на `content` и делая `onClose` необязательным). Типы `ModalProps`, `ModalFormRenderProps` и `OpenModalOptions` экспортируются из пакета. |
| `closeModal`       | `() => void`                          | Программно закрывает текущее открытое через провайдер модальное окно и вызывает его `onClose`.                                                                                                               |

## Быстрый старт

Оберните приложение в `ModalProvider` (например, в корневом `layout.tsx`):

```tsx
import { ModalProvider } from "@ui-kit/components";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModalProvider>{children}</ModalProvider>;
}
```

Вызывайте диалоговое окно из любого клиентского компонента через `useModal()` или используйте `<Modal>` напрямую:

```tsx
"use client";
import { useModal, Button } from "@ui-kit/components";

export function DeleteGroupButton({
  code,
  onDelete,
}: {
  code: string;
  onDelete: () => Promise<void>;
}) {
  const { openModal } = useModal();

  return (
    <Button
      appearance="destructive"
      onClick={() =>
        openModal({
          title: "Удаление группы",
          actionText: "Удалить",
          actionAppearance: "destructive",
          content: (
            <p>
              Вы действительно хотите удалить группу <strong>{code}</strong>?
            </p>
          ),
          onAction: onDelete,
        })
      }
    >
      Удалить
    </Button>
  );
}
```

## Примеры использования

### 1. Модальное окно с формой создания и редактирования (`registerAction` + `FormData`)

Компонент формы принимает `ModalFormRenderProps` (`formId`, `isSubmitting`, `registerAction`), привязывает `formId` к `<form>` и регистрирует асинхронный обработчик через `registerAction`. При клике на кнопку «Сохранить» в футере или нажатии `Enter` в любом текстовом поле модальное окно сначала запустит браузерную валидацию полей (`required`, `min`, `max`, `setCustomValidity`), а затем вызовет зарегистрированный колбэк. Если он выбросит ошибку, окно не закроется и выведет текст ошибки через `errorMessage` в футере.

```tsx
// GroupForm.tsx
"use client";

import { useEffect, useRef } from "react";
import { type ModalFormRenderProps, TextField } from "@ui-kit/components";
import type { Group, GroupInput } from "@/models";

interface Props extends ModalFormRenderProps {
  initial?: Group;
  onSubmit: (data: GroupInput) => void | Promise<void>;
}

function attachNoBlankValidation(input: HTMLInputElement | null) {
  if (!input) return;
  input.setCustomValidity(
    input.value.length > 0 && input.value.trim() === ""
      ? "Поле не может состоять из одних пробелов"
      : "",
  );
}

export default function GroupForm({
  formId,
  isSubmitting,
  registerAction,
  initial,
  onSubmit,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;

  useEffect(() => {
    registerAction(async () => {
      const form = formRef.current;
      if (!form) return;

      const formData = new FormData(form);

      await submitRef.current({
        group_code: String(formData.get("group_code") ?? "").trim(),
        group_name: String(formData.get("group_name") ?? "").trim(),
        education_program: String(
          formData.get("education_program") ?? "",
        ).trim(),
        admission_year: Number(formData.get("admission_year")),
      });
    });
  }, [registerAction]);

  return (
    <form
      ref={formRef}
      id={formId}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <TextField
        label="Код группы"
        name="group_code"
        defaultValue={initial?.group_code ?? ""}
        required
        maxLength={20}
        onChange={(e) => attachNoBlankValidation(e.currentTarget)}
        disabled={isSubmitting}
      />
      <TextField
        label="Название"
        name="group_name"
        defaultValue={initial?.group_name ?? ""}
        required
        maxLength={100}
        onChange={(e) => attachNoBlankValidation(e.currentTarget)}
        disabled={isSubmitting}
      />
      <TextField
        label="Год набора"
        name="admission_year"
        type="number"
        defaultValue={
          initial?.admission_year !== undefined
            ? String(initial.admission_year)
            : ""
        }
        required
        min={2000}
        max={2100}
        step={1}
        disabled={isSubmitting}
      />
    </form>
  );
}
```

### 2. Вызов формы и окна подтверждения из хука страницы (`openModal`)

Пример взят из реального приложения: `Group`, `GroupForm`, `getErrorMessage`, `handleSubmitForm` и `actions` — код приложения, а не библиотеки. В бизнес-логике страницы можно открывать разные модальные окна через единый `openModal`: для формы отключать закрытие по клику на фон (`closeOnBackdropClick: false`) и передавать функцию форматирования ошибок `errorMessage: getErrorMessage`, а для удаления использовать `actionAppearance: "destructive"`.

```tsx
// Из хука useGroupsPage.tsx
const { openModal } = useModal();
const toast = useToast();

// 1. Открытие модального окна с формой (создание или редактирование)
const openForm = (group?: Group) => {
  const groupId = group?.group_id;

  openModal({
    title: groupId === undefined ? "Создание группы" : "Редактирование группы",
    actionText: "Сохранить",
    closeOnBackdropClick: false,
    errorMessage: getErrorMessage,
    content: (form) => (
      <GroupForm
        {...form}
        initial={group}
        onSubmit={(data) => handleSubmitForm(groupId, data)}
      />
    ),
  });
};

// 2. Открытие диалога подтверждения удаления
const openAlert = (group: Group) => {
  openModal({
    title: "Удаление группы",
    actionText: "Удалить",
    actionAppearance: "destructive",
    errorMessage: getErrorMessage,
    content: (
      <p className="BodyTextBlockStyle">
        Вы действительно хотите удалить группу{" "}
        <strong className="BodyStrongTextBlockStyle">{group.group_code}</strong>
        ?
      </p>
    ),
    onAction: async () => {
      await actions.deleteGroup(group.group_id);
      toast.success("Группа удалена");
    },
  });
};
```

### 3. Декларативное использование `<Modal>` без кнопки действия (информационное окно)

Если не передавать `actionText`, `onAction` и передавать в `children` обычный JSX (не функцию), футер с кнопкой действия не рендерится, а окно работает в режиме просмотра информации.

```tsx
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Справка по формату групп"
  width={560}
>
  <p>Код группы указывается в формате факультета и года поступления.</p>
</Modal>;
```

### 4. Поведение и доступность

- Окно имеет `role="dialog"`, `aria-modal="true"` и `aria-labelledby` на заголовок. Если `children` — обычный JSX (не функция), тело окна дополнительно связывается через `aria-describedby`; для форм описание не добавляется, чтобы скринридер не зачитывал все поля.
- Пока окно открыто, остальные дочерние элементы `<body>` получают `inert`, а после закрытия атрибут снимается. Исключение — тосты `ToastProvider`: они остаются доступными. Всплывающие списки, открытые из окна позже (например, `ComboBox`), в `inert` не попадают.
- Фокус заперт внутри окна (`Tab` и `Shift+Tab` ходят по кругу), при открытии он попадает в окно, а при закрытии возвращается на элемент, который был в фокусе до открытия.
- Прокрутка страницы блокируется, ширина полосы прокрутки компенсируется отступом, чтобы страница не сдвигалась. При нескольких открытых окнах блокировка общая.
- `Enter` в текстовом поле формы с `id={formId}` запускает проверку и отправку так же, как кнопка в футере.
- Любая другая форма внутри окна, у которой нет своего обработчика `submit` и атрибута `action`, при отправке запускает действие окна вместо перезагрузки страницы.

## Ограничения

- **Одно активное окно в `ModalProvider`:** Вызов `openModal()` при уже открытом модальном окне заменяет его новым (увеличивая внутренний `modalKey`) без стека или очереди вложенных модальных окон. `onClose` вытесненного окна при этом не вызывается.
- **Перехват `onSubmit` у формы с `id={formId}`:** В `handleDialogSubmit` событие `submit` от `<form id={formId}>` (и от необработанных форм без `action`) перехватывается через `e.preventDefault()` и перенаправляется в `executeAction()`. Поэтому работа с формами внутри `Modal` должна строиться через `registerAction` или `onAction` (при отсутствии обоих окно просто вызовет `onClose()`).
- **Отсутствие внешних пропсов `isSubmitting` и `error`:** В актуальном коде `Modal.tsx` состояние загрузки (`isSubmitting`) и ошибка футера (`actionError`) управляются строго внутри компонента при выполнении промиса из `registerAction` / `onAction`. Чтобы отобразить серверную ошибку в футере и оставить окно открытым, обработчик должен выбросить исключение (`throw new Error(...)`).
- **Размонтирование и CSS-анимация:** Закрытое окно удаляется из DOM по `animationend` на `.overlay`. Если анимации нет (`animation: none`, скрытая вкладка), окно всё равно удаляется запасным таймером через `600 мс`, поэтому блокировка прокрутки и ловушка фокуса не остаются навсегда.
- **Фиксированная шапка и отступ тела:** Шапка позиционируется `position: fixed` относительно окна (за счёт `transform: translateZ(0)` у `.modal`), а верхний отступ тела равен `78px`. Не убирайте `transform` и учитывайте это при смене размера шрифта.
- **Цвета текста:** Основной текст окна использует `--label-secondary`, а текст ошибки — `--system-red`; на белом фоне их контраст ниже `4.5:1` (около `3.98:1` и `3.55:1`).
- **Подписи по умолчанию:** Тексты «Закрыть модальное окно», «Подтвердить» и сообщение об ошибке заданы по-русски; меняются через `closeLabel`, `actionText` и `errorMessage`.
- **Только внутри `<ModalProvider>` для хука:** Вызов `useModal()` вне дерева `<ModalProvider>` выбросит ошибку `"useModal должен использоваться внутри <ModalProvider>"`.
