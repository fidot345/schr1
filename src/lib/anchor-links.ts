/*
 * Links to a part of a page (#id), BRIEF.md section 3 "Движение": the jump
 * lands on the target, below the sticky header (the scroll margin is in
 * globals.css), on the first click and on every one after it. Browser only.
 */

/** The element a #fragment names, or null without a fragment or element. */
export function fragmentTarget(hash: string): HTMLElement | null {
  if (hash.length < 2) {
    return null;
  }
  return document.getElementById(decodeURIComponent(hash.slice(1)));
}

/**
 * Whether a click on a link with a #fragment goes nowhere through the
 * router: the link leads to the address that is open, query and fragment
 * included. Next.js 16.4 then neither navigates nor scrolls; the browser
 * would jump to the fragment again. A link written as "#id" is a plain
 * anchor: the browser handles it and jumps again by itself.
 *
 * `href` is the link's attribute as written, `to` the address it leads to.
 */
export function routerSkipsJump(href: string, to: URL, open: URL): boolean {
  return !href.startsWith("#") && to.hash !== "" && to.href === open.href;
}

/** How long a jump waits for the router to show its address, in ms. */
export const JUMP_WAIT = 10_000;

/**
 * Jumps to the #fragment of `to` in the first frame in which the router
 * shows that address: at once on the address that is open, after the
 * navigation otherwise. Next.js 16.4 does not always jump by itself: on a
 * link that changes only the query it did not while the page's data was
 * not prefetched yet (a click right after the page opened), and it never
 * does on the address that is open. When it does, this lands on the same
 * place. Gives up after JUMP_WAIT; the returned function cancels it.
 */
export function jumpWhenShown(to: URL): () => void {
  let start: number | null = null;
  let id = requestAnimationFrame(function check(time) {
    start ??= time;
    if (window.location.href === to.href) {
      fragmentTarget(to.hash)?.scrollIntoView();
    } else if (time - start < JUMP_WAIT) {
      id = requestAnimationFrame(check);
    }
  });

  return () => cancelAnimationFrame(id);
}

/** A link of this site that a click opens in this tab, or null. */
function followedLink(event: MouseEvent): HTMLAnchorElement | null {
  const modified =
    event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  if (event.button !== 0 || modified) {
    return null;
  }
  const link =
    event.target instanceof Element
      ? event.target.closest<HTMLAnchorElement>("a[href]")
      : null;
  if (
    !link ||
    (link.target !== "" && link.target !== "_self") ||
    link.hasAttribute("download") ||
    new URL(link.href).origin !== window.location.origin
  ) {
    return null;
  }
  return link;
}

/**
 * Calls `onClick` for each click that follows a link of this site in this
 * tab, with the link's attribute as written and the address it leads to.
 * It listens in the capture phase, before next/link starts the navigation
 * and before the browser jumps. Returns a function that stops listening.
 */
export function watchLinkClicks(
  onClick: (href: string, to: URL) => void,
): () => void {
  const listener = (event: MouseEvent) => {
    const link = followedLink(event);
    if (link) {
      onClick(link.getAttribute("href") ?? "", new URL(link.href));
    }
  };
  document.addEventListener("click", listener, true);

  return () => document.removeEventListener("click", listener, true);
}
