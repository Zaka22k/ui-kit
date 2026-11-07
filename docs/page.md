# Page

Каркас страницы приложения: закреплённая шапка с заголовком, кнопкой «Назад» и панелью инструментов, необязательный баннер и тело страницы.

## Свойства

| Свойство     | Тип                                                       | Описание                                                                                                                                                                                                                                     |
| ------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`      | `ReactNode`                                               | Заголовок страницы. Выводится как `<h1>` в шапке (размер из `SubtitleTextBlockStyle`, 20px, при узком окне 18px) и обрезается многоточием, если не помещается                                                                                                                                                                                    |
| `children`   | `ReactNode`                                               | Содержимое страницы                                                                                                                                                                                                                          |
| `hero`       | `ReactNode`                                               | Декоративный баннер (картинка, градиент) в самом верху страницы. Заходит под шапку, а при `extendContentUnderPane` у `NavigationView` его левый край продлевается под боковую панель. Пока баннер лежит под шапкой, подложка шапки прозрачна |
| `onBack`     | `() => void`                                              | Если передан, слева в шапке появляется кнопка «Назад» (`aria-label` из `backLabel`), которая вызывает этот колбэк. Переход на другую страницу в колбэке делаете вы                                                                                  |
| `toolbar`    | `Pick<ToolbarProps, "leading" \| "center" \| "trailing">` | Панель инструментов шапки: слева, по центру, справа. `toolbar.leading` показывается сразу после кнопки «Назад»                                                                                                                               |
| `backLabel`  | `string`                                                  | Доступное имя кнопки «Назад». По умолчанию `"Назад"`                                                                                                                                                                                         |
| `transition` | `PageTransitionSetting`                                   | Переход, которым страница появляется внутри `NavigationView`: `"auto"`, `"entrance"`, `"drillIn"`, `"slide"`, `"suppress"` или функция. Без него действует `pageTransition` из `NavigationView`. Вне `NavigationView` не используется        |

У `Page` нет `className` и `style`. Тип `PageProps` экспортируется из пакета.

### CSS-переменные

Переменные задаются на корневом элементе страницы и доступны всем потомкам, в том числе `DataGrid`.

| Переменная               | По умолчанию                | Описание                                                                                                                |
| ------------------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--page-header-height`   | `58px`                      | Высота шапки. По ней шапка `DataGrid` липнет вплотную к шапке страницы, а баннер заходит под неё                        |
| `--page-padding`         | `24px`                      | Боковой отступ шапки и тела. По нему `DataGrid` и широкие картинки выходят до края окна                                 |
| `--sticky-header-bg`     | `var(--material-header-bg)` | Фон подложки шапки. Тот же использует прилипшая шапка `DataGrid`                                                        |
| `--sticky-header-filter` | `blur(20px) saturate(180%)` | Блюр подложки шапки. Тот же использует прилипшая шапка `DataGrid`                                                       |
| `--page-hero-fade`       | `56px`                      | Высота затухания нижнего края баннера в цвет фона окна (`--window-bg`). В стилях страницы не задана, действует значение по умолчанию                                    |
| `--page-stuck-extra`     | `0px`                       | Служебная: на сколько подложка шапки растянута вниз под прилипшую шапку таблицы. Выставляет `DataGrid`, менять не нужно |

## Быстрый старт

```tsx
import { NavigationView, Page } from "@ui-kit/components";

<NavigationView menuItems={/* … */}>
  <Page title="Города">
    <CityList />
  </Page>
</NavigationView>;
```

`Page` работает и вне `NavigationView`: шапка остаётся `position: sticky` у ближайшей прокручиваемой области, а `transition` просто не используется.

## Примеры

### 1. Простая страница

```tsx
<Page title="Настройки">
  <Settings />
</Page>
```

### 2. Кнопка «Назад» и панель инструментов

Кнопка появляется, только если передан `onBack`. С `react-router` переход на уровень выше делается в самом колбэке:

```tsx
const navigate = useNavigate();

<Page
  title="Город"
  onBack={() => navigate("..", { relative: "route" })}
  toolbar={{
    leading: <Button icon={<RefreshIcon />} aria-label="Обновить" />,
    center: (
      <ToolbarGroup>
        <ToolbarButton icon={<FilterIcon />} aria-label="Фильтр" />
      </ToolbarGroup>
    ),
    trailing: <Button appearance="primary">Редактировать</Button>,
  }}
>
  <CityDetails />
</Page>;
```

Если `NavigationView` получает `pageKey={pathname}`, переход на страницу выше для него «назад» (`direction: "back"`), и `drillIn` сыграет в обратную сторону.

### 3. Баннер под шапкой

```tsx
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
  <GroupDetails />
</Page>
```

Баннер идёт сразу под шапку и заходит под неё. Тело страницы начинается после баннера с отступом 24px. Если у `NavigationView` включён `extendContentUnderPane`, левый край баннера отражается и размывается под боковой панелью.

Широкую картинку в середине страницы оберните в `NavBackgroundExtension` и растяните отрицательным отступом на ширину бокового отступа страницы:

