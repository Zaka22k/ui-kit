# NavigationView

Каркас приложения из боковой панели навигации и области страницы: панель подстраивается под ширину, может парить над контентом, а смена страниц анимируется.

## Свойства

В состав входят `NavigationView` (корень), `NavItem`, `NavSubItem`, `NavCategory`, `NavSectionHeader`, `NavDivider`, `NavBackgroundExtension` и функция `matchNavValue`. `NavItem`, `NavSubItem` и `NavCategory` работают только внутри `NavigationView`, вне него они бросают ошибку.

Из пакета экспортируются также типы `NavigationViewProps`, `NavItemProps`, `NavSubItemProps`, `NavCategoryProps`, `NavBackgroundExtensionProps`, `PaneDisplayMode`, фабрики переходов и их типы (раздел «Переходы между страницами»).

### NavigationView

Остальные атрибуты `<div>` (кроме `onSelect`), включая `className` и `style`, попадают на корневой элемент. Корень занимает `100%` ширины и высоты родителя, поэтому у родителя должна быть заданная высота.

#### Содержимое

| Свойство                 | Тип                                                                         | Описание                                                                                                                                                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `children`               | `ReactNode`                                                                 | Текущая страница. Содержимое не выбирается компонентом: сопоставьте выбранное значение со страницей в своём коде (роутер, `switch`). Оборачивайте страницу в `Page`                                                                              |
| `headerMenuItems`        | `ReactNode`                                                                 | Пункты над основными, под `paneCustomContent` (например, «Главная» или «Поиск»). Не прокручиваются. Только в раскрытой панели                                                                                                                      |
| `menuItems`              | `ReactNode`                                                                 | Основные пункты панели. Область прокручивается, если пунктов много                                                                                                                                                                               |
| `footerMenuItems`        | `ReactNode`                                                                 | Пункты в нижней части панели, под основными. Не прокручиваются                                                                                                                                                                                   |
| `paneTitle`              | `ReactNode`                                                                 | Заголовок в верхней строке панели. В свёрнутой панели скрыт                                                                                                                                                                                      |
| `paneHeader`             | `ReactNode \| ({ isPaneOpen }) => ReactNode`                                | Слот под верхней строкой (например, профиль). Только в раскрытой панели                                                                                                                                                                          |
| `paneCustomContent`      | `ReactNode \| ({ isPaneOpen }) => ReactNode`                                | Слот под `paneHeader` (например, поле поиска). Только в раскрытой панели                                                                                                                                                                         |
| `paneFooter`             | `ReactNode \| ({ isPaneOpen }) => ReactNode`                                | Слот в самом низу панели. Рисуется всегда, поэтому в функции проверяйте `isPaneOpen`                                                                                                                                                             |
| `pageKey`                | `string \| number`                                                          | Ключ страницы. По умолчанию равен выбранному значению. При смене страница создаётся заново и играет переход. С роутером передавайте `location.pathname`: по пути определяется, как страницы связаны (вглубь, назад, рядом)                       |
| `pageTransition`         | `"auto" \| "entrance" \| "drillIn" \| "slide" \| "suppress" \| (info) => …` | Переход при смене страницы. По умолчанию `"auto"`. Страница может переопределить его своим `transition`                                                                                                                                          |
| `extendContentUnderPane` | `boolean`                                                                   | Панель всегда парит над страницей (полупрозрачный материал с размытием), а страница занимает всю ширину. Закрытую панелью полосу описывает переменная `--nav-safe-left`. Нужно, чтобы баннеры и таблицы уходили под панель. По умолчанию `false` |

Порядок панели сверху вниз: верхняя строка, `paneHeader`, `paneCustomContent`, `headerMenuItems`, `menuItems`, `footerMenuItems`, `paneFooter`.

#### Режим панели

