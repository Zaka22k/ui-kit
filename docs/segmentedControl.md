SegmentedControl

Переключатель сегментов для выбора одного или нескольких вариантов из линейного набора.
В режиме одиночного выбора (single) использует плавающий ползунок, который в состоянии покоя выглядит как спокойная матовая капсула, а в момент переключения или перетаскивания (drag / scrub) превращается в расширенную стеклянную линзу FrostedGlass.

Параметры (SegmentedControl)

Название параметра Тип Описание
items readonly SegmentItem<T>[] Массив элементов для декларативной генерации сегментов (value, label, icon, disabled, tooltip, ariaLabel). Альтернатива передаче дочерних <Segment>.
children ReactNode Набор дочерних компонентов <Segment>. Используется, если не передан массив items.
trackingMode "single" | "multiple" | "momentary" Режим работы переключателя. По умолчанию "single" (радиогруппа с плавающей линзой). "multiple" — независимый выбор нескольких кнопок, "momentary" — мгновенное срабатывание только на время удержания кнопки.
value T Контролируемое выбранное значение для режима "single".
defaultValue T Начальное значение по умолчанию для неконтролируемого режима "single".
onValueChange (value: T, event: SyntheticEvent) => void Обработчик смены активного сегмента в режиме "single" (вызывается как при клике/клавиатуре, так и при перетаскивании ползунка).
values readonly T[] Контролируемый массив выбранных значений для режима "multiple".
defaultValues readonly T[] Массив начальных значений по умолчанию для режима "multiple". По умолчанию [].
onValuesChange (values: T[], event: SyntheticEvent) => void Обработчик изменения списка активных сегментов в режиме "multiple".
onSegmentInvoke (value: T, event: SyntheticEvent) => void Универсальный коллбэк, вызываемый при каждой активации любого сегмента независимо от trackingMode (особенно полезен для "momentary").
equalWidth boolean По умолчанию true. Задаёт всем сегментам одинаковую ширину (grid-auto-columns: 1fr). При false ширина каждой кнопки подстраивается под её контент.
fullWidth boolean По умолчанию false. Растягивает корневой контейнер на 100% ширины родителя.
size "small" | "regular" | "large" Размер переключателя. По умолчанию "regular" (32px). "small" — 26px, "large" — 36px.
shape "pill" | "rounded" Форма скругления трека и ползунка. По умолчанию "pill" (9999px). "rounded" использует системный радиус --ControlCornerRadius (8px).
appearance "neutral" | "accent" Цветовая схема активного ползунка в состоянии покоя. По умолчанию "neutral" (--control-surface). "accent" заливает ползунок цветом --control-accent, а текст делает --text-selected.
disabled boolean По умолчанию false. Блокирует весь переключатель, отключает интерактивность FrostedGlass и перетаскивание.
className string Пользовательский CSS-класс корневого контейнера <div>.
style CSSProperties Инлайн-стили корневого контейнера.
...rest HTMLAttributes<HTMLDivElement> Остальные стандартные атрибуты <div> (кроме onChange и defaultValue).

Параметры (Segment)

Название параметра Тип Описание
value string | number Обязательный уникальный идентификатор сегмента.
icon ReactNode Иконка сегмента (отображается слева от текста или самостоятельно).
children ReactNode Текстовая подпись сегмента.
disabled boolean Отключает конкретный сегмент (ползунок при перетаскивании пропускает его).
tooltip string Всплывающая подсказка (нативный атрибут title).
...rest HTMLAttributes<HTMLButtonElement> Стандартные атрибуты нативного элемента <button>.

Быстрый старт

tsx
import { useState } from "react";
import { SegmentedControl } from "@ui-kit/components";

export default function App() {
const [view, setView] = useState("day");

return (
<SegmentedControl
value={view}
onValueChange={setView}
items={[
{ value: "day", label: "Day" },
{ value: "week", label: "Week" },
{ value: "month", label: "Month" },
]}
/>
);
}
Используйте код с осторожностью.

Примеры использования

1. Плавное перетаскивание ползунка (Drag / Scrub) и композиция <Segment>

В режиме trackingMode="single" пользователь может как кликнуть по нужному сегменту, так и зажать кнопку мыши (или палец на тач-экране) и плавно провести вдоль трека. Стеклянная линза FrostedGlass расширится за пределы трека и будет следовать за указателем, автоматически подстраивая ширину между соседними сегментами.
tsx
import { SegmentedControl, Segment } from "@ui-kit/components";

<SegmentedControl defaultValue="week" appearance="accent" size="large">
  <Segment value="day">День</Segment>
  <Segment value="week">Неделя</Segment>
  <Segment value="month">Месяц</Segment>
  <Segment value="year" disabled>
    Год
  </Segment>
</SegmentedControl>;
Используйте код с осторожностью.

2. Множественный выбор (trackingMode="multiple")

В режиме "multiple" каждый активный сегмент получает собственную индивидуальную подложку FrostedGlass, а роль контейнера меняется на role="group" с кнопками aria-pressed.
tsx
const [formats, setFormats] = useState<string[]>(["bold", "italic"]);

<SegmentedControl
trackingMode="multiple"
shape="rounded"
size="small"
equalWidth={false}
values={formats}
onValuesChange={setFormats}
items={[
{ value: "bold", label: "B", tooltip: "Полужирный" },
{ value: "italic", label: "I", tooltip: "Курсив" },
{ value: "underline", label: "U", tooltip: "Подчёркнутый" },
]}
/>;
Используйте код с осторожностью.

3. Мгновенный режим (trackingMode="momentary")

В режиме "momentary" сегмент подсвечивается стеклянной капсулой только пока удерживается кнопка мыши или палец, что идеально подходит для панелей действий (например, зум или шаг назад/вперёд).
tsx
<SegmentedControl
trackingMode="momentary"
equalWidth={false}
onSegmentInvoke={(action) => console.log("Triggered:", action)}
items={[
{ value: "zoom-out", label: "−", ariaLabel: "Отдалить" },
{ value: "reset", label: "100%" },
{ value: "zoom-in", label: "+", ariaLabel: "Приблизить" },
]}
/>
Используйте код с осторожностью.

Ограничения

• Скраббинг (Drag) доступен только в режиме "single": В режимах "multiple" и "momentary" единого плавающего ползунка нет, поэтому ведение курсора с зажатой кнопкой не переключает соседние элементы.
• Контекстная изоляция <Segment>: Использование компонента <Segment> вне <SegmentedControl> вызовет ошибку выполнения React.
• Выход стеклянной линзы за границы трека: Во время перехода или удержания ползунок увеличивается через transform: scale(1.06, 1.24). Не помещайте SegmentedControl в родительский контейнер с overflow: hidden вплотную к краям, иначе верхняя и нижняя кромки стекла будут обрезаны.
• Игнорирование items при одновременной передаче с children: Если передан проп items, дочерние элементы children игнорируются.
