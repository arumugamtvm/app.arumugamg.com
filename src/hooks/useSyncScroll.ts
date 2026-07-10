import { useRef } from 'react';
import type { UIEvent } from 'react';

export function useSyncScroll() {
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const isSyncingLeft = useRef(false);
  const isSyncingRight = useRef(false);

  const handleLeftScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!rightPaneRef.current) return;
    if (isSyncingLeft.current) {
      isSyncingLeft.current = false;
      return;
    }
    isSyncingRight.current = true;
    const source = e.currentTarget;
    const target = rightPaneRef.current;
    const percentage = source.scrollTop / (source.scrollHeight - source.clientHeight || 1);
    target.scrollTop = percentage * (target.scrollHeight - target.clientHeight);
  };

  const handleRightScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!leftPaneRef.current) return;
    if (isSyncingRight.current) {
      isSyncingRight.current = false;
      return;
    }
    isSyncingLeft.current = true;
    const source = e.currentTarget;
    const target = leftPaneRef.current;
    const percentage = source.scrollTop / (source.scrollHeight - source.clientHeight || 1);
    target.scrollTop = percentage * (target.scrollHeight - target.clientHeight);
  };

  return { leftPaneRef, rightPaneRef, handleLeftScroll, handleRightScroll };
}