| Свойство                     | Тип                                                  | Описание                                                                                                                                                                                                    |
| ---------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `paneDisplayMode`            | `"auto" \| "left" \| "leftCompact" \| "leftMinimal"` | Режим панели, см. таблицы ниже. По умолчанию `"auto"`. Тип значений экспортируется как `PaneDisplayMode`                                                                                                    |
| `expandedModeThresholdWidth` | `number`                                             | Только `auto`. Ширина окна браузера (px), от которой панель раскрыта (`left`). По умолчанию `1008`. `0`: панель всегда `left` с кнопкой, адаптивности нет                                                   |
| `compactModeThresholdWidth`  | `number`                                             | Только `auto`. Ширина окна браузера (px), при которой и меньше остаётся только кнопка (`leftMinimal`). По умолчанию `640`. `0` отключает `leftMinimal`                                                      |
| `overlayFullWidthThreshold`  | `number`                                             | Для `leftCompact` и `leftMinimal`. Если ширина окна не больше значения (px), раскрытая поверх страницы панель занимает всю ширину корня. По умолчанию `640`. `0`: панель всегда шириной `--nav-open-width` |
| `isPaneOpen`                 | `boolean`                                            | Раскрыта ли панель (управляемый режим)                                                                                                                                                                      |
| `onPaneOpenChange`           | `(isOpen: boolean) => void`                          | Вызывается при нажатии на кнопку панели, при смене режима `auto` по ширине, при смене `paneDisplayMode` и при закрытии панели, раскрытой поверх страницы (пункт, `Esc`, клик по затемнению)                 |
| `isPaneToggleButtonVisible`  | `boolean`                                            | Показывать кнопку раскрытия. По умолчанию `true`. В режиме `left` кнопки нет в любом случае. В `leftMinimal` кнопка единственное, что видно у закрытой панели                                               |
| `paneAriaLabel`              | `string`                                             | `aria-label` элемента `<nav>`. По умолчанию «Основная навигация»                                                                                                                                            |
| `toggleButtonLabel`          | `string`                                             | `aria-label` и подсказка кнопки раскрытия. По умолчанию «Показать или скрыть боковую панель»                                                                                                                |

| Режим         | Закрытая панель                                                         | Раскрытая панель                | Кнопка | Начальное состояние |
| ------------- | ----------------------------------------------------------------------- | ------------------------------- | ------ | ------------------- |
| `left`        | полоса с иконками (только после нажатия кнопки; у явного `left` её нет) | рядом со страницей, сдвигает её | нет    | раскрыта            |
| `leftCompact` | полоса с иконками рядом со страницей                                    | поверх страницы                 | есть   | свёрнута            |
| `leftMinimal` | только кнопка панели                                                    | поверх страницы                 | есть   | свёрнута            |
| `auto`        | зависит от ширины окна                                                  | зависит от ширины окна          | есть   | по ширине           |

В режиме `auto` измеряется ширина окна браузера (`window.matchMedia`), а не самого `NavigationView`. Если компонент стоит в узком контейнере (панель настроек, превью, `Modal`), режим по ширине контейнера не определится: задайте `paneDisplayMode` сами (см. пример 4).

| Ширина окна                                       | Режим         | Панель                                                        |
| ------------------------------------------------- | ------------- | ------------------------------------------------------------- |
| от `expandedModeThresholdWidth` (1008)            | `left`        | раскрыта; кнопка сворачивает её в полосу, страница сдвигается |
| от 641 до 1007                                    | `leftCompact` | свёрнута в полосу, раскрывается поверх страницы               |
| до `compactModeThresholdWidth` (640) включительно | `leftMinimal` | только кнопка, раскрывается поверх страницы на всю ширину     |

#### Выбор и раскрытие категорий

Управляемый режим включается, когда свойство не `undefined`. Чтобы снять выбор (например, на странице вне меню), передайте `null`: режим остаётся управляемым, выбранного пункта нет.

