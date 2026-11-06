# Switch

Переключатель (тумблер) на основе нативного `<input type="checkbox" role="switch">`, который становится полупрозрачным во время нажатия и скольжения.

## Параметры

| Название параметра | Тип                                                                                                               | Описание                                                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `label`            | `ReactNode`                                                                                                       | Текстовая подпись рядом с переключателем. Значения `undefined`, `null` и `false` не рендерятся. Без подписи укажите `aria-label`. |
| `labelPlacement`   | `"end" \| "start"`                                                                                                | Положение подписи: `"end"` (по умолчанию, справа от переключателя) или `"start"` (слева от переключателя).                        |
| `size`             | `"regular" \| "mini"`                                                                                             | Размер переключателя: `"regular"` (`56×32px`, по умолчанию) или компактный `"mini"` (`45×22px`) для плотных списков.              |
| `checked`          | `boolean`                                                                                                         | Состояние переключателя в контролируемом режиме.                                                                                  |
| `defaultChecked`   | `boolean`                                                                                                         | Начальное состояние в неконтролируемом режиме (синхронизируется с DOM при изменении пропа).                                       |
| `onChange`         | `ChangeEventHandler<HTMLInputElement>`                                                                            | Обработчик переключения состояния.                                                                                                |
| `disabled`         | `boolean`                                                                                                         | Отключает переключатель. Также автоматически блокируется во время отправки родительской формы (`useFormStatus`).                  |
| `className`        | `string`                                                                                                          | Пользовательский CSS-класс. Применяется к корневому элементу `<label>`.                                                           |
| `style`            | `CSSProperties`                                                                                                   | Инлайн-стили. Применяются к корневому элементу `<label>` (поверх CSS-переменных габаритов `--switch-*`).                          |
| `ref`              | `Ref<HTMLInputElement>`                                                                                           | Ссылка на нативный элемент `<input type="checkbox" role="switch">`.                                                               |
| `...rest`          | `Omit<InputHTMLAttributes<HTMLInputElement>, "type" \| "role" \| "size" \| "children" \| "className" \| "style">` | Остальные нативные атрибуты `<input>` (`name`, `value`, `onKeyDown`, `onKeyUp`, `onBlur`, `aria-*` и др.).                        |

## Быстрый старт

```tsx
import { Switch } from "@ui-kit/components";

export default function App() {
  return (
    <Switch
      label="Уведомления"
      defaultChecked
      onChange={(e) => console.log("Enabled:", e.target.checked)}
    />
  );
}
```

## Примеры использования

### 1. Размеры (`regular` и `mini`)

Используйте стандартный размер `regular` (`32px` в высоту, как у полей ввода, `--ControlHeight`; `Button` по умолчанию выше, `36px`, поэтому для одного ряда задайте ему `height={32}`) для обычных форм и `mini` (`22px` в высоту) для компактных таблиц или панелей инструментов.

```tsx
<Switch label="Авиарежим" size="regular" />
<Switch label="Показывать подсказки" size="mini" defaultChecked />
```

### 2. Строка настроек с подписью слева и настройкой прозрачности стекла

При нажатии (мышью, тачем или удержанием клавиши `Space`) и во время переезда ползунок `FrostedGlass` становится почти прозрачным и размывает дорожку под собой. Степень прозрачности можно переопределить через CSS-переменную `--SwitchThumbSwitchingOpacity` в пропе `style`.

```tsx
const [darkMode, setDarkMode] = useState(true);

<Switch
  label="Тёмная тема"
  labelPlacement="start"
  checked={darkMode}
  onChange={(e) => setDarkMode(e.target.checked)}
  style={
    {
      width: "100%",
      justifyContent: "space-between",
      "--SwitchThumbSwitchingOpacity": "4%",
    } as React.CSSProperties
  }
/>;
```

### 3. Использование в формах (Next.js / React 19)

Как и нативный чекбокс, включённый `Switch` отправляет в `FormData` своё значение `value` (по умолчанию `"on"`), а на время работы Server Action автоматически переходит в `disabled`.

```tsx
<form action={saveSettingsAction}>
  <Switch
    name="autoUpdate"
    value="enabled"
    label="Автоматическое обновление"
    defaultChecked={initialSettings.autoUpdate}
  />
  <button type="submit">Сохранить</button>
</form>
```

## Ограничения

- **Ограничения `backdrop-filter` у предков:** Ползунок построен на `FrostedGlass`. Не задавайте родительским контейнерам свойства `opacity < 1`, `filter`, `mask` или `will-change`, иначе браузер сломает контекст наложения и размытие фона под ползунком пропадёт.
- **Переопределение CSS-переменных в `style`:** Компонент записывает расчётные размеры (`--switch-width`, `--switch-height`, `--switch-thumb-width`, `--switch-inset`) в инлайн-стиль корневого `<label>`. Не перезаписывайте эти переменные вручную в `style`, так как геометрические параметры самого `FrostedGlass` передаются числами из константы `SWITCH_SIZES` и рассинхронизируются с CSS.
- **Сброс анимации скольжения:** Состояние прозрачности при движении (`sliding`) снимается по `onTransitionEnd` свойства `transform` или принудительно через таймер `500ms` (`SWITCHING_FALLBACK_MS`). Если в CSS увеличить длительность анимации ползунка свыше 500 мс, стекло станет непрозрачным до завершения движения.
- **Пустая подпись:** Значения `label` `undefined`, `null`, `false` и `""` не рисуют подпись, поэтому отступа `8px` нет. Для переключателя без текста укажите `aria-label`.
- **Требуется React 19:** Компонент вызывает `useFormStatus` из `react-dom`, которого нет в React 18.
