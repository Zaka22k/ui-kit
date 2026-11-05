TabBar

Навигационная панель вкладок в форме капсулы, где и внешняя подложка (с тоном --fill-tertiary, аналогично группе Toolbar), и внутренний более яркий ползунок активной вкладки (--fill-primary) выполнены из FrostedGlass. Поддерживает два режима компоновки (inline и stacked), бейджи уведомлений и плавное перетаскивание стеклянной линзы.

Параметры (TabBar)

Название параметра Тип Описание
items readonly TabBarItem<T>[] Массив вкладок (value, label, icon, activeIcon, badge, disabled, ariaLabel).
children ReactNode Дочерние компоненты <Tab>. Используются, если не передан проп items.
value T Контролируемое значение активной вкладки.
defaultValue T Значение активной вкладки по умолчанию для неконтролируемого режима (если не указано, выбирается первая доступная вкладка из items).
onValueChange (value: T, event: SyntheticEvent) => void Обработчик переключения вкладки (срабатывает при клике, нажатии стрелок клавиатуры и при перетаскивании ползунка).
layout "stacked" | "inline" Компоновка элементов. "stacked" — крупная иконка сверху, подпись снизу (высота 58px). "inline" — компактный горизонтальный ряд (высота 36px). По умолчанию определяется автоматически: "stacked" при наличии иконок, иначе "inline".
accentSelected boolean Окрашивает иконку и текст выбранной вкладки в акцентный цвет var(--control-accent). По умолчанию true для layout="stacked" и false для layout="inline".
fullWidth boolean По умолчанию false. Растягивает TabBar на 100% ширины родительского контейнера.
disabled boolean По умолчанию false. Блокирует взаимодействие со всеми вкладками и отключает интерактивность стеклянного ползунка.
className string Пользовательский CSS-класс. Применяется к корневой обёртке FrostedGlass.
style CSSProperties Инлайн-стили корневой обёртки FrostedGlass.
...rest HTMLAttributes<HTMLDivElement> Стандартные атрибуты <div>, передаваемые в корневой FrostedGlass.

Параметры (Tab)

Название параметра Тип Описание
value string | number Обязательный уникальный идентификатор вкладки.
icon ReactNode Основная иконка вкладки (22×22px в режиме stacked, 16×16px в режиме inline).
activeIcon ReactNode Опциональная иконка для выбранного состояния (например, залитый вариант контурной иконки).
badge number | string Счётчик или метка уведомлений в правом верхнем углу иконки.
children ReactNode Текстовое название вкладки.
disabled boolean Отключает конкретную вкладку.
...rest HTMLAttributes<HTMLButtonElement> Стандартные атрибуты нативного элемента <button>.

Быстрый старт

tsx
import { useState } from "react";
import { TabBar } from "@ui-kit/components";

export default function App() {
const [tab, setTab] = useState("home");

return (
<TabBar
value={tab}
onValueChange={setTab}
items={[
{ value: "home", label: "Home", icon: <HomeIcon /> },
{ value: "radio", label: "Radio", icon: <RadioIcon /> },
{ value: "library", label: "Library", icon: <LibraryIcon />, badge: 4 },
{ value: "search", label: "Search", icon: <SearchIcon /> },
]}
/>
);
}
Используйте код с осторожностью.

Примеры использования

1. Компактный текстовый режим (layout="inline")

Если передать элементы без иконок, TabBar автоматически переключится в компактный режим inline (min-height: 36px), а активный текст останется контрастным белым/чёрным (var(--text-primary)).
tsx
const [period, setPeriod] = useState("year");

<TabBar
value={period}
onValueChange={setPeriod}
items={[
{ value: "day", label: "Day" },
{ value: "week", label: "Week" },
{ value: "month", label: "Month" },
{ value: "year", label: "Year" },
]}
/>;
Используйте код с осторожностью.

2. Навигационный бар с кастомным системным акцентом и activeIcon

Поскольку активная вкладка в режиме stacked использует var(--control-accent), вы можете управлять её цветом через атрибут data-accent на родительском элементе, а также подменять контурную иконку на залитую через activeIcon.
tsx
import { TabBar, Tab } from "@ui-kit/components";

<div data-accent="pink">
  <TabBar defaultValue="home">
    <Tab
      value="home"
      icon={<HomeOutlineIcon />}
      activeIcon={<HomeFilledIcon />}
    >
      Home
    </Tab>
    <Tab value="radio" icon={<RadioIcon />}>
      Radio
    </Tab>
    <Tab value="library" icon={<LibraryIcon />} badge="NEW">
      Library
    </Tab>
  </TabBar>
</div>;
Используйте код с осторожностью.

3. Горизонтальный режим с иконками

Если вы хотите использовать иконки, но оставить горизонтальное расположение иконки и текста в одну строку, явно укажите layout="inline".
tsx
<TabBar
layout="inline"
accentSelected={false}
defaultValue="list"
items={[
{ value: "list", label: "Список", icon: <ListIcon /> },
{ value: "grid", label: "Сетка", icon: <GridIcon /> },
{ value: "map", label: "Карта", icon: <MapIcon /> },
]}
/>
Используйте код с осторожностью.

Ограничения

• Отображение badge привязано к наличию icon: Счётчик badge рендерится внутри обёртки .iconWrap поверх иконки. Если вкладка содержит только текст без icon, бейдж отображаться не будет.
• Автоопределение layout при использовании дочерних <Tab>: Автоматическое распознавание иконок анализирует только массив items. Если вы собираете TabBar через дочерние теги <Tab> с иконками, передайте layout="stacked" явно, иначе применится "inline".
• Выход ползунка за пределы капсулы при движении: Во время перетаскивания или анимации перелёта между вкладками внутренний ползунок увеличивается (scale(1.05, 1.18)). Оставляйте вокруг TabBar минимум 6–8px свободного пространства без overflow: hidden.
• Передача tint во внешний FrostedGlass: Корневой элемент передаёт в FrostedGlass проп tint="var(--fill-tertiary)". Если в style передать собственный backgroundColor, он перекроет полупрозрачную заливку стеклянной подложки.