| Свойство                 | Тип                          | Описание                                                                                                          |
| ------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `selectedValue`          | `string \| number \| null`   | Выбранное значение (управляемый режим). `null`: ничего не выбрано                                                 |
| `defaultSelectedValue`   | `string \| number \| null`   | Начальное значение (неуправляемый режим)                                                                          |
| `onNavItemSelect`        | `(event, { value }) => void` | Нажатие на пункт со `value`. Вызывается при каждом нажатии, в том числе на уже выбранный пункт                    |
| `onSelectionChanged`     | `(event, { value }) => void` | Выбранное значение изменилось. Не вызывается для уже выбранного пункта и для пунктов с `selectsOnInvoked={false}` |
| `openCategories`         | `Array<string \| number>`    | Значения раскрытых категорий (управляемый режим)                                                                  |
| `defaultOpenCategories`  | `Array<string \| number>`    | Какие категории раскрыты в начале. По умолчанию `[]`                                                              |
| `onOpenCategoriesChange` | `(categories) => void`       | Список раскрытых категорий изменился                                                                              |
| `allowMultipleOpenCategories` | `boolean`               | Можно ли держать раскрытыми несколько категорий. По умолчанию `false`: это аккордеон, раскрытие одной категории закрывает остальные |

### NavItem и NavSubItem

`NavSubItem` отличается только видом: без иконки и с отступом, чтобы текст стоял под текстом категории. Выбранный пункт получает `aria-current="page"`.

