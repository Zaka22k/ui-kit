import React, { useState, useEffect, useMemo } from "react";
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
}

/**
 * Извлекает инициалы из полного имени (например, "Betsy Sherman" -> "BS")
 */
function getInitialsFromName(name?: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
  showLabel = false,
  label,
  secondaryLabel,
  interactive,
  disabled = false,
  onClick,
  onKeyDown,
  tabIndex,
  className = "",
  style,
  ...rest
}) => {
  const [imgError, setImgError] = useState(false);

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

  useEffect(() => {
    setImgError(false);
  }, [resolvedImageSrc]);

  // 2. Определение полного имени
  const resolvedName = useMemo(() => {
    if (displayName) return displayName;
    if (!contact) return "";
    if (contact.displayName) return contact.displayName;
    return [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  }, [displayName, contact]);

  // 3. Определение текста/инициалов
  const resolvedInitials = useMemo(() => {
    if (initials) return initials.slice(0, 3).toUpperCase();
    const fromName = getInitialsFromName(resolvedName);
    if (fromName) return fromName;

    if (contact?.email) return contact.email[0].toUpperCase();
    if (contact?.phone) return contact.phone.slice(-2);

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

  // 5. Логика интерактивности (включается явно через interactive или автоматически при наличии onClick)
  const isInteractive = Boolean((interactive ?? Boolean(onClick)) && !disabled);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    onKeyDown?.(e);
    if (isInteractive && onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
  };

  const ariaLabel =
    resolvedName ||
    contact?.email ||
    contact?.phone ||
    initials ||
    "Фотография пользователя";

  const showImage = Boolean(resolvedImageSrc && !imgError);
  const badgeContent = badgeNumber !== undefined ? badgeNumber : badgeText;

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
      role={isInteractive ? "button" : hasLabelBlock ? "group" : "img"}
      tabIndex={isInteractive ? (tabIndex ?? 0) : tabIndex}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
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
              alt={ariaLabel}
              className={styles.image}
              onError={() => setImgError(true)}
              draggable={false}
            />
          ) : resolvedInitials ? (
            <span className={`${styles.initials} BodyStrongTextBlockStyle`}>
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
          {primaryText && (
            <span
              className={`${styles.primaryLabel} BodyTextBlockStyle BodyStrongTextBlockStyle`}
            >
              {primaryText}
            </span>
          )}
          {secondaryText && (
            <span className={`${styles.secondaryLabel} CaptionTextBlockStyle`}>
              {secondaryText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PersonPicture;
