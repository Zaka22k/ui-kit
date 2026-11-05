"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Button from "../Button";
import { Toolbar } from "./Toolbar";
import type { ToolbarProps } from "./Toolbar";
import { usePageTransition } from "../NavigationView/pageTransitions";
import type { PageTransitionSetting } from "../NavigationView/pageTransitions";
import { NavBackgroundExtension } from "../NavigationView/NavigationView";
import { PageStickyContext } from "./PageStickyContext";
import type { PageStickyContextValue } from "./PageStickyContext";
import styles from "./Page.module.css";

export interface PageProps {
  title: ReactNode;
  children?: ReactNode;
  hero?: ReactNode;
  onBack?: () => void;
  toolbar?: Pick<ToolbarProps, "leading" | "center" | "trailing">;
  transition?: PageTransitionSetting;
}

function findScrollParent(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}

const ChevronLeftIcon = () => {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
};

const Page = ({
  title,
  children,
  hero,
  onBack,
  toolbar,
  transition,
}: PageProps) => {
  usePageTransition(transition);

  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const hasHero = Boolean(hero);

  const stuckRef = useRef(new Map<string, number>());
  const sticky = useMemo<PageStickyContextValue>(() => {
    const updateCssVar = () => {
      const stuck = stuckRef.current;
      const max = stuck.size > 0 ? Math.max(0, ...stuck.values()) : 0;
      pageRef.current?.style.setProperty("--page-stuck-extra", `${max}px`);
    };

    return {
      setStuckExtra: (key, height) => {
        const stuck = stuckRef.current;
        if (Number.isFinite(height) && height > 0) {
          stuck.set(key, height);
        } else {
          stuck.delete(key);
        }
        updateCssVar();

        return () => {
          if (stuck.delete(key)) {
            updateCssVar();
          }
        };
      },
    };
  }, []);

  const [heroUnderHeader, setHeroUnderHeader] = useState(hasHero);
  useEffect(() => {
    const el = heroRef.current;
    const header = headerRef.current;
    if (
      !hasHero ||
      !el ||
      !header ||
      typeof IntersectionObserver === "undefined"
    ) {
      setHeroUnderHeader(false);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setHeroUnderHeader(entry.isIntersecting),
      {
        root: findScrollParent(el),
        rootMargin: `-${header.offsetHeight}px 0px 0px 0px`,
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasHero]);

  const leading = (Boolean(onBack) || Boolean(toolbar?.leading)) && (
    <>
      {onBack && (
        <Button
          onClick={onBack}
          aria-label="Назад"
          icon={<ChevronLeftIcon />}
        />
      )}
      {toolbar?.leading}
    </>
  );

  return (
    <PageStickyContext.Provider value={sticky}>
      <div ref={pageRef} className={styles.page}>
        <div
          ref={headerRef}
          className={[
            styles.pageHeader,
            hasHero && heroUnderHeader && styles.pageHeaderOverHero,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Toolbar
            leading={leading || undefined}
            title={<div className="SubtitleTextBlockStyle">{title}</div>}
            center={toolbar?.center}
            trailing={toolbar?.trailing}
          />
        </div>
        {hasHero && (
          <div ref={heroRef} className={styles.hero}>
            <NavBackgroundExtension>{hero}</NavBackgroundExtension>
          </div>
        )}
        <div
          className={[styles.pageBody, hasHero && styles.pageBodyAfterHero]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </div>
      </div>
    </PageStickyContext.Provider>
  );
};

export default Page;