| Свойство           | Тип                      | Описание                                                                                                                                           |
| ------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`            | `string \| number`       | Идентификатор пункта. Пункт со `value`, равным `selectedValue`, считается выбранным. Без `value` пункт не выбирается, он только вызывает `onClick` |
| `icon`             | `ReactNode`              | Иконка 18×18 слева (у `NavSubItem` не рисуется)                                                                                                    |
| `href`             | `string`                 | Если задан и `as` не указан, пункт рисуется как `<a>`                                                                                              |
| `as`               | `ElementType`            | Любой элемент или компонент, например `Link` из роутера. По умолчанию `"button"` (или `"a"` при `href`)                                            |
| `disabled`         | `boolean`                | Отключает пункт. У ссылок убирается `href`                                                                                                         |
| `selectsOnInvoked` | `boolean`                | Если `false`, нажатие вызывает `onNavItemSelect`, но выбор не меняется. По умолчанию `true`                                                        |
| `onClick`          | `(event) => void`        | Вызывается до выбора. `event.preventDefault()` отменяет выбор                                                                                      |
| `className`        | `string`                 | Класс на корневой элемент пункта                                                                                                                   |
| остальные          | атрибуты выбранного тега | Передаются на элемент (`to` для `Link`, `target`, `data-*`, `aria-*`…). `type` и `disabled` кнопки, `aria-disabled` и `href` задаёт компонент, ваши значения их не заменят |

В свёрнутой панели у пункта с текстовым содержимым (`children` строкой) появляется всплывающая подсказка `title` с этим текстом. Свой `title` её заменяет. У пунктов с разметкой внутри и у `NavSubItem` подсказки нет.

### NavCategory

Раскрывающаяся группа пунктов. В раскрытой панели переключает группу, в свёрнутой открывает всплывающее меню справа от пункта. Если в свёрнутой группе выбран один из пунктов, категория подсвечивается как выбранная.

| Свойство    | Тип                | Описание                                                                         |
| ----------- | ------------------ | -------------------------------------------------------------------------------- |
| `value`     | `string \| number` | Идентификатор категории для списка `openCategories`. Выбранной она не становится |
| `title`     | `ReactNode`        | Заголовок                                                                        |
| `icon`      | `ReactNode`        | Иконка слева                                                                     |
| `disabled`  | `boolean`          | Отключает категорию                                                              |
| `className` | `string`           | Класс на корневой элемент                                                        |
| `children`  | `ReactNode`        | Обычно `NavSubItem`                                                              |

### NavSectionHeader и NavDivider

| Компонент          | Свойства                | Описание                                                  |
| ------------------ | ----------------------- | --------------------------------------------------------- |
| `NavSectionHeader` | `children`, `className` | Подпись секции. В свёрнутой панели схлопывается по высоте |
| `NavDivider`       | `className`             | Горизонтальный разделитель                                |

### NavBackgroundExtension

Продлевает содержимое под плавающую панель: рисует слева от него зеркальную размытую копию. Эффект включается только при `extendContentUnderPane`, иначе компонент просто обёртка. Работает и вне `NavigationView` (тогда без эффекта).

| Свойство    | Тип              | Описание                                                 |
| ----------- | ---------------- | -------------------------------------------------------- |
| `isEnabled` | `boolean`        | Выключить эффект, не убирая обёртку. По умолчанию `true` |
| `blur`      | `number`         | Радиус размытия копии, px. По умолчанию `20`             |
| `children`  | `ReactNode`      | Картинка или другой декоративный контент                 |
| остальные   | атрибуты `<div>` | Передаются на обёртку (`className`, `style`…)            |

### matchNavValue

`matchNavValue(pathname, values)` выбирает из `values` подходящий пункт меню для пути: значение равно пути или является его началом по сегментам, из нескольких побеждает самое длинное. Корень `"/"` подходит только самому себе. Если ничего не подошло, возвращает `null`, и это допустимое значение для `selectedValue`.

### Переходы между страницами

Из `NavigationView` экспортируются фабрики `entranceTransition`, `drillInTransition`, `slideTransition`, `suppressTransition`, `autoTransition`, объект `pageMotion` (время и кривые) и типы `PageAnimation`, `PageKey`, `PageTransitionFn`, `PageTransitionInfo`, `PageTransitionName`, `PageTransitionSetting`.

| Имя        | Что происходит                                                                                      | Для чего                       |
| ---------- | --------------------------------------------------------------------------------------------------- | ------------------------------ |
| `entrance` | страница выезжает снизу на `--nav-page-shift` и проявляется                                         | пункты меню, вершина стека     |
| `drillIn`  | вперёд страница вырастает с `--nav-page-drill-scale` до 1, назад с зеркального масштаба `2 − scale` | вглубь иерархии и возврат      |
| `slide`    | вперёд страница выезжает справа, назад слева, на `--nav-page-slide-shift`                           | соседние страницы рядом        |
| `suppress` | без анимации                                                                                        | свои анимации, частые переходы |
| `auto`     | соседние страницы: `entrance`; вглубь и назад: `drillIn`. По умолчанию                              | общий случай                   |

| Фабрика              | Параметры (все необязательные)                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `entranceTransition` | `duration` (мс, 333), `distance` (число в px или CSS-значение, по умолчанию `--nav-page-shift`)                            |
| `drillInTransition`  | `duration` (мс, 333), `scale` (начальный масштаб при переходе вглубь, по умолчанию `--nav-page-drill-scale`)               |
| `slideTransition`    | `effect` (`"auto"`, `"fromLeft"`, `"fromRight"`), `duration` (мс, 333), `distance` (по умолчанию `--nav-page-slide-shift`) |

Функция в `pageTransition` получает `PageTransitionInfo`:

| Поле        | Значение                                                          |
| ----------- | ----------------------------------------------------------------- |
| `from`      | ключ страницы, которая уходит                                     |
| `to`        | ключ страницы, которая появляется                                 |
| `relation`  | `"peer"` (рядом), `"child"` (вглубь), `"parent"` (выше)           |
| `direction` | `"back"` при переходе на страницу выше по пути, иначе `"forward"` |

Связь страниц определяется только для ключей-путей (строк, начинающихся с «/»; запрос и хеш отбрасываются). `/performance` → `/performance/new` это `child`, обратно `parent`, `/groups` → `/students` это `peer`. Для остальных ключей всегда `peer`. При `prefers-reduced-motion: reduce` любой переход, кроме `suppress`, заменяется затуханием за 83 мс.

### CSS-переменные

Задаются на корневом элементе (`className` или `style`).

| Переменная                       | По умолчанию                      | Описание                                                                                            |
| -------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `--nav-open-width`               | `248px`                           | Ширина раскрытой панели                                                                             |
| `--nav-compact-width`            | `60px`                            | Ширина свёрнутой панели (полосы с иконками)                                                         |
| `--nav-minimal-bar-height`       | `48px`                            | `leftMinimal`: высота строки с кнопкой над страницей                                                |
| `--nav-item-height`              | `32px`                            | Высота пункта                                                                                       |
| `--nav-icon-size`                | `18px`                            | Размер иконки                                                                                       |
| `--nav-gap`                      | `0px`                             | Отступ вокруг и между панелью и страницей                                                           |
| `--nav-page-shift`               | `64px`                            | Сдвиг снизу при появлении страницы в `entrance`                                                     |
| `--nav-page-slide-shift`         | `64px`                            | Сдвиг сбоку в `slide`                                                                               |
| `--nav-page-drill-scale`         | `0.94`                            | Начальный масштаб страницы в `drillIn` при переходе вглубь                                          |
| `--nav-overlay-scrim`            | `rgb(0 0 0 / 0.32)`               | Затемнение страницы под панелью, раскрытой поверх страницы                                          |
| `--nav-overlay-pane-background`  | `var(--material-sidebar-bg)`      | Фон панели, раскрытой поверх страницы                                                               |
| `--nav-floating-pane-background` | `var(--material-sidebar-bg)`      | Фон панели при `extendContentUnderPane`                                                             |
| `--nav-anim-duration`            | `var(--ControlAnimationDuration)` | Длительность анимации панели и групп                                                                |
| `--nav-anim-easing`              | `var(--ControlAnimationEasing)`   | Кривая анимации панели и групп                                                                      |
| `--nav-safe-left`                | задаёт компонент                  | Только для чтения: ширина закрытой панелью полосы слева (при `extendContentUnderPane`), анимируется |

Переменную `--nav-pane-current` задаёт сам компонент, менять её не нужно. На корне стоят `data-pane-mode` (`left`, `leftCompact` или `leftMinimal`) и `data-pane-open`.

## Клавиатура и доступность

- Панель это `<nav>` с именем `paneAriaLabel`, страница это `<main>`. Выбранный пункт получает `aria-current="page"`. Кнопка панели имеет `aria-expanded` и `aria-controls`.
- Все пункты входят в порядок `Tab`. Внутри панели дополнительно работают `↑` и `↓` (по кругу), `Home` и `End`. Пункты свёрнутых категорий и отключённые пункты пропускаются. В полях ввода слотов (`input`, `textarea`, `select`, `contenteditable`) стрелки и `Esc` не перехватываются.
- Панель, раскрытая поверх страницы (`leftCompact`, `leftMinimal`): страница под ней `inert`, `Tab` и `Shift+Tab` ходят по кругу внутри панели. `Esc`, выбор пункта и клик по затемнению закрывают её. После `Esc` фокус возвращается на кнопку панели, а если кнопка скрыта (`isPaneToggleButtonVisible={false}`), то на `<main>`.
- Категория: в раскрытой панели кнопка имеет `aria-expanded` и `aria-controls` на группу, группа (`role="group"`) названа по заголовку категории. В свёрнутой полосе категория открывает всплывающее меню (`role="group"` с тем же именем, фокус переходит на первый пункт). Меню закрывают `Esc`, выбор пункта, клик вне его, `Tab` и уход фокуса; в первых трёх случаях и при `Tab` фокус возвращается на кнопку категории. Стрелки перемещают фокус по пунктам меню.
- При `prefers-reduced-motion: reduce` анимации панели отключаются, а смена страницы заменяется короткой сменой прозрачности.
- При `forced-colors: active` выбранный пункт отмечен плашкой слева и контуром, наведённый контуром, у панели и всплывающего меню есть рамка, отключённые пункты GrayText.
- Цвет подписи `NavSectionHeader` берётся из `--label-secondary-strong` (контраст не ниже `4.5:1`).

## Быстрый старт

```tsx
import { NavigationView, NavItem, Page } from "@ui-kit/components";