```tsx
<NavBackgroundExtension style={{ margin: "0 calc(var(--page-padding) * -1)" }}>
  <img
    src={wide}
    alt=""
    style={{ display: "block", width: "100%", height: 200, objectFit: "cover" }}
  />
</NavBackgroundExtension>
```

### 4. Таблица на странице

`DataGrid` внутри `Page` прокручивается вместе со страницей, а его шапка прилипает вплотную под шапкой страницы. У двух шапок один фон и один блюр, стык не виден.

```tsx
<Page title="Журнал успеваемости" toolbar={{ trailing: <SearchField /> }}>
  <DataGrid
    rows={students}
    columns={columns}
    getRowId={(s) => s.id}
    aria-label="Журнал"
  />
</Page>
```

### 5. Загрузка данных

Загрузку страница сама не ведёт: состояние и индикатор делайте в содержимом.

```tsx
function CityPage() {
  const { id } = useParams();
  const [city, setCity] = useState<City | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setCity(null);
    setFailed(false);
    api
      .getCity(id!)
      .then((value) => active && setCity(value))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <Page title="Город">
      {failed ? (
        <p role="alert">Не удалось загрузить страницу.</p>
      ) : city ? (
        <CityDetails city={city} />
      ) : (
        <ProgressRing loading size={32} aria-label="Загрузка" />
      )}
    </Page>
  );
}
```

Шапка остаётся на месте во всех состояниях, поэтому пользователь может вернуться назад, даже если загрузка зависла.

### 6. Форма и кнопка сохранения в шапке

Шапка и тело страницы это соседние элементы, поэтому кнопка из `toolbar` находится вне `<form>`. Свяжите их атрибутом `form` и укажите `type="submit"`:

```tsx
function NewCityPage() {
  const formId = useId();
  const [state, formAction, isPending] = useActionState(saveCityAction, null);

  return (
    <Page
      title="Новый город"
      onBack={goBack}
      toolbar={{
        trailing: (
          <Button
            appearance="primary"
            type="submit"
            form={formId}
            disabled={isPending}
            width={130}
          >
            {isPending ? "Сохранение…" : "Сохранить"}
          </Button>
        ),
      }}
    >
      <form
        id={formId}
        action={formAction}
        style={{ display: "grid", gap: 16, maxWidth: 400 }}
      >
        <TextField
          name="name"
          label="Название:"
          required
          defaultValue={state?.values?.name}
          error={state?.errors?.name}
          disabled={isPending}
        />
      </form>
    </Page>
  );
}
```

### 7. Свой переход страницы

```tsx
<Page title="Новая запись" transition="slide" onBack={goBack}>
  <Form />
</Page>
```

Порядок выбора перехода: `transition` у `Page`, затем `pageTransition` у `NavigationView`, затем `"auto"`.

### 8. Доступность

- Заголовок `title` выводится как `<h1>`, поэтому страница получает заголовок первого уровня. Передавайте в него короткий текст.
- Шапка — обычная область без `role="toolbar"`: в ней лежат поля и кнопки, а не единый набор с навигацией стрелками.
- Фокусируемые элементы и якоря (`[id]`) в теле страницы получают `scroll-margin-top`, равный высоте шапки плюс высота прилипшей шапки таблицы и 8px, поэтому при переходе по `Tab` они не прячутся под шапкой.
- Заголовок и кнопки в шапке над `hero` лежат поверх вашей картинки, и их контраст зависит от неё. Выбирайте баннер так, чтобы верхняя часть была достаточно тёмной или светлой, или добавьте затемнение в самой картинке.
- Подпись кнопки «Назад» меняется через `backLabel`.

## Ограничения

- Высота шапки фиксирована (`--page-header-height`, 58px при группе тулбара 36px). Более высокая панель инструментов выйдет за шапку. Если вы меняете переменную, порог появления подложки над баннером пересчитывается автоматически (по размеру шапки и окна).
- Шапка не сворачивается: `trailing` не сжимается, поэтому на узких экранах широкая панель инструментов может выйти за край шапки.
- Значения `--page-header-height`, `--page-padding`, `--sticky-header-bg` и `--sticky-header-filter` нельзя изменить свойствами: у `Page` нет `className` и `style`. Переопределять их нужно в глобальных стилях.
- Шапка лежит внутри прокручиваемой рамки страницы, поэтому при смене страницы анимируется вместе с телом (например, при `entrance` выезжает снизу).
- Свойство `transition` читается один раз, когда страница появилась вместе с рамкой. Страница, которая появится позже (`React.lazy` с `Suspense`, условный рендер), своё `transition` не применит.
- `hero` работает только в самом верху страницы. Баннер рендерится вторым экземпляром под боковой панелью, поэтому в нём не должно быть интерактивного содержимого и `id`.
- Подложка шапки (фон и блюр) зависит от `backdrop-filter`. Без его поддержки остаётся полупрозрачный фон без размытия.
- Встроенной загрузки и обработки ошибок нет, `onNavigate` и кнопки «Повторить» у страницы больше нет.
- Автоматического перехода кнопкой «Назад» нет: `onBack` только вызывается, навигацию в нём делаете сами. Кнопка показывается только при переданном `onBack`.
