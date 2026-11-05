"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementType,
  HTMLAttributes,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { FrostedGlass } from "../FrostedGlass";
import Button from "../Button";
import {
  PageFrameContext,
  createPageTransitionInfo,
  normalizePagePath,
  playPageAnimations,
  prefersReducedMotion,
  resolvePageTransition,
} from "./pageTransitions";
import type {
  PageFrameContextValue,
  PageKey,
  PageTransitionInfo,
  PageTransitionSetting,
} from "./pageTransitions";
import styles from "./NavigationView.module.css";

export {
  autoTransition,
  drillInTransition,
  entranceTransition,
  pageMotion,
  slideTransition,
  suppressTransition,
} from "./pageTransitions";
export type {
  PageAnimation,
  PageKey,
  PageTransitionFn,
  PageTransitionInfo,
  PageTransitionName,
  PageTransitionSetting,
} from "./pageTransitions";

export type PaneDisplayMode = "auto" | "left" | "leftCompact" | "leftMinimal";

type ResolvedPaneMode = Exclude<PaneDisplayMode, "auto">;

interface NavContextValue {
  selectedValue?: string | number | null;
  select: (
    event: React.SyntheticEvent,
    value: string | number,
    options?: { selects?: boolean },
  ) => void;
  openCategories: Array<string | number>;
  toggleCategory: (value: string | number) => void;
  isPaneOpen: boolean;
  onItemInvoked: () => void;
  rootRef: React.RefObject<HTMLDivElement | null>;
  extendsUnderPane: boolean;
}

const NavContext = createContext<NavContextValue | null>(null);

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

function useControllable<T>(
  controlledValue: T | undefined,
  defaultValue: T,
): [T, (val: T) => void, boolean] {
  const [inner, setInner] = useState<T>(defaultValue);
  const isControlled = controlledValue !== undefined;
  return [isControlled ? controlledValue : inner, setInner, isControlled];
}

function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) {
    throw new Error(
      "NavItem / NavCategory / NavSubItem нужно использовать внутри <NavigationView>",
    );
  }
  return ctx;
}

function useWindowBreakpoint(
  minQuery: string,
  enabled: boolean,
  defaultValue = false,
): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!enabled || typeof window === "undefined") return () => {};
      const mql = window.matchMedia(minQuery);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    [minQuery, enabled],
  );

  const getSnapshot = useCallback(() => {
    if (!enabled || typeof window === "undefined") return defaultValue;
    return window.matchMedia(minQuery).matches;
  }, [minQuery, enabled, defaultValue]);

  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function useAutoDisplayModeSync(
  compact: number,
  expanded: number,
  enabled: boolean,
): ResolvedPaneMode | null {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!enabled || typeof window === "undefined") return () => {};
      const mqlMinimal =
        compact > 0 ? window.matchMedia(`(max-width: ${compact}px)`) : null;
      const mqlExpanded = window.matchMedia(`(min-width: ${expanded}px)`);

      mqlMinimal?.addEventListener("change", callback);
      mqlExpanded.addEventListener("change", callback);

      return () => {
        mqlMinimal?.removeEventListener("change", callback);
        mqlExpanded.removeEventListener("change", callback);
      };
    },
    [compact, expanded, enabled],
  );

  const getSnapshot = useCallback((): ResolvedPaneMode | null => {
    if (!enabled || typeof window === "undefined") return null;
    if (window.matchMedia(`(min-width: ${expanded}px)`).matches) {
      return "left";
    }
    if (compact > 0 && window.matchMedia(`(max-width: ${compact}px)`).matches) {
      return "leftMinimal";
    }
    return "leftCompact";
  }, [compact, expanded, enabled]);

  const getServerSnapshot = useCallback(
    (): ResolvedPaneMode | null => (enabled ? "left" : null),
    [enabled],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const FOCUSABLE_ITEM =
  '[data-nv-item]:not(:disabled):not([aria-disabled="true"])';

function moveFocusInContainer(
  container: HTMLElement | null,
  key: string,
  excludeCollapsed = false,
): boolean {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(key) || !container) {
    return false;
  }
  const items = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_ITEM),
  ).filter(
    (el) => !excludeCollapsed || !el.closest('[data-nv-collapsed="true"]'),
  );
  if (items.length === 0) return false;

  const current = items.indexOf(document.activeElement as HTMLElement);
  let next: number;
  if (key === "Home") next = 0;
  else if (key === "End") next = items.length - 1;
  else if (key === "ArrowDown")
    next = current < 0 ? 0 : (current + 1) % items.length;
  else
    next =
      current < 0
        ? items.length - 1
        : (current - 1 + items.length) % items.length;

  items[next].focus();
  return true;
}

