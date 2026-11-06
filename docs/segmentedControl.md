egmentedControl

Универсальный компонент управления выбором. Объединяет в себе функциональность классического переключателя сегментов, навигационного таб-бара и списка фильтров (pills/chips).
Поддерживает:
•
3 визуальных стиля: solid (форм-контрол), glass (навигация), pills (фильтры со скроллом).
•
2 режима выбора: Одиночный (радио) и Множественный (чекбоксы).
•
FrostedGlass: В режиме glass использует компонент матового стекла для фона и ползунка.
•
Адаптивность: Поддержка иконок, бейджей уведомлений, тултипов и автоматической ширины.

Импорт

tsx
import { SegmentedControl, Segment } from "./SegmentedControl";
// Требует наличия компонента FrostedGlass в проекте
Используйте код с осторожностью.

API

SegmentedControl Props

Свойство Тип По умолч. Описание
variant
'solid' | 'glass' | 'pills' 'solid' Стиль отображения (см. раздел Варианты).
layout
'inline' | 'stacked' 'inline' 'inline' — в строку (h=32/36px). 'stacked' — иконка над текстом (h=58px).
appearance
'neutral' | 'accent' 'neutral' 'neutral' — серый/белый. 'accent' — использует системный цвет (--control-accent).
items
SegmentItem[] undefined Массив данных для рендера. Если не передан, используйте children.
value
T undefined Контролируемое значение (Single mode).
defaultValue
T undefined Начальное значение (Single mode).
values
T[] undefined Контролируемый массив (Multiple mode).
defaultValues
T[] [] Начальный массив (Multiple mode). Передача этого пропа включает режим Multiple.
fullWidth
boolean false Растягивает контейнер на 100% ширины.
equalWidth
boolean true Делит ширину поровну между сегментами. false — ширина по контенту.
disabled
boolean false Блокирует весь компонент.

Интерфейс элемента (SegmentItem)

Объект, передаваемый в массив items.
typescript
interface SegmentItem {
value: string | number; // Уникальный ID
label?: ReactNode; // Текст кнопки
icon?: ReactNode; // Иконка (всегда видна или заменяется при activeIcon)
activeIcon?: ReactNode; // Иконка только для активного состояния
badge?: string | number;// Кружок с уведомлением (счетчик)
disabled?: boolean; // Блокировка отдельной кнопки
tooltip?: string; // Нативный title при наведении
}
Используйте код с осторожностью.

Варианты отображения (Variant)

Компонент кардинально меняет внешний вид в зависимости от пропа variant.

1. solid (Классический)

Стандартный переключатель с серой подложкой (--fill-secondary) и белым плавающим ползунком с тенью.
•
Использование: Переключение видов (Карта/Список), масштаба, пола, тем оформления.
•
Особенности: Высота 32px.
tsx
<SegmentedControl
variant="solid"
defaultValue="map"
items={[
{ value: "map", label: "Карта" },
{ value: "list", label: "Список" }
]}
/>
Используйте код с осторожностью.

2. glass (Навигация / TabBar)

Прозрачный фон, использующий эффект FrostedGlass. Ползунок — это слой более яркого стекла.
•
Использование: Нижняя навигация, переключение главных разделов поверх контента.
•
Особенности: Высота 36px (inline) или 58px (stacked). Нет теней, только размытие.
tsx
<SegmentedControl
variant="glass"
layout="stacked" // Вертикальный вид для табов
defaultValue="home"
items={[
{ value: "home", label: "Главная", icon: <IconHome />, activeIcon: <IconHomeFilled /> },
{ value: "chat", label: "Чаты", icon: <IconChat />, badge: 5 }
]}
/>
Используйте код с осторожностью.

3. pills (Фильтры / Чипсы)

Горизонтальный скролл-контейнер с раздельными кнопками.
•
Использование: Фильтры категорий (как в YouTube), теги.
•
Особенности: Ползунок превращается в фон активной кнопки. Неактивные кнопки имеют обводку. Автоматически включает скролл, если элементы не влезают. Рекомендуется использовать с equalWidth={false}.
tsx
<SegmentedControl
variant="pills"
equalWidth={false}
appearance="accent"
items={[
{ value: "all", label: "Все" },
{ value: "games", label: "Игры" },
{ value: "music", label: "Музыка" },
// ... еще 10 элементов
]}
/>
Используйте код с осторожностью.

Режимы выбора

Одиночный выбор (Single)

Работает как <input type="radio">. Есть один плавающий ползунок, который перемещается между сегментами.
Включается передачей value или defaultValue (не массивом).

Множественный выбор (Multiple)

Работает как группа <input type="checkbox">.
•
Визуально: Общего ползунка нет. При выборе каждый сегмент подсвечивается индивидуально (в режиме glass — своим кусочком стекла, в solid — фоном).
•
Активация: Передайте массив в values или defaultValues.
tsx
// Пример множественного выбора (Тулбар форматирования)
<SegmentedControl
defaultValues={["bold"]} // <-- Массив включает Multiple режим
equalWidth={false}
items={[
{ value: "bold", icon: <IconBold /> },
{ value: "italic", icon: <IconItalic /> },
{ value: "underline", icon: <IconUnderline /> }
]}
/>
