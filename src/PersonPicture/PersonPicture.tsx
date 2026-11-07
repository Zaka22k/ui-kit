import React, { useId, useMemo, useState } from "react";
import styles from "./PersonPicture.module.css";

export interface ContactData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  largeDisplayPicture?: string;
  smallDisplayPicture?: string;
  thumbnail?: string;
  email?: string;
  phone?: string;
}

export interface PersonPictureProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Прямой URL изображения профиля */
  profilePicture?: string;
  /** Отображаемое имя пользователя (используется для генерации инициалов и подписи) */
  displayName?: string;
  /** Явно заданные инициалы (переопределяют автогенерацию из имени) */
  initials?: string;
  /** Объект контакта (аналог Windows.ApplicationModel.Contacts.Contact) */
  contact?: ContactData;
  /** Если true, отдает приоритет smallDisplayPicture перед largeDisplayPicture */
  preferSmallImage?: boolean;
  /** Размер аватара в пикселях (по умолчанию 48px) */
  size?: number;
  /** Число или текст бейджа уведомлений в углу аватара */
  badgeNumber?: number;
  badgeText?: string;
  /** Accessible text of the badge, e.g. "3 непрочитанных". By default the badge value itself is used. */
  badgeLabel?: string;
  /** Отображать текстовую подпись (имя и доп. инфо) справа от аватара */
  showLabel?: boolean;
  /** Переопределение основного текста подписи справа (по умолчанию берется имя или email/телефон) */
  label?: React.ReactNode;
  /** Вторичный текст подписи справа (например, должность, статус или email) */
  secondaryLabel?: React.ReactNode;
  /** Включает интерактивное состояние (hover / active / focus). По умолчанию включается автоматически, если передан onClick */
  interactive?: boolean;
  /** Отключает интерактивность (состояние disabled) */
  disabled?: boolean;
  /** Ref корневого элемента */
  ref?: React.Ref<HTMLDivElement>;
}

/* Works on code points, so emoji and other astral characters are not cut in half. */
const chars = (value: string): string[] => Array.from(value);

/**
 * Извлекает инициалы из полного имени (например, "Betsy Sherman" -> "BS")
 */
function getInitialsFromName(name?: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return chars(parts[0]).slice(0, 2).join("").toUpperCase();
  }
  return (
    chars(parts[0])[0] + chars(parts[parts.length - 1])[0]
  ).toUpperCase();
}

