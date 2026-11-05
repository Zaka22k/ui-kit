PersonPicture

Элемент управления для отображения аватара пользователя, его инициалов или контактных данных.
Реализует каскадную логику резервного отображения (изображение → инициалы → контактные данные → универсальный глиф), поддерживает бейджи уведомлений, текстовую подпись справа и интерактивный режим (hover / active / клавиатурная навигация).

Параметры

Название параметра Тип Описание
profilePicture string Прямой URL изображения профиля. Имеет наивысший приоритет над изображениями из объекта contact.
displayName string Отображаемое имя пользователя. Используется для автоматической генерации инициалов, формирования aria-label и вывода текста подписи справа.
initials string Явно заданные инициалы (до 3 символов). Переопределяют автоматическое извлечение инициалов из displayName или contact.
contact ContactData Объект с контактными данными (firstName, lastName, displayName, largeDisplayPicture, smallDisplayPicture, thumbnail, email, phone).
preferSmallImage boolean По умолчанию false. Если true, при выборе фото из объекта contact отдаёт приоритет smallDisplayPicture перед largeDisplayPicture.
size number Диаметр круглого аватара в пикселях. По умолчанию 48. Пропорционально масштабирует размер шрифта инициалов и внутреннего глифа.
badgeNumber number Числовой счётчик уведомлений, отображаемый в правом нижнем углу аватара. Имеет приоритет над badgeText.
badgeText string Текстовое содержимое или символ внутри бейджа в правом нижнем углу аватара.
showLabel boolean По умолчанию false. Включает автоматический вывод текстовой подписи (имени и дополнительных данных из contact) справа от аватара.
label ReactNode Явно заданный основной текст подписи справа. Включает блок подписи даже при showLabel={false}.
secondaryLabel ReactNode Вторичный текст подписи справа (должность, статус, почта). Рендерится под основным текстом.
interactive boolean Включает интерактивные состояния (hover, active, focus-visible), role="button" и tabIndex={0}. По умолчанию включается автоматически, если передан onClick.
disabled boolean По умолчанию false. Отключает интерактивность, блокирует вызов onClick и переводит компонент в полупрозрачное неактивное состояние.
className string Пользовательский CSS-класс. Применяется к корневому контейнеру <div>.
style CSSProperties Инлайн-стили. Применяются к корневому контейнеру вместе с CSS-переменной --pp-size.
...rest HTMLAttributes<HTMLDivElement> Стандартные атрибуты (onClick, onKeyDown, id, data-_, aria-_), передаваемые в корневой элемент <div>.

Быстрый старт

tsx
import { PersonPicture } from "@ui-kit/components";

export default function App() {
return (
<div style={{ display: "flex", gap: 16, alignItems: "center" }}>
{/_ Аватар с изображением и резервными инициалами _/}
<PersonPicture
        displayName="Betsy Sherman"
        profilePicture="/assets/BetsyShermanProfile.png"
        initials="BS"
      />

      {/* Автоматическая генерация инициалов из имени */}
      <PersonPicture displayName="Иван Петров" badgeNumber={3} />

      {/* Интерактивная карточка с подписью справа */}
      <PersonPicture
        displayName="Анна Смирнова"
        secondaryLabel="В сети"
        showLabel
        onClick={() => console.log("Profile opened")}
      />

      {/* Универсальный глиф (когда данные не переданы) */}
      <PersonPicture />
    </div>

);
}
Используйте код с осторожностью.

Примеры использования

1. Привязка объекта Contact и приоритеты изображений

Компонент самостоятельно оценивает объект contact и выбирает первое доступное изображение в порядке: largeDisplayPicture → smallDisplayPicture → thumbnail. Чтобы повысить приоритет маленького изображения (например, в плотных списках), передайте preferSmallImage. Если картинка не загрузилась, автоматически отобразятся инициалы, символ почты или последние цифры телефона.
tsx
import { PersonPicture, ContactData } from "@ui-kit/components";

const userContact: ContactData = {
firstName: "Betsy",
lastName: "Sherman",
largeDisplayPicture: "/assets/betsy-large.png",
smallDisplayPicture: "/assets/betsy-small.png",
email: "betsy@example.com",
};

<PersonPicture contact={userContact} preferSmallImage size={40} />;
Используйте код с осторожностью.

2. Вариант с текстовой подписью справа

Флаг showLabel автоматически выводит имя пользователя первой строкой и контактные данные (email или phone) второй строкой. Вы также можете передать произвольный ReactNode через label и secondaryLabel.
tsx
{/_ Автоматический вывод имени и email из объекта contact _/}
<PersonPicture contact={userContact} showLabel />

{/_ Ручное переопределение текста и подзаголовка _/}
<PersonPicture
  displayName="Алексей Волков"
  profilePicture="/assets/alexey.jpg"
  label="Алексей Волков"
  secondaryLabel="Ведущий дизайнер"
  size={44}
/>
Используйте код с осторожностью.

3. Управление размерами и бейджем уведомлений

Параметр size задаёт габариты круга в пикселях через CSS-переменную --pp-size, от которой автоматически рассчитывается кегль инициалов (calc(var(--pp-size) \* 0.38)). Для индикации событий используйте badgeNumber или badgeText.
tsx
<PersonPicture displayName="Мария К." size={32} />
<PersonPicture displayName="Мария К." size={48} badgeNumber={12} />
<PersonPicture displayName="Мария К." size={64} badgeText="★" />
Используйте код с осторожностью.

4. Интерактивный режим (Hover / Active / Клавиатура)

При передаче обработчика onClick (или флага interactive) элемент получает role="button", tabIndex={0} и поддержку клавиш Enter / Space. Одиночный аватар реагирует на нажатие упругим сжатием кружка (scale(0.94)), а вариант с подписью справа превращается в кликабельную плашку со скруглением --ControlCornerRadius и подсветкой фона.
tsx
{/_ Кликабельный одиночный аватар _/}
<PersonPicture
displayName="Дмитрий Соколов"
onClick={() => console.log("Avatar clicked")}
/>

{/_ Кликабельная плашка пользователя в сайдбаре или меню _/}
<PersonPicture
displayName="Дмитрий Соколов"
secondaryLabel="Открыть профиль"
onClick={() => console.log("Card clicked")}
/>
Используйте код с осторожностью.

Ограничения

• Ограничение длины инициалов: Явно переданная строка initials автоматически приводится к верхнему регистру и обрезается до 3 символов. Автогенерация из displayName всегда возвращает не более 2 букв (первую и последнюю часть имени).
• Приоритет badgeNumber над badgeText: Если передать оба параметра одновременно, отобразится только значение badgeNumber.
• Отрицательные внешние отступы в интерактивном режиме с подписью: Для плавной подсветки всей плашки при наведении комбинация классов .withLabel.interactive добавляет внутренний padding и компенсирует его отрицательным margin: -6px -10px -6px -6px. Учитывайте это при размещении компонента в контейнерах с overflow: hidden.
• Отсутствие forwardRef: Компонент не оборачивается в forwardRef — для позиционирования и стилизации используйте className и style, которые попадают на корневой <div>.
• Защита CSS-переменной --pp-size: Размер аватара записывается в инлайн-стиль --pp-size. Если передать собственное свойство --pp-size внутри пропа style, оно перезапишет значение пропа size.
Переходим к документации для SegmentedControl и TabBar в таком же формате?