const FLYOUT_STYLE: CSSProperties = {
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  backgroundColor: "var(--nav-flyout-tint)",
};

function SidebarIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="2.25"
        y="3.75"
        width="15.5"
        height="12.5"
        rx="3.4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M7.6 4.2v11.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      width="12"
      height="12"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4.2 2.4 7.8 6l-3.6 3.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface PageFrameProps {
  info: PageTransitionInfo | null;
  setting: PageTransitionSetting;
  children?: ReactNode;
}

function PageFrame({ info, setting, children }: PageFrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  const overrideRef = useRef<PageTransitionSetting | undefined>(undefined);
  const frame = useMemo<PageFrameContextValue>(
    () => ({
      setTransition: (next) => {
        overrideRef.current = next;
      },
    }),
    [],
  );

  useIsoLayoutEffect(() => {
    const element = ref.current;
    if (!element || !info) return undefined;
    const animations = resolvePageTransition(
      overrideRef.current ?? setting,
      info,
      prefersReducedMotion(),
    );
    const running = playPageAnimations(element, animations);
    return () => running.forEach((animation) => animation.cancel());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageFrameContext.Provider value={frame}>
      <div ref={ref} className={styles.scroller}>
        {children}
      </div>
    </PageFrameContext.Provider>
  );
}

export function matchNavValue<T extends string | number>(
  pathname: string,
  values: readonly T[],
): T | null {
  const path = normalizePagePath(pathname);
  if (path === null) return null;
  let best: T | null = null;
  let bestLength = -1;
  for (const value of values) {
    const candidate = normalizePagePath(value);
    if (candidate === null) continue;
    const matches =
      path === candidate ||
      (candidate !== "/" && path.startsWith(`${candidate}/`));
    if (matches && candidate.length > bestLength) {
      best = value;
      bestLength = candidate.length;
    }
  }
  return best;
}

export interface NavigationViewProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onSelect"
> {
  children?: ReactNode;
  pageKey?: PageKey;
  pageTransition?: PageTransitionSetting;
  menuItems?: ReactNode;
  footerMenuItems?: ReactNode;
  paneTitle?: ReactNode;
  paneHeader?: ReactNode | ((props: { isPaneOpen: boolean }) => ReactNode);
  paneCustomContent?:
    | ReactNode
    | ((props: { isPaneOpen: boolean }) => ReactNode);
  paneFooter?: ReactNode | ((props: { isPaneOpen: boolean }) => ReactNode);
  paneDisplayMode?: PaneDisplayMode;
  expandedModeThresholdWidth?: number;
  compactModeThresholdWidth?: number;
  overlayFullWidthThreshold?: number;
  isPaneOpen?: boolean;
  onPaneOpenChange?: (isOpen: boolean) => void;
  isPaneToggleButtonVisible?: boolean;
  selectedValue?: string | number | null;
  defaultSelectedValue?: string | number | null;
  onNavItemSelect?: (
    event: React.SyntheticEvent,
    info: { value: string | number },
  ) => void;
  onSelectionChanged?: (
    event: React.SyntheticEvent,
    info: { value: string | number },
  ) => void;

  openCategories?: Array<string | number>;
  defaultOpenCategories?: Array<string | number>;
  onOpenCategoriesChange?: (categories: Array<string | number>) => void;
  allowMultipleOpenCategories?: boolean;
  paneAriaLabel?: string;
  toggleButtonLabel?: string;
  extendContentUnderPane?: boolean;
}
export function NavigationView({
  children,
  pageKey,
  pageTransition = "auto",
  menuItems,
  footerMenuItems,
  paneTitle,
  paneHeader,
  paneCustomContent,
  paneFooter,
  paneDisplayMode = "auto",
  expandedModeThresholdWidth = 1008,
  compactModeThresholdWidth = 640,
  overlayFullWidthThreshold = 640,
  isPaneOpen,
  onPaneOpenChange,
  isPaneToggleButtonVisible = true,
  selectedValue,
  defaultSelectedValue,
  onNavItemSelect,
  onSelectionChanged,
  openCategories,
  defaultOpenCategories = [],
  onOpenCategoriesChange,
  allowMultipleOpenCategories = false,
  paneAriaLabel = "Основная навигация",
  toggleButtonLabel = "Показать или скрыть боковую панель",
  extendContentUnderPane = false,
  className,
  style,
  ...rest
}: NavigationViewProps) {
  const paneId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLElement>(null);

  const [open, setOpenState, openControlled] = useControllable<boolean>(
    isPaneOpen,
    paneDisplayMode === "auto" || paneDisplayMode === "left",
  );
  const [selected, setSelected, selectedControlled] = useControllable<
    string | number | null | undefined
  >(selectedValue, defaultSelectedValue);
  const [openCats, setOpenCats, openCatsControlled] = useControllable(
    openCategories,
    defaultOpenCategories,
  );

  const setPaneOpen = useCallback(
    (next: boolean) => {
      if (!openControlled) setOpenState(next);
      onPaneOpenChange?.(next);
    },
    [openControlled, setOpenState, onPaneOpenChange],
  );

  const adaptive = paneDisplayMode === "auto";
  const autoMode = useAutoDisplayModeSync(
    compactModeThresholdWidth,
    expandedModeThresholdWidth,
    adaptive,
  );
  const displayMode: ResolvedPaneMode =
    paneDisplayMode === "auto" ? (autoMode ?? "left") : paneDisplayMode;
  const isOverlay = displayMode !== "left";
  const lastAutoModeRef = useRef<ResolvedPaneMode | null>(null);

  const prevModeRef = useRef(paneDisplayMode);
  useIsoLayoutEffect(() => {
    const prev = prevModeRef.current;
    prevModeRef.current = paneDisplayMode;
    if (prev === paneDisplayMode) return;
    if (paneDisplayMode === "auto") {
      lastAutoModeRef.current = null;
    } else {
      setPaneOpen(paneDisplayMode === "left");
    }
  }, [paneDisplayMode, setPaneOpen]);

  useIsoLayoutEffect(() => {
    if (!adaptive || autoMode === null) return;
    const prev = lastAutoModeRef.current;
    lastAutoModeRef.current = autoMode;
    if (prev === autoMode) return;
    const wantOpen = autoMode === "left";
    if (prev === null) {
      if (!openControlled) setOpenState(wantOpen);
    } else {
      setPaneOpen(wantOpen);
    }
  }, [adaptive, autoMode, openControlled, setOpenState, setPaneOpen]);

  const fullWidthEnabled = isOverlay && overlayFullWidthThreshold > 0;
  const isScreenWideForOverlay = useWindowBreakpoint(
    `(min-width: ${overlayFullWidthThreshold + 1}px)`,
    fullWidthEnabled,
    true,
  );
  const paneFull = fullWidthEnabled && !isScreenWideForOverlay;

  const focusToggle = useCallback(() => {
    paneRef.current?.querySelector<HTMLElement>("[data-nv-toggle]")?.focus();
  }, []);

  const overlayOpen = isOverlay && open;
  const closeOverlay = useCallback(() => {
    if (!overlayOpen) return;
    setPaneOpen(false);
    if (
      displayMode === "leftMinimal" &&
      paneRef.current?.contains(document.activeElement)
    ) {
      focusToggle();
    }
  }, [overlayOpen, displayMode, setPaneOpen, focusToggle]);

  useIsoLayoutEffect(() => {
    stageRef.current?.toggleAttribute("inert", overlayOpen);
  }, [overlayOpen]);

  const currentKey: PageKey | undefined = pageKey ?? selected ?? undefined;
  const previousKeyRef = useRef<PageKey | undefined>(undefined);
  const previousKey = previousKeyRef.current;
  const pageInfo =
    previousKey !== undefined &&
    currentKey !== undefined &&
    previousKey !== currentKey
      ? createPageTransitionInfo(previousKey, currentKey)
      : null;
  useIsoLayoutEffect(() => {
    previousKeyRef.current = currentKey;
  }, [currentKey]);

  const select = useCallback(
    (
      event: React.SyntheticEvent,
      value: string | number,
      { selects = true } = {},
    ) => {
      onNavItemSelect?.(event, { value });
      if (selects && value !== selected) {
        if (!selectedControlled) setSelected(value);
        onSelectionChanged?.(event, { value });
      }
    },
    [
      onNavItemSelect,
      onSelectionChanged,
      selected,
      selectedControlled,
      setSelected,
    ],
  );

  const toggleCategory = useCallback(
    (value: string | number) => {
      const isCurrentlyOpen = openCats.includes(value);
      const next = isCurrentlyOpen
        ? openCats.filter((v) => v !== value)
        : allowMultipleOpenCategories
          ? [...openCats, value]
          : [value];

      if (!openCatsControlled) setOpenCats(next);
      onOpenCategoriesChange?.(next);
    },
    [
      openCats,
      openCatsControlled,
      setOpenCats,
      onOpenCategoriesChange,
      allowMultipleOpenCategories,
    ],
  );

  const ctx = useMemo<NavContextValue>(
    () => ({
      selectedValue: selected,
      select,
      openCategories: openCats,
      toggleCategory,
      isPaneOpen: open,
      onItemInvoked: closeOverlay,
      rootRef,
      extendsUnderPane: extendContentUnderPane,
    }),
    [
      selected,
      select,
      openCats,
      toggleCategory,
      open,
      closeOverlay,
      extendContentUnderPane,
    ],
  );

  const handlePaneKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.defaultPrevented) return;
    if (
      (event.target as HTMLElement).closest(
        'input, textarea, select, [contenteditable="true"]',
      )
    ) {
      return;
    }
    if (event.key === "Escape" && overlayOpen) {
      event.preventDefault();
      setPaneOpen(false);
      focusToggle();
      return;
    }
    if (moveFocusInContainer(paneRef.current, event.key, true)) {
      event.preventDefault();
    }
  };

  const renderSlot = (
    node: ReactNode | ((props: { isPaneOpen: boolean }) => ReactNode),
  ) => (typeof node === "function" ? node({ isPaneOpen: open }) : node);

  const showToggleButton =
    isPaneToggleButtonVisible && paneDisplayMode !== "left";
  return (
    <NavContext.Provider value={ctx}>
      <div
        {...rest}
        ref={rootRef}
        className={cx(
          styles.root,
          open ? styles.paneOpen : styles.strip,
          isOverlay && styles.overlay,
          displayMode === "leftCompact" && styles.compact,
          displayMode === "leftMinimal" && styles.minimal,
          paneFull && styles.paneFull,
          extendContentUnderPane && styles.floating,
          className,
        )}
        style={style}
        data-pane-open={open}
        data-pane-mode={displayMode}
      >
        <nav
          ref={paneRef}
          id={paneId}
          className={styles.paneNav}
          aria-label={paneAriaLabel}
          onKeyDown={handlePaneKeyDown}
        >
          {(paneTitle || showToggleButton) && (
            <div className={styles.paneTop}>
              {paneTitle && (
                <span className={styles.paneTitle}>{paneTitle}</span>
              )}
              {showToggleButton && (
                <Button
                  data-nv-toggle=""
                  aria-label={toggleButtonLabel}
                  aria-expanded={open}
                  aria-controls={paneId}
                  title={toggleButtonLabel}
                  onClick={() => setPaneOpen(!open)}
                  icon={<SidebarIcon />}
                />
              )}
            </div>
          )}
          {open && paneHeader && (
            <div className={styles.paneSlot}>{renderSlot(paneHeader)}</div>
          )}
          {open && paneCustomContent && (
            <div className={styles.paneSlot}>
              {renderSlot(paneCustomContent)}
            </div>
          )}
          <div className={styles.paneBody}>{menuItems}</div>
          {footerMenuItems && (
            <div className={styles.paneFooterItems}>{footerMenuItems}</div>
          )}
          {paneFooter && (
            <div className={styles.paneSlot}>{renderSlot(paneFooter)}</div>
          )}
        </nav>

        <main ref={stageRef} className={styles.stage}>
          <PageFrame
            key={currentKey === undefined ? undefined : String(currentKey)}
            info={pageInfo}
            setting={pageTransition}
          >
            {children}
          </PageFrame>
        </main>

        {isOverlay && (
          <div
            className={styles.scrim}
            aria-hidden="true"
            onClick={closeOverlay}
          />
        )}
      </div>
    </NavContext.Provider>
  );
}

