# Modal

Модальное окно поверх страницы с затемнённым фоном, ловушкой фокуса, встроенной обработкой отправки форм и ошибок, которое можно использовать как декларативно через `<Modal>`, так и императивно из любого места приложения через `ModalProvider` и хук `useModal()`.

## Параметры

### 1. Свойства `Modal` (`ModalProps`)

| Название параметра     | Тип                                                         | Описание                                                                                                                                                                                           |
| ---------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isOpen`               | `boolean`                                                   | Управляет открытием окна. При закрытии проигрывается выходная анимация, после чего окно размонтируется из DOM (`onAnimationEnd`).                                                                  |
| `onClose`              | `() => void`                                                | Вызывается при запросе на закрытие окна (кнопка-крестик, клавиша `Escape`, клик по фону или успешное завершение действия).                                                                         |
| `title`                | `ReactNode`                                                 | Заголовок модального окна в шапке (`aria-labelledby`).                                                                                                                                             |
| `children`             | `ReactNode \| ((props: ModalFormRenderProps) => ReactNode)` | Содержимое окна: обычный JSX (например, для диалога подтверждения) или render-функция для интеграции с формой.                                                                                     |
| `actionText`           | `string`                                                    | Текст кнопки основного действия в футере. Если передан `onAction` или `children`-функция без `actionText`, по умолчанию выводится `"Подтвердить"`.                                                 |
| `actionAppearance`     | `"normal" \| "primary" \| "destructive"`                    | Визуальный вариант кнопки действия (`ButtonAppearance`). По умолчанию `"primary"`.                                                                                                                 |
| `onAction`             | `() => void \| Promise<void>`                               | Обработчик нажатия на кнопку действия в футере (если внутри не зарегистрирован обработчик формы через `registerAction`).                                                                           |
| `onError`              | `(error: unknown) => void`                                  | Колбэк, вызываемый при перехвате исключения из `onAction` или `registerAction`.                                                                                                                    |
| `errorMessage`         | `ReactNode \| ((error: unknown) => ReactNode)`              | Сообщение или функция форматирования ошибки для отображения в футере (`role="alert"`), если действие завершилось исключением. По умолчанию `"Не удалось выполнить действие. Попробуйте ещё раз."`. |
| `width`                | `number \| string`                                          | Ширина окна (число означает пиксели). По умолчанию `480`. На мобильных экранах (по стилям) растягивается на весь экран.                                                                            |
| `closeOnBackdropClick` | `boolean`                                                   | Разрешает закрытие окна кликом по затемнённому фону (оверлею). По умолчанию `true`.                                                                                                                |

### 2. Аргументы функции `children` / `content` (`ModalFormRenderProps`)

| Название параметра | Тип                                         | Описание                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `formId`           | `string`                                    | Сгенерированный `id`, который нужно передать тегу `<form id={formId}>`. Связывает кнопку в футере и нажатие `Enter` в текстовых полях с нативной валидацией (`requestSubmit` / `reportValidity`) и отправкой этой формы. |
| `isSubmitting`     | `boolean`                                   | Флаг активного выполнения асинхронного действия (`true` во время работы `onAction` / `registerAction`). Используется для блокировки полей формы (`disabled={isSubmitting}`).                                             |
| `registerAction`   | `(fn: () => void \| Promise<void>) => void` | Регистрирует функцию отправки изнутри компонента формы. Имеет приоритет над внешним `onAction`.                                                                                                                          |

### 3. Контекст `ModalProvider` и хук `useModal()`

| Название параметра | Тип                                   | Описание                                                                                                                                                                                                     |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openModal`        | `(options: OpenModalOptions) => void` | Открывает новое модальное окно с переданными параметрами (`OpenModalOptions` включает все поля `ModalProps`, кроме `isOpen` и `children`, заменяя `children` на `content` и делая `onClose` необязательным). |
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

### 2. Вызов формы и окна подтверждения из хука страницы (`openModal` + `useOptimistic`)

В бизнес-логике страницы можно открывать разные модальные окна через единый `openModal`: для формы отключать закрытие по клику на фон (`closeOnBackdropClick: false`) и передавать функцию форматирования ошибок `errorMessage: getErrorMessage`, а для удаления использовать `actionAppearance: "destructive"`.

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

## Ограничения

- **Одно активное окно в `ModalProvider`:** Вызов `openModal()` при уже открытом модальном окне заменяет его новым (увеличивая внутренний `modalKey`) без стека или очереди вложенных модальных окон.
- **Перехват `onSubmit` у формы с `id={formId}`:** В `handleDialogSubmit` любое событие `submit` от `<form id={formId}>` перехватывается через `e.preventDefault()` и перенаправляется в `executeAction()`. Поэтому работа с формами внутри `Modal` должна строиться через `registerAction` или `onAction` (при отсутствии обоих окно просто вызовет `onClose()`).
- **Отсутствие внешних пропсов `isSubmitting` и `error`:** В актуальном коде `Modal.tsx` состояние загрузки (`isSubmitting`) и ошибка футера (`actionError`) управляются строго внутри компонента при выполнении промиса из `registerAction` / `onAction`. Чтобы отобразить серверную ошибку в футере и оставить окно открытым, обработчик должен выбросить исключение (`throw new Error(...)`).
- **Зависимость размонтирования от CSS-анимации:** Удаление закрытого окна из DOM (`setShouldRender(false)`) происходит в `onAnimationEnd` на элементе `.overlay`. Если в CSS полностью убрать анимацию закрытия оверлея (`animation: none`), событие `animationend` не сработает и закрытое окно останется в DOM (блокируя `document.body.style.overflow = "hidden"`).
- **Только внутри `<ModalProvider>` для хука:** Вызов `useModal()` вне дерева `<ModalProvider>` выбросит ошибку `"useModal должен использоваться внутри <ModalProvider>"`.