<div style={{ height: "100vh" }}>
  <NavigationView
    paneTitle="Моё приложение"
    defaultSelectedValue="home"
    menuItems={
      <>
        <NavItem value="home" icon={<HomeIcon />}>
          Главная
        </NavItem>
        <NavItem value="users" icon={<UsersIcon />}>
          Пользователи
        </NavItem>
      </>
    }
    footerMenuItems={
      <NavItem value="settings" icon={<SettingsIcon />}>
        Настройки
      </NavItem>
    }
  >
    <Page title="Главная">Содержимое страницы</Page>
  </NavigationView>
</div>;
```

## Примеры

### 1. Категории, секции и разделитель

```tsx
<NavigationView
  paneTitle="Админка"
  defaultSelectedValue="users"
  defaultOpenCategories={["people"]}
  menuItems={
    <>
      <NavItem value="home" icon={<HomeIcon />}>
        Главная
      </NavItem>

      <NavSectionHeader>Данные</NavSectionHeader>
      <NavCategory value="people" title="Люди" icon={<UsersIcon />}>
        <NavSubItem value="users">Пользователи</NavSubItem>
        <NavSubItem value="roles">Роли</NavSubItem>
      </NavCategory>

      <NavDivider />
      <NavItem value="reports" icon={<ChartIcon />} disabled>
        Отчёты
      </NavItem>
    </>
  }
