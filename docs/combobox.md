# ComboBox

Текстовое поле с выпадающим списком вариантов (по рекомендациям Apple HIG), позволяющее выбрать значение из списка или ввести произвольный текст, с поддержкой фильтрации, кастомного рендера опций, валидации и работы в формах.

## Параметры

| Название параметра | Тип | Описание |
| --- | --- | --- |
| `options` | `readonly T[]` | Обязательный массив вариантов выбора (строки, объекты или их комбинация). |
| `value` | `string` | Текущее значение поля в контролируемом режиме. |
| `defaultValue` | `string` | Начальное значение поля в неконтролируемом режиме. По умолчанию `""`. При динамическом изменении пропа или сбросе родительской формы (`reset`) состояние синхронизируется автоматически. |
| `onChange` | `(value: string, option: T \| null) => void` | Вызывается при изменении текста или выборе из списка. Если введённый текст совпал с подписью опции (без учёта регистра) или выбран из списка, вторым аргументом приходит объект опции `T`, иначе — `null`. |
| `valueKey` | `keyof T` | Ключ объекта опции, используемый как строковое значение (например, `"id"`). Игнорируется для строковых опций. |
| `labelKey` | `keyof T` | Ключ объекта опции, отображаемый пользователю в списке и поле ввода (например, `"name"`). |
| `getOptionValue` | `(option: T) => string` | Функция получения значения из опции. Имеет приоритет над `valueKey`. |
| `getOptionLabel` | `(option: T) => string` | Функция получения отображаемой подписи из опции. Имеет приоритет над `labelKey`. |
| `renderOption` | `(option: T, state: ComboBoxOptionState) => ReactNode` | Кастомный рендер содержимого пункта списка. В `state` передаются `{ label, value, selected, active, index }`. |
| `filter` | `boolean \| ((option: T, query: string, label: string) => boolean)` | Управление фильтрацией при вводе текста. По умолчанию `true` (поиск подстроки в `label` без учёта регистра). `false` отключает фильтрацию. |
| `label` | `ReactNode` | Вводная подпись поля (связывается с видимым `<input>` через `htmlFor`). Значения `undefined`, `null`, `false` и `""` не рендерятся. |
| `labelPlacement` | `"top" \| "start"` | Положение подписи: `"top"` (по умолчанию, над полем) или `"start"` (слева от поля, как в macOS). |
| `hint` | `ReactNode` | Текст подсказки под полем ввода (связывается через `aria-describedby`). |
| `error` | `ReactNode \| boolean` | Ошибка валидации: подсвечивает рамку красным, выставляет `aria-invalid="true"` и выводит текст ошибки вместо `hint` (если передан не `boolean`). |
| `toggleLabel` | `string` | Доступное имя (`aria-label`) для кнопки со стрелкой раскрытия списка. По умолчанию `"Показать варианты"`. |
| `disabled` | `boolean` | Блокирует поле и кнопку раскрытия. Также автоматически переходит в `disabled` во время отправки родительской формы (`useFormStatus`). |
| `name` | `string` | Имя поля для отправки в форме. Если задано (и поле не `disabled`), создаёт скрытый `<input type="hidden">`, отправляющий актуальное значение `value` (например, `id` выбранного объекта). |
| `className` | `string` | Пользовательский CSS-класс, применяется к корневому контейнеру (`div`). |
| `style` | `CSSProperties` | Инлайн-стили, применяются к корневому контейнеру (`div`). |
| `ref` | `Ref<HTMLInputElement>` | Ссылка на видимый элемент `<input role="combobox">`. |
| `...rest` | `Omit<InputHTMLAttributes<HTMLInputElement>, ...>` | Остальные нативные атрибуты `<input>` (`placeholder`, `id`, `form`, `onFocus`, `onBlur`, `onKeyDown` и др.). |

## Быстрый старт

```tsx
import { ComboBox } from "./ComboBox";

export default function App() {
  return (
    <ComboBox
      label="Город:"
      placeholder="Введите или выберите город"
      hint="Выберите из списка или впишите свой вариант"
      options={["Москва", "София", "Берлин", "Париж"]}
      defaultValue="София"
      onChange={(value, option) => console.log("Значение:", value, "Опция:", option)}
    />
  );
}
```

## Примеры использования

