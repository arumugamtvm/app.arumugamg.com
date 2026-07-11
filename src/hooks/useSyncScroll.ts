import { useCallback, useRef } from 'react';

/**
 * Proportionally synchronizes vertical scrolling between two independently
 * scrollable elements (e.g. a markdown editor textarea and its rendered preview).
 *
 * The returned refs are callback refs that attach native `scroll` listeners
 * directly to the elements. Attach them to the element that actually scrolls:
 * for a textarea-based editor that is the <textarea> itself (textareas scroll
 * internally), not the wrapping pane div.
 */
export function useSyncScroll() {
  const leftEl = useRef<HTMLElement | null>(null);
  const rightEl = useRef<HTMLElement | null>(null);
  const syncingLeft = useRef(false);
  const syncingRight = useRef(false);

  const handleLeftScroll = useCallback(() => {
    const source = leftEl.current;
    const target = rightEl.current;
    if (!source || !target) return;
    if (syncingLeft.current) {
      syncingLeft.current = false;
      return;
    }
    syncingRight.current = true;
    const sourceMax = source.scrollHeight - source.clientHeight || 1;
    target.scrollTop = (source.scrollTop / sourceMax) * (target.scrollHeight - target.clientHeight);
  }, []);

  const handleRightScroll = useCallback(() => {
    const source = rightEl.current;
    const target = leftEl.current;
    if (!source || !target) return;
    if (syncingRight.current) {
      syncingRight.current = false;
      return;
    }
    syncingLeft.current = true;
    const sourceMax = source.scrollHeight - source.clientHeight || 1;
    target.scrollTop = (source.scrollTop / sourceMax) * (target.scrollHeight - target.clientHeight);
  }, []);

  const leftPaneRef = useCallback((el: HTMLElement | null) => {
    if (leftEl.current) leftEl.current.removeEventListener('scroll', handleLeftScroll);
    leftEl.current = el;
    if (el) el.addEventListener('scroll', handleLeftScroll, { passive: true });
  }, [handleLeftScroll]);

  const rightPaneRef = useCallback((el: HTMLElement | null) => {
    if (rightEl.current) rightEl.current.removeEventListener('scroll', handleRightScroll);
    rightEl.current = el;
    if (el) el.addEventListener('scroll', handleRightScroll, { passive: true });
  }, [handleRightScroll]);

  return { leftPaneRef, rightPaneRef, handleLeftScroll, handleRightScroll };
}