type NavItemOwnProps<E extends ElementType = "button"> = {
  value?: string | number;
  icon?: ReactNode;
  href?: string;
  as?: E;
  disabled?: boolean;
  selectsOnInvoked?: boolean;
  className?: string;
  children?: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
};

export type NavItemProps<E extends ElementType = "button"> =
  NavItemOwnProps<E> &
    Omit<ComponentPropsWithoutRef<E>, keyof NavItemOwnProps<E>>;

export type NavSubItemProps<E extends ElementType = "button"> = NavItemProps<E>;

type NavLinkBaseProps = NavItemOwnProps<ElementType> & {
  isSub?: boolean;
} & Omit<HTMLAttributes<HTMLElement>, keyof NavItemOwnProps<ElementType>>;

function NavLinkBase({
  value,
  icon,
  href,
  as,
  disabled,
  selectsOnInvoked = true,
  onClick,
  className,
  children,
  isSub,
  ...rest
}: NavLinkBaseProps) {
  const { selectedValue, select, isPaneOpen, onItemInvoked } = useNav();
  const selected = value !== undefined && value === selectedValue;

  const Tag: ElementType = as || (href ? "a" : "button");
  const tagProps: Record<string, unknown> = {};
  if (Tag === "button") {
    tagProps.type = "button";
    tagProps.disabled = disabled;
  } else {
    tagProps["aria-disabled"] = disabled ? true : undefined;
    if (href && !disabled) {
      tagProps.href = href;
    }
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
    if (!event.defaultPrevented && value !== undefined) {
      select(event, value, { selects: selectsOnInvoked });
    }
    onItemInvoked();
  };

  const tooltip =
    !isPaneOpen && !isSub && typeof children === "string"
      ? children
      : undefined;

  return (
    <Tag
      data-nv-item=""
      title={tooltip}
      className={cx(
        styles.item,
        isSub && styles.sub,
        selected && styles.selected,
        disabled && styles.disabled,
        className,
      )}
      aria-current={selected ? "page" : undefined}
      onClick={handleClick}
      {...tagProps}
      {...rest}
    >
      {icon && !isSub && <span className={styles.icon}>{icon}</span>}
      <span className={styles.content}>{children}</span>
    </Tag>
  );
}

