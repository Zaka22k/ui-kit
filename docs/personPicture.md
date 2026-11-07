# PersonPicture

Аватар пользователя: изображение, инициалы или универсальный глиф, с бейджем уведомлений, текстовой подписью справа и интерактивным режимом. Источник данных выбирается каскадом: изображение → инициалы → первая буква почты или последние цифры телефона → глиф.

## Параметры

| Название параметра | Тип                          | Описание                                                                                                                                                                                                                            |
| ------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profilePicture`   | `string`                     | Прямой URL изображения. Приоритетнее изображений из `contact`.                                                                                                                                                                      |
| `displayName`      | `string`                     | Имя пользователя. Из него строятся инициалы, доступное имя и подпись справа.                                                                                                                                                        |
| `initials`         | `string`                     | Явные инициалы. Приводятся к верхнему регистру и обрезаются до 3 символов (считаются символы Unicode, поэтому emoji не разрезаются).                                                                                              |
| `contact`          | `ContactData`                | Объект контакта: `firstName`, `lastName`, `displayName`, `largeDisplayPicture`, `smallDisplayPicture`, `thumbnail`, `email`, `phone`.                                                                                                 |
| `preferSmallImage` | `boolean`                    | По умолчанию `false`. При `true` из `contact` сначала берётся `smallDisplayPicture`, затем `largeDisplayPicture`, затем `thumbnail`.                                                                                                |
| `size`             | `number`                     | Диаметр аватара в пикселях. По умолчанию `48`. Размер инициалов (`0.38 × size`) и глифа (`55%`) масштабируется вместе с ним; бейдж не масштабируется.                                                                              |
| `badgeNumber`      | `number`                     | Счётчик в правом нижнем углу. Приоритетнее `badgeText`. Значение `0` бейдж не показывает.                                                                                                                                           |
| `badgeText`        | `string`                     | Текст или символ в бейдже. Пустая строка бейдж не показывает.                                                                                                                                                                       |
| `badgeLabel`       | `string`                     | Доступный текст бейджа, например `"3 непрочитанных"`. По умолчанию в доступное имя добавляется само значение бейджа.                                                                                                                 |
| `showLabel`        | `boolean`                    | По умолчанию `false`. Выводит справа имя (или email, или телефон, если имени нет). Вторая строка — email или телефон из `contact` — появляется, только если есть имя.                                                                |
| `label`            | `ReactNode`                  | Основной текст подписи вместо автоматического. Включает блок подписи даже при `showLabel={false}`.                                                                                                                                   |
| `secondaryLabel`   | `ReactNode`                  | Вторичный текст подписи (должность, статус). Также включает блок подписи.                                                                                                                                                            |
| `interactive`      | `boolean`                    | Включает стили наведения, нажатия и фокуса. По умолчанию включается, если передан `onClick`. Роль `button` и фокус по `Tab` появляются только при наличии `onClick`.                                                                  |
| `disabled`         | `boolean`                    | По умолчанию `false`. Отключает интерактивность: `onClick` и `onKeyDown` не вызываются, ставится `aria-disabled`, компонент становится полупрозрачным (`opacity: 0.45`) и не получает указатель.                                      |
| `className`        | `string`                     | CSS-класс корневого `<div>`.                                                                                                                                                                                                         |
| `style`            | `CSSProperties`              | Инлайн-стили корневого `<div>` (объединяются с CSS-переменной `--pp-size`).                                                                                                                                                          |
| `ref`              | `Ref<HTMLDivElement>`        | Ссылка на корневой `<div>`.                                                                                                                                                                                                          |
| `...props`         | `HTMLAttributes<HTMLDivElement>` | Остальные атрибуты корневого элемента (`onClick`, `onKeyDown`, `id`, `data-*`, `aria-*`). Передаются в конец тега, поэтому `aria-label`, `aria-labelledby`, `role` и `title` можно переопределить.                               |

## Быстрый старт

```tsx
import { PersonPicture } from "@ui-kit/components";

export default function App() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      {/* Изображение; при ошибке загрузки покажутся инициалы */}
      <PersonPicture
        displayName="Betsy Sherman"
        profilePicture="/assets/BetsyShermanProfile.png"
      />

      {/* Инициалы из имени и бейдж */}
      <PersonPicture displayName="Иван Петров" badgeNumber={3} />

      {/* Кликабельная карточка с подписью справа */}
      <PersonPicture
        displayName="Анна Смирнова"
        secondaryLabel="В сети"
        showLabel
        onClick={() => console.log("Profile opened")}
      />

      {/* Универсальный глиф, когда данных нет */}
      <PersonPicture />
    </div>
  );
}
```

Из пакета экспортируются также типы `PersonPictureProps` и `ContactData`.

## Примеры использования

### 1. Объект `contact` и приоритет изображений

Изображение выбирается в порядке `largeDisplayPicture` → `smallDisplayPicture` → `thumbnail`; `preferSmallImage` меняет первые два местами. Если изображение не загрузилось, показываются инициалы, затем первая буква почты, затем последние две цифры телефона и, наконец, глиф.

```tsx
import { PersonPicture, type ContactData } from "@ui-kit/components";