>
  <CurrentPage />
</NavigationView>
```

Если выбрать пункт категории программно (`selectedValue="users"`), категория сама не раскроется: начальное раскрытие задаётся через `defaultOpenCategories` или `openCategories`.

### 2. Управляемый режим

```tsx
const [page, setPage] = useState("home");
const [paneOpen, setPaneOpen] = useState(true);

<NavigationView
  selectedValue={page}
  onSelectionChanged={(_, { value }) => setPage(String(value))}
  isPaneOpen={paneOpen}
  onPaneOpenChange={setPaneOpen}
  menuItems={/* … */}
>
  {pages[page]}
</NavigationView>;
```

### 3. Роутер и страницы вне меню

Задайте `as` и нужные атрибуты (`to` для `Link`), в `value` кладите путь. В `pageKey` передайте `pathname`, а выбранный пункт вычисляйте через `matchNavValue`: страницы вне меню (например, `/users/new`) не сбивают выделение раздела, а переход между страницами всё равно играет.

```tsx
import { Link, Outlet, useLocation } from "react-router-dom";
import { matchNavValue } from "@ui-kit/components";

const MENU = ["/", "/users"] as const;

function Shell() {
  const { pathname } = useLocation();

  return (
    <NavigationView
      pageKey={pathname}
      selectedValue={matchNavValue(pathname, MENU)}
      menuItems={
        <>
          <NavItem as={Link} to="/" value="/" icon={<HomeIcon />}>
            Главная
          </NavItem>
          <NavItem as={Link} to="/users" value="/users" icon={<UsersIcon />}>
            Пользователи
          </NavItem>
        </>
      }
    >
      <Outlet />
    </NavigationView>
  );
}

// <Route element={<Shell />}>
//   <Route index element={<HomePage />} />
//   <Route path="users" element={<UsersPage />} />
//   <Route path="users/new" element={<NewUserPage />} />   // вне меню
// </Route>
```

Пункт с `href` без `as` это обычная ссылка `<a>`, она перезагрузит страницу. Для переходов внутри приложения используйте `as={Link}` или отменяйте переход в `onClick`.

### 4. Режимы панели

```tsx
// рядом со страницей, всегда раскрыта, без кнопки
<NavigationView paneDisplayMode="left" … />

// полоса с иконками, раскрытая лежит поверх страницы
<NavigationView paneDisplayMode="leftCompact" … />

// только кнопка панели, раскрытая лежит поверх страницы
<NavigationView paneDisplayMode="leftMinimal" … />

// по ширине окна (по умолчанию): от 1008 left, 641–1007 leftCompact, до 640 leftMinimal
<NavigationView paneDisplayMode="auto" … />

// без leftMinimal: раскрыта на широком, иначе полоса с иконками
<NavigationView compactModeThresholdWidth={0} … />

// адаптивности нет: всегда left, но панель сворачивается кнопкой
<NavigationView expandedModeThresholdWidth={0} … />

// раскрытая поверх страницы панель идёт на всю ширину только в окне до 480px
<NavigationView overlayFullWidthThreshold={480} … />
```

В режиме `auto` панель реагирует только на смену режима: при переходе в `left` она раскрывается, при переходе в `leftCompact` или `leftMinimal` сворачивается. Пока режим тот же, ручное раскрытие кнопкой сохраняется.

Если режим должен зависеть не от ширины окна, а от чего-то другого (например, от ширины контейнера), задайте его сами:

```tsx
const isPhone = useMediaQuery("(max-width: 600px)");