export function NavItem<E extends ElementType = "button">(
  props: NavItemProps<E>,
) {
  return <NavLinkBase {...(props as NavLinkBaseProps)} />;
}

export function NavSubItem<E extends ElementType = "button">(
  props: NavSubItemProps<E>,
) {
  return <NavLinkBase {...(props as NavLinkBaseProps)} isSub />;
}
export interface NavCategoryProps {
  value: string | number;
  icon?: ReactNode;
  title: ReactNode;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

export function NavCategory({
  value,
  icon,
  title,
  disabled,
  className,
  children,
}: NavCategoryProps) {
  const { selectedValue, openCategories, toggleCategory, isPaneOpen, rootRef } =
    useNav();
  const groupId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const [flyout, setFlyout] = useState<{ left: number; top: number } | null>(
    null,
  );

  const compact = !isPaneOpen;
  const isOpen = openCategories.includes(value);
  const inlineOpen = isOpen && isPaneOpen;
  const flyoutOpen = compact && flyout !== null;

  const hasSelectedChild = React.Children.toArray(children).some(
    (child) =>
      React.isValidElement<{ value?: string | number }>(child) &&
      child.props.value !== undefined &&
      child.props.value === selectedValue,
  );

  useEffect(() => {
    if (isPaneOpen) setFlyout(null);
  }, [isPaneOpen]);

  useIsoLayoutEffect(() => {
    const el = flyoutRef.current;
    const root = rootRef.current;
    if (!flyoutOpen || !el || !flyout || !root) return;
    const maxTop = root.clientHeight - el.offsetHeight - 8;
    if (flyout.top > maxTop) el.style.top = `${Math.max(8, maxTop)}px`;
    el.querySelector<HTMLElement>(FOCUSABLE_ITEM)?.focus();
  }, [flyoutOpen, flyout, rootRef]);

  useEffect(() => {
    if (!flyoutOpen) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (
        flyoutRef.current?.contains(event.target as Node) ||
        buttonRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setFlyout(null);
    };
    const onResize = () => setFlyout(null);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResize);
    };
  }, [flyoutOpen]);

  const handleCategoryClick = () => {
    if (isPaneOpen) {
      toggleCategory(value);
      return;
    }
    if (flyout) {
      setFlyout(null);
      return;
    }
    if (buttonRef.current && rootRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const rootRect = rootRef.current.getBoundingClientRect();
      setFlyout({
        left: buttonRect.right - rootRect.left + 8,
        top: buttonRect.top - rootRect.top - 6,
      });
    }
  };

  const handleFlyoutKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setFlyout(null);
      buttonRef.current?.focus();
      return;
    }
    if (moveFocusInContainer(flyoutRef.current, event.key, false)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleFlyoutClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-nv-item]")) {
      setFlyout(null);
      buttonRef.current?.focus();
    }
  };

  return (
    <div className={cx(styles.category, className)}>
      <button
        ref={buttonRef}
        type="button"
        data-nv-item=""
        title={compact && typeof title === "string" ? title : undefined}
        className={cx(
          styles.item,
          hasSelectedChild && !inlineOpen && styles.selected,
          disabled && styles.disabled,
        )}
        aria-expanded={compact ? flyoutOpen : isOpen}
        aria-haspopup={compact ? "true" : undefined}
        aria-controls={compact ? undefined : groupId}
        disabled={disabled}
        onClick={handleCategoryClick}
      >
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.content}>{title}</span>
        <span className={cx(styles.chevron, inlineOpen && styles.chevronOpen)}>
          <ChevronIcon />
        </span>
      </button>

      <div
        id={groupId}
        role="group"
        data-nv-collapsed={!inlineOpen}
        className={cx(styles.group, inlineOpen && styles.groupOpen)}
      >
        <div className={styles.groupInner}>{children}</div>
      </div>

      {flyoutOpen &&
        rootRef.current &&
        createPortal(
          <FrostedGlass
            ref={flyoutRef}
            width="auto"
            height="auto"
            role="group"
            aria-label={typeof title === "string" ? title : undefined}
            data-nv-flyout=""
            className={styles.flyout}
            style={{ ...FLYOUT_STYLE, left: flyout.left, top: flyout.top }}
            onKeyDown={handleFlyoutKeyDown}
            onClick={handleFlyoutClick}
          >
            {children}
          </FrostedGlass>,
          rootRef.current,
        )}
    </div>
  );
}

