# Checkbox

Флажок выбора на базе нативного `<input type="checkbox">` с плавной SVG-отрисовкой галочки, поддержкой смешанного состояния (`indeterminate`), настраиваемым положением подписи и автоматической блокировкой при отправке формы.

## Параметры

| Название параметра | Тип                                                                                                               | Описание                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`            | `ReactNode`                                                                                                       | Текстовая подпись рядом с чекбоксом. Значения `undefined`, `null` и `false` не рендерятся. Если подпись не передана, укажите `aria-label`.               |
| `labelPlacement`   | `"end" \| "start"`                                                                                                | Положение подписи: `"end"` (по умолчанию, справа от чекбокса) или `"start"` (слева от чекбокса).                                                         |
| `indeterminate`    | `boolean`                                                                                                         | Смешанное (частично выбранное) состояние: рисует тире вместо галочки и синхронизирует нативное DOM-свойство `input.indeterminate`. По умолчанию `false`. |
| `checked`          | `boolean`                                                                                                         | Состояние чекбокса в контролируемом режиме.                                                                                                              |
| `defaultChecked`   | `boolean`                                                                                                         | Начальное состояние в неконтролируемом режиме (при динамическом обновлении пропа компонент синхронизирует DOM-состояние автоматически).                  |
| `onChange`         | `ChangeEventHandler<HTMLInputElement>`                                                                            | Обработчик переключения состояния.                                                                                                                       |
| `disabled`         | `boolean`                                                                                                         | Отключает чекбокс. Также автоматически переходит в `disabled`, когда родительская `<form>` находится в состоянии `pending` (`useFormStatus`).            |
| `className`        | `string`                                                                                                          | Пользовательский CSS-класс. Применяется к корневому элементу `<label>`.                                                                                  |
| `style`            | `CSSProperties`                                                                                                   | Инлайн-стили. Применяются к корневому элементу `<label>`.                                                                                                |
| `ref`              | `Ref<HTMLInputElement>`                                                                                           | Ссылка на нативный элемент `<input type="checkbox">`.                                                                                                    |
| `...rest`          | `Omit<InputHTMLAttributes<HTMLInputElement>, "type" \| "role" \| "size" \| "children" \| "className" \| "style">` | Остальные нативные атрибуты `<input>` (`name`, `value`, `id`, `required`, `aria-*` и др.).                                                               |

## Быстрый старт

```tsx
import { Checkbox } from "@ui-kit/components";

export default function App() {
  return (
    <Checkbox
      label="Запомнить меня"
      defaultChecked
      onChange={(e) => console.log("Checked:", e.target.checked)}
    />
  );
}
```

## Примеры использования

### 1. Контролируемый и неконтролируемый режимы

Компонент поддерживает оба стандартных подхода React. Если подпись не нужна, обязательно передайте `aria-label` для экранных дикторов.

```tsx
const [agreed, setAgreed] = useState(false);

{
  /* Контролируемый с подписью */
}
<Checkbox
  label="Я принимаю условия использования"
  checked={agreed}
  onChange={(e) => setAgreed(e.target.checked)}
/>;

{
  /* Неконтролируемый без подписи */
}
<Checkbox aria-label="Выбрать строку" defaultChecked={false} />;
```

### 2. Смешанное состояние (`indeterminate`) для главного чекбокса

Свойство `indeterminate` используется для родительского чекбокса «Выбрать все», когда выбрана только часть дочерних элементов. Компонент принудительно удерживает DOM-свойство `input.indeterminate` в соответствии с пропом даже после пользовательского клика.

```tsx
const [items, setItems] = useState({ a: true, b: false, c: false });
const values = Object.values(items);
const allChecked = values.every(Boolean);
const someChecked = values.some(Boolean) && !allChecked;

<Checkbox
  label="Выбрать все параметры"
  checked={allChecked}
  indeterminate={someChecked}
  onChange={(e) => {
    const next = e.target.checked;
    setItems({ a: next, b: next, c: next });
  }}
/>;
```

### 3. Подпись слева (`labelPlacement="start"`) и работа в формах

С помощью `labelPlacement="start"` и растягивания корневого `<label>` можно делать строки настроек. Внутри `<form>` чекбокс сам блокируется на время выполнения Server Action (`useFormStatus`).

```tsx
<form action={formAction}>
  <Checkbox
    name="newsletter"
    value="yes"
    label="Получать еженедельный дайджест"
    labelPlacement="start"
    defaultChecked={state?.newsletter}
    style={{ width: "100%", justifyContent: "space-between" }}
  />
  <button type="submit">Сохранить</button>
</form>
```

## Ограничения

- **Стилизация через `className` и `style`:** Оба свойства передаются на внешнюю обёртку `<label>`, а не на `<input>`.
- **Зарезервированные атрибуты:** Пропсы `type`, `role`, `size` и `children` исключены из типов. Текст подписи передаётся только через проп `label`.
- **Пустая строка в `label`:** Проверка `hasLabel` отсекает только `undefined`, `null` и `false`. Если передать `label=""`, отрендерится пустой `<span className={styles.label}>`, из-за чего появится лишний отступ (`gap`).
- **Поддержка браузерами:** Стили компонента опираются на CSS-селектор `:has()` (требуется Chrome 105+, Safari 15.4+, Firefox 121+).