const userContact: ContactData = {
  firstName: "Betsy",
  lastName: "Sherman",
  largeDisplayPicture: "/assets/betsy-large.png",
  smallDisplayPicture: "/assets/betsy-small.png",
  email: "betsy@example.com",
};

<PersonPicture contact={userContact} preferSmallImage size={40} />;
```

Инициалы из `displayName`: из одного слова — первые две буквы, из нескольких — первая буква первого и последнего слова.

### 2. Подпись справа

`showLabel` выводит имя и, если оно есть, email или телефон второй строкой. Произвольный текст задаётся через `label` и `secondaryLabel`.

```tsx
{/* Имя и email из contact */}
<PersonPicture contact={userContact} showLabel />

{/* Свой текст */}
<PersonPicture
  displayName="Алексей Волков"
  profilePicture="/assets/alexey.jpg"
  label="Алексей Волков"
  secondaryLabel="Ведущий дизайнер"
  size={44}
/>
```

### 3. Размер и бейдж

```tsx
<PersonPicture displayName="Мария К." size={32} />
<PersonPicture displayName="Мария К." size={48} badgeNumber={12} badgeLabel="12 непрочитанных" />
<PersonPicture displayName="Мария К." size={64} badgeText="★" badgeLabel="Избранное" />
```

### 4. Интерактивный режим

С `onClick` компонент получает `role="button"`, `tabIndex={0}` и стили наведения, нажатия и фокуса. `Enter` и `Space` на самом аватаре вызывают настоящий клик, поэтому `onClick` получает обычный `MouseEvent`. Одиночный аватар при нажатии слегка сжимается (`scale(0.94)`), карточка с подписью превращается в плашку со скруглением `--ControlCornerRadius`.

```tsx
<PersonPicture
  displayName="Дмитрий Соколов"
  onClick={() => console.log("Avatar clicked")}
/>

<PersonPicture
  displayName="Дмитрий Соколов"
  secondaryLabel="Открыть профиль"
  onClick={() => console.log("Card clicked")}
/>
```

### 5. Доступное имя

- **Без подписи** корень получает `role="img"` (или `button` при `onClick`) и `aria-label` из имени, email, телефона, инициалов либо строки «Фотография пользователя». Если есть бейдж, к имени добавляется `badgeLabel` или значение бейджа, например «Мария К., 12 непрочитанных». Вложенный `<img>` имеет пустой `alt`, имя не читается дважды.
- **С подписью** корень получает `role="group"` (или `button`) и `aria-labelledby`, который ссылается на видимый текст подписи. Если основного текста нет, а есть только `secondaryLabel`, к нему добавляется скрытое имя пользователя. Бейдж попадает в имя через скрытый элемент.
- Свои `aria-label` и `aria-labelledby` из `...props` переопределяют автоматические.

## Ограничения

- **Приоритет `badgeNumber` над `badgeText`:** при передаче обоих показывается только число. Нулевой счётчик и пустой текст бейджа не отображаются.
- **Отрицательные отступы в интерактивном режиме с подписью:** класс `.withLabel.interactive` добавляет `padding: 6px var(--ControlPaddingInline) 6px 6px` и компенсирует его `margin: -6px calc(var(--ControlPaddingInline) * -1) -6px -6px` (при значении токена `10px` это `-6px -10px -6px -6px`). Учитывайте это в контейнерах с `overflow: hidden`.
- **`interactive` без `onClick`:** включает только стили; роль `button` и фокус по `Tab` не добавляются. Если нужен фокус, передайте `tabIndex`.
- **Защита `--pp-size`:** размер аватара записывается в инлайн-стиль `--pp-size`; свойство `--pp-size` в `style` перезапишет значение `size`.
- **Высокий контраст:** в режиме `forced-colors` фокус рисуется системным контуром, бейдж — цветами `Highlight`.
- **Глобальные стили:** для типографики подписи нужны классы `BodyTextBlockStyle`, `BodyStrongTextBlockStyle` и `CaptionTextBlockStyle`, а также токены `--Control*` и токены темы.