export interface NavBackgroundExtensionProps extends HTMLAttributes<HTMLDivElement> {
  /** Выключить эффект, не убирая обёртку (аналог isEnabled в SwiftUI) */
  isEnabled?: boolean;
  /** Радиус размытия копии, px */
  blur?: number;
}

/**
 * Аналог SwiftUI backgroundExtensionEffect(): содержимое отражается от левого
 * края, размывается и продлевается под плавающую панель.
 *
 * Требования:
 * - NavigationView с extendContentUnderPane;
 * - обёртка начинается у левого края safe area (первый элемент страницы,
 *   без собственного левого отступа);
 * - внутри картинка или другой декоративный контент: копия рендерится второй
 *   раз, недоступна для кликов и фокуса, но id и эффекты в ней дублируются.
 *
 * Заголовки и кнопки поверх картинки кладите снаружи обёртки (через
 * position: absolute в родителе), чтобы в копию они не попадали.
 */
export function NavBackgroundExtension({
  isEnabled = true,
  blur = 20,
  className,
  style,
  children,
  ...rest
}: NavBackgroundExtensionProps) {
  const nav = useContext(NavContext);
  const active = isEnabled && !!nav?.extendsUnderPane;

  return (
    <div
      {...rest}
      className={cx(styles.extension, className)}
      style={
        {
          ...style,
          "--nav-extension-blur": `${blur}px`,
        } as CSSProperties
      }
    >
      {active && (
        <div className={styles.extensionLeading} aria-hidden="true">
          <div
            className={styles.extensionMirror}
            ref={(el) => el?.setAttribute("inert", "")}
          >
            {children}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

export function NavSectionHeader({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return <div className={cx(styles.sectionHeader, className)}>{children}</div>;
}

export function NavDivider({ className }: { className?: string }) {
  return <hr className={cx(styles.divider, className)} />;
}