export const PersonPicture: React.FC<PersonPictureProps> = ({
  profilePicture,
  displayName,
  initials,
  contact,
  preferSmallImage = false,
  size = 48,
  badgeNumber,
  badgeText,
  badgeLabel,
  showLabel = false,
  label,
  secondaryLabel,
  interactive,
  disabled = false,
  onClick,
  onKeyDown,
  tabIndex,
  ref,
  className = "",
  style,
  ...rest
}) => {
  const [failedSrc, setFailedSrc] = useState<string | undefined>();
  const baseId = useId();

  // 1. Определение URL изображения по приоритетам WinUI
  const resolvedImageSrc = useMemo(() => {
    if (profilePicture) return profilePicture;
    if (!contact) return undefined;

    if (preferSmallImage) {
      return (
        contact.smallDisplayPicture ||
        contact.largeDisplayPicture ||
        contact.thumbnail
      );
    }
    return (
      contact.largeDisplayPicture ||
      contact.smallDisplayPicture ||
      contact.thumbnail
    );
  }, [profilePicture, contact, preferSmallImage]);

  // 2. Определение полного имени
  const resolvedName = useMemo(() => {
    if (displayName) return displayName;
    if (!contact) return "";
    if (contact.displayName) return contact.displayName;
    return [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  }, [displayName, contact]);

  // 3. Определение текста/инициалов
  const resolvedInitials = useMemo(() => {
    if (initials) return chars(initials).slice(0, 3).join("").toUpperCase();
    const fromName = getInitialsFromName(resolvedName);
    if (fromName) return fromName;

    if (contact?.email) return chars(contact.email)[0].toUpperCase();
    if (contact?.phone) return chars(contact.phone).slice(-2).join("");

    return "";
  }, [initials, resolvedName, contact]);

  // 4. Определение текстов для подписи справа
  const primaryText =
    label !== undefined
      ? label
      : showLabel
        ? resolvedName || contact?.email || contact?.phone
        : undefined;

  const secondaryText =
    secondaryLabel !== undefined
      ? secondaryLabel
      : showLabel && resolvedName
        ? contact?.email || contact?.phone
        : undefined;

  const hasLabelBlock = Boolean(primaryText || secondaryText);

  // 5. Интерактивность: стили включаются через interactive или onClick, а role="button" и фокус — только при onClick
  const isInteractive = Boolean((interactive ?? Boolean(onClick)) && !disabled);
  const isActionable = isInteractive && Boolean(onClick);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    onKeyDown?.(e);
    if (
      isActionable &&
      !e.defaultPrevented &&
      e.target === e.currentTarget &&
      (e.key === "Enter" || e.key === " ")
    ) {
      e.preventDefault();
      // A real click: onClick gets a genuine MouseEvent. / Настоящий клик: onClick получает MouseEvent.
      e.currentTarget.click();
    }
  };

  const nameFallback =
    resolvedName ||
    contact?.email ||
    contact?.phone ||
    initials ||
    "Фотография пользователя";

  // 6. Бейдж лежит внутри role="img"/"button", поэтому его значение добавляется в доступное имя
  const badgeContent =
    badgeNumber !== undefined && badgeNumber !== 0
      ? badgeNumber
      : badgeNumber === undefined && badgeText
        ? badgeText
        : undefined;
  const badgeSuffix =
    badgeContent !== undefined ? (badgeLabel ?? String(badgeContent)) : undefined;

  const nameId = `${baseId}-name`;
  const primaryId = `${baseId}-primary`;
  const secondaryId = `${baseId}-secondary`;
  const badgeId = `${baseId}-badge`;

  // With a visible label block the name is built from the visible text (WCAG 2.5.3).
  // При видимой подписи имя собирается из видимого текста (WCAG 2.5.3).
  const labelledBy = hasLabelBlock
    ? [
        primaryText ? primaryId : nameId,
        secondaryText ? secondaryId : undefined,
        badgeSuffix ? badgeId : undefined,
      ]
        .filter(Boolean)
        .join(" ")
    : undefined;
  const ariaLabel = hasLabelBlock
    ? undefined
    : badgeSuffix
      ? `${nameFallback}, ${badgeSuffix}`
      : nameFallback;

  const showImage = Boolean(resolvedImageSrc && failedSrc !== resolvedImageSrc);

  const rootClassName = [
    styles.personPicture,
    hasLabelBlock ? styles.withLabel : "",
    isInteractive ? styles.interactive : "",
    disabled ? styles.disabled : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClassName}
      style={
        {
          "--pp-size": `${size}px`,
          ...style,
        } as React.CSSProperties
      }
      ref={ref}
      role={isActionable ? "button" : hasLabelBlock ? "group" : "img"}
      tabIndex={isActionable ? (tabIndex ?? 0) : tabIndex}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      title={!hasLabelBlock ? ariaLabel : undefined}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      <div className={styles.avatarContainer}>
        <div className={styles.avatar}>
          {showImage ? (
            <img
              src={resolvedImageSrc}
              alt=""
              className={styles.image}
              onError={() => setFailedSrc(resolvedImageSrc)}
              draggable={false}
            />
          ) : resolvedInitials ? (
            <span className={styles.initials}>
              {resolvedInitials}
            </span>
          ) : (
            <svg
              className={styles.glyph}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
            </svg>
          )}
        </div>

        {badgeContent !== undefined && (
          <span className={`${styles.badge} CaptionTextBlockStyle`}>
            {badgeContent}
          </span>
        )}
      </div>

      {hasLabelBlock && (
        <div className={styles.labelGroup}>
          {!primaryText && (
            <span id={nameId} hidden>
              {nameFallback}
            </span>
          )}
          {badgeSuffix && (
            <span id={badgeId} hidden>
              {badgeSuffix}
            </span>
          )}
          {primaryText && (
            <span
              id={primaryId}
              className={`${styles.primaryLabel} BodyTextBlockStyle BodyStrongTextBlockStyle`}
            >
              {primaryText}
            </span>
          )}
          {secondaryText && (
            <span
              id={secondaryId}
              className={`${styles.secondaryLabel} CaptionTextBlockStyle`}
            >
              {secondaryText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PersonPicture;
