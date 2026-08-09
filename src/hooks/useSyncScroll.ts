import { useCallback, useRef } from "react";

/**
 * Proportionally synchronizes vertical scrolling between two independently
 * scrollable elements (e.g. a markdown editor textarea and its rendered preview).
 *
 * Attach the returned refs to the elements that actually scroll:
 * - left: the <textarea> (textareas scroll internally when given a fixed height)
 * - right: the preview pane container
 */
export function useSyncScroll() {
  const leftEl = useRef<HTMLElement | null>(null);
  const rightEl = useRef<HTMLElement | null>(null);
  const isSyncing = useRef(false);
  const rafId = useRef<number | null>(null);

  const syncFrom = useCallback((source: HTMLElement, target: HTMLElement) => {
    if (isSyncing.current) return;

    const sourceMax = source.scrollHeight - source.clientHeight;
    const targetMax = target.scrollHeight - target.clientHeight;

    isSyncing.current = true;

    if (sourceMax <= 0 || targetMax <= 0) {
      target.scrollTop = sourceMax <= 0 ? 0 : target.scrollTop;
    } else {
      const ratio = source.scrollTop / sourceMax;
      target.scrollTop = ratio * targetMax;
    }

    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
    }
    rafId.current = requestAnimationFrame(() => {
      isSyncing.current = false;
      rafId.current = null;
    });
  }, []);

  const handleLeftScroll = useCallback(() => {
    const source = leftEl.current;
    const target = rightEl.current;
    if (!source || !target) return;
    syncFrom(source, target);
  }, [syncFrom]);

  const handleRightScroll = useCallback(() => {
    const source = rightEl.current;
    const target = leftEl.current;
    if (!source || !target) return;
    syncFrom(source, target);
  }, [syncFrom]);

  const leftPaneRef = useCallback(
    (el: HTMLElement | null) => {
      if (leftEl.current) {
        leftEl.current.removeEventListener("scroll", handleLeftScroll);
      }
      leftEl.current = el;
      if (el) {
        el.addEventListener("scroll", handleLeftScroll, { passive: true });
      }
    },
    [handleLeftScroll],
  );

  const rightPaneRef = useCallback(
    (el: HTMLElement | null) => {
      if (rightEl.current) {
        rightEl.current.removeEventListener("scroll", handleRightScroll);
      }
      rightEl.current = el;
      if (el) {
        el.addEventListener("scroll", handleRightScroll, { passive: true });
      }
    },
    [handleRightScroll],
  );

  return { leftPaneRef, rightPaneRef };
}