<NavigationView paneDisplayMode={isPhone ? "leftMinimal" : "left"} … />
```

### 5. Слоты панели

```tsx
<NavigationView
  paneTitle="Почта"
  paneHeader={<UserCard />}
  paneCustomContent={<SearchField placeholder="Поиск" />}
  paneFooter={({ isPaneOpen }) =>
    isPaneOpen ? <small>v1.4.2</small> : <small>1.4</small>
  }
  menuItems={/* … */}
>
  …
</NavigationView>
```

`paneHeader` и `paneCustomContent` в свёрнутой панели не рисуются. В `paneCustomContent` можно ставить поля ввода: стрелки и `Esc` внутри `input`, `textarea`, `select` и `contenteditable` не перехватываются.

### 6. Пункт-действие

Пункт без `value` или с `selectsOnInvoked={false}` не меняет страницу, а выполняет действие:

```tsx
<NavItem icon={<LogoutIcon />} onClick={logout}>
  Выйти
</NavItem>

<NavItem
  value="help"
  icon={<HelpIcon />}
  selectsOnInvoked={false}
  onClick={() => openHelpDialog()}
>
  Справка
</NavItem>
```

Чтобы отменить выбор по условию, вызовите `event.preventDefault()` в `onClick`.

### 7. Контент под плавающей панелью

С `extendContentUnderPane` панель парит над страницей, а страница занимает всю ширину. Под панель уходят баннер `hero` у `Page` (его левый край продлевается размытой копией), картинки в `NavBackgroundExtension` и горизонтальная прокрутка `DataGrid`. Остальное содержимое остаётся в безопасной области справа от панели.

```tsx
<NavigationView extendContentUnderPane paneTitle="Журнал" menuItems={/* … */}>
  <Page
    title="Группа ИС-21"
    hero={
      <img
        src={banner}
        alt=""
        style={{
          display: "block",
          width: "100%",
          height: 240,
          objectFit: "cover",
        }}
      />
    }
  >
    <DataGrid
      rows={students}
      columns={columns}
      getRowId={(s) => s.id}
      aria-label="Студенты"
    />
  </Page>
</NavigationView>
```

Широкая картинка в середине страницы: вынесите её на всю ширину отрицательным отступом, равным боковому отступу страницы.

```tsx
<NavBackgroundExtension
  style={{ margin: "0 calc(var(--page-padding, 24px) * -1)" }}
>
  <img
    src={wide}
    alt=""
    style={{ display: "block", width: "100%", height: 200, objectFit: "cover" }}
  />
</NavBackgroundExtension>
```

### 8. Переходы между страницами

```tsx
// по умолчанию "auto": соседние страницы entrance, вглубь и назад drillIn
<NavigationView … />

// один переход для всех страниц
<NavigationView pageTransition="slide" … />

// настройка встроенного перехода
<NavigationView pageTransition={entranceTransition({ distance: 32 })} … />
<NavigationView pageTransition={drillInTransition({ duration: 250, scale: 0.9 })} … />
<NavigationView pageTransition={slideTransition({ effect: "fromLeft" })} … />

// выбор по связи страниц
<NavigationView
  pageTransition={(info) => (info.relation === "peer" ? "entrance" : "slide")}
  …
/>

// без анимации (страница по-прежнему пересоздаётся при смене ключа)
<NavigationView pageTransition="suppress" … />

// страница не пересоздаётся и не анимируется
<NavigationView pageKey="app" … />
```

Свою анимацию функция может вернуть дорожкой (аргументы `Element.animate()`), массивом дорожек или `null`:

```tsx
pageTransition={() => [
  {
    keyframes: [
      { opacity: 0, transform: "scale(0.98)" },
      { opacity: 1, transform: "scale(1)" },
    ],
    options: { duration: 200, easing: "ease-out" },
  },
]}
```

В значениях keyframes можно писать `var(--имя)`. Анимируйте только `transform` и `opacity`. Страница может задать свой переход свойством `transition` у `Page`, оно важнее настройки `NavigationView`.

### 9. Размеры и скругление

```tsx
<NavigationView
  style={
    {
      "--nav-open-width": "280px",
      "--nav-compact-width": "52px",
      "--nav-item-height": "36px",
      borderRadius: 12,
    } as React.CSSProperties
  }
  …
