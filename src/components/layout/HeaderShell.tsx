"use client";

/*
 * Client component because only the browser knows the scroll position.
 * The header's content stays a server component and comes in as children.
 */

import { type ReactNode, useEffect, useRef, useState } from "react";

type HeaderShellProps = {
  children: ReactNode;
};

/**
 * The sticky <header>. Once the page scrolls past the header's place, it gets
 * data-compact, and the bar inside shrinks through group-data-compact:.
 *
 * A 1px sentinel right before the header marks that place. It does not move
 * when the header shrinks, so the state cannot flip back and forth.
 *
 * Sticky works only inside the parent, so the header must be a direct child
 * of <body>: the vacation banner goes before it as a sibling, not in a
 * wrapper together with it.
 */
export function HeaderShell({ children }: HeaderShellProps) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const element = sentinel.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setCompact(!entry.isIntersecting);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="-mb-px h-px" />
      <header
        data-compact={compact ? "" : undefined}
        className="group sticky top-0 z-40 border-b border-linie bg-papier"
      >
        {children}
      </header>
    </>
  );
}