### 1. Работа с массивом объектов (`valueKey` и `labelKey`)
Когда опции представлены объектами, `ComboBox` показывает в текстовом поле свойство из `labelKey`, а в `onChange` и форму передаёт идентификатор из `valueKey`. Если пользователь введёт свой текст, не совпадающий ни с одной опцией, `option` будет равен `null`, а `value` — введённой строке.

```tsx
interface City {
  id: string;
  name: string;
  country: string;
}

const cities: City[] = [
  { id: "msk", name: "Москва", country: "Россия" },
  { id: "sof", name: "София", country: "Болгария" },
  { id: "ber", name: "Берлин", country: "Германия" },
];

<ComboBox
  label="Город назначения:"
  options={cities}
  valueKey="id"
  labelKey="name"
  defaultValue="sof"
  onChange={(value, city) => {
    // При выборе Софии: value === "sof", city === { id: "sof", name: "София", ... }
    // При вводе "Варна": value === "Варна", city === null
  }}
/>
```

### 2. Кастомная отрисовка пунктов (`renderOption`) и собственный фильтр (`filter`)
С помощью `renderOption` можно добавить в строку списка второстепенную информацию или иконки, а через функцию `filter` — искать сразу по нескольким полям объекта.

```tsx
<ComboBox
  label="Поиск города:"
  options={cities}
  valueKey="id"
  labelKey="name"
  filter={(city, query) =>
    `${city.name} ${city.country}`.toLowerCase().includes(query.toLowerCase())
  }
  renderOption={(city, { selected }) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontWeight: selected ? 600 : 400 }}>{city.name}</span>
      <span
        className="CaptionTextBlockStyle"
        style={{ color: "var(--TextFillColorTertiaryBrush)" }}
      >
        {city.country}
      </span>
    </div>
  )}
/>
```

### 3. Валидация, расположение подписи и управляемый режим
Габариты, стили ошибок и боковое расположение подписи (`labelPlacement="start"`) полностью совместимы с `TextField`.

```tsx
const [cityId, setCityId] = useState("msk");

<ComboBox
  label="Город:"
  labelPlacement="start"
  options={cities}
  valueKey="id"
  labelKey="name"
  value={cityId}
  onChange={(val) => setCityId(val)}
  error={!cityId && "Пожалуйста, укажите город"}
  hint="Начните печатать для фильтрации"
/>
```

### 4. Использование в формах с Server Actions (Next.js / React 19)
При указании пропа `name` компонент рендерит скрытый `<input type="hidden">`, поэтому в `FormData` отправляется чистое значение (`id` выбранного пункта или произвольный текст), а не его экранная подпись. Во время отправки формы поле автоматически блокируется через `useFormStatus`.

```tsx
<form action={formAction}>
  <ComboBox
    name="city"
    label="Город:"
    options={cities}
    valueKey="id"
    labelKey="name"
    defaultValue={state?.values?.city ?? "sof"}
    error={state?.errors?.city}
  />
  <button type="submit">Сохранить</button>
</form>
```

## Ограничения

- **Общее пространство значений и произвольного текста:** Компонент определяет отображаемую подпись, сверяя текущее `value` со значениями опций (`getOptionValue`). Если пользователь вручную введёт строку, которая случайно совпадает с техническим `id` одного из пунктов (например, `"sof"`), после потери фокуса поле автоматически заменит этот текст на `label` данного пункта (`"София"`).
- **Обязательность ключей для объектов:** Если элементы `options` являются объектами, но для них не переданы ни `valueKey` / `labelKey`, ни функции `getOptionValue` / `getOptionLabel`, их значения и подписи превратятся в пустые строки `""`.
- **Фиксированная оценка высоты пункта при позиционировании:** Для решения, открывать выпадающий список вниз или вверх, используется константа `ITEM_HEIGHT = 32` (`LIST_MAX_HEIGHT = 240`). Если через `renderOption` сделать пункты значительно выше 32px, расчёт свободного места у края экрана может оказаться неточным.
- **Стилизация через `className` и `style`:** Оба свойства попадают на корневой `div` поля, а не на `<input>` и не на выпадающий список (который рендерится через портал в `document.body` со слоем `--ZIndexPopup`).
- **Зарезервированные атрибуты:** Пропсы `type`, `role`, `size` и `children` исключены из типов и контролируются компонентом внутри.