/>
```

Скругление корня наследует и боковая панель.

## Ограничения

- Режима `Top` (горизонтальная панель сверху) из WinUI нет: панель бывает только слева.
- Кнопки «Назад» и `Header` страницы у `NavigationView` нет: они есть у `Page`.
- Закрытие панели, раскрытой поверх страницы, по выбору пункта и по `Esc` отключить нельзя.
- Размытие панели зависит от `backdrop-filter`: там, где он не поддерживается, фон остаётся полупрозрачным без размытия. Задайте непрозрачный `--nav-overlay-pane-background` или `--nav-floating-pane-background`.
- Плавная смена `--nav-safe-left` зависит от `@property` (Chromium, Safari, Firefox 128+). Без неё контент под панелью сдвигается без анимации.
- `NavBackgroundExtension` рендерит `children` второй раз (копия под панелью): в них будут дубли `id` и эффектов. Подходит для картинок и фонов, не для интерактивного содержимого.
- Эффект `extendContentUnderPane` работает только слева. Сверху под тулбар контент уходит средствами `Page` (`hero`).
- Возврат фокуса на кнопку панели по `Esc` находит кнопку по атрибуту `data-nv-toggle`. Если кнопки нет в DOM, фокус переходит на `<main>`.
- Режим `auto` следит за шириной окна, а не контейнера. Для встраивания в узкий блок задайте `paneDisplayMode` вручную.
- Серверный рендер (SSR): режим `auto` на сервере всегда `left` с раскрытой панелью, ширину окна знает только клиент. На узком экране до гидрации (и до первой отрисовки после неё) страница показывается с раскрытой панелью, потом панель переключается. Если это заметно, рендерите навигацию только на клиенте или задайте `paneDisplayMode` явно.
- Выбор пункта категории не раскрывает её автоматически.
- Подсветка категории по выбранному пункту ищет `value` только среди прямых потомков `NavCategory`. Если пункты обёрнуты в свой компонент или фрагмент с условиями, подсветки не будет.
- Категории рассчитаны на один уровень: вложенные `NavCategory` не поддерживаются.
- Пока открыто всплывающее меню категории, её содержимое существует в двух экземплярах (скрытая группа и меню). Не кладите в категорию элементы с собственным состоянием, `autoFocus` или фиксированными `id`.
- Всплывающее меню позиционируется один раз при открытии и не следует за прокруткой панели.
- В управляемом режиме `isPaneOpen` при `auto`, если при монтировании режим не `left` (корень не шире 1007px), колбэк `onPaneOpenChange` не вызывается: панель останется в том состоянии, которое вы передали. Последующие смены режима по ширине колбэк вызывают.
- При смене `pageKey` страница пересоздаётся, состояние внутри неё не сохраняется. Анимируется только появление новой страницы, ухода прежней нет.
- Шапка `Page` лежит внутри прокручиваемой рамки страницы, поэтому анимируется вместе с ней.
- Свойство `transition` у `Page` читается один раз, когда страница появилась вместе с рамкой. Страница, которая появится позже (`React.lazy` с `Suspense`, условный рендер), своё `transition` не применит: используйте `pageTransition` у `NavigationView`.
- Связь страниц (`child`, `parent`) определяется только по ключам-путям. Для остальных ключей все переходы «рядом».
- Фокус при смене страницы не переносится: если он был на элементе прежней страницы, он сбрасывается на `<body>`.
- Элемент `<main>` внутри компонента должен быть в приложении единственным.
- Прокручивается не `<main>`, а вложенный в него элемент страницы (новый для каждой страницы), поэтому положение прокрутки между страницами не сохраняется.
