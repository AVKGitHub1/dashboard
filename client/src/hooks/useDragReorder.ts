import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useIsTouch } from './useMediaQuery';

// How long a finger has to rest on a tile before the press counts as a drag rather than
// the start of a scroll, and how far it may stray in the meantime.
const LONG_PRESS_MS = 320;
const SLOP_PX = 8;
const DROP_TARGET_CLASS = 'reorder-drop-target';

/**
 * Generic drag-to-reorder for a list of tiles. Call `getHandlers(index)` and spread the
 * result onto each tile's root element; `onReorder` fires with the full reordered array
 * once a drop lands on a different tile than the one that started the drag.
 *
 * Two input paths, picked per device:
 *  - Pointer devices keep the native HTML5 drag-and-drop API (no extra dependency).
 *  - Touch devices get a long-press drag instead, because HTML5 drag-and-drop is simply
 *    never initiated by touch on iOS, and Android only fires it via its own long-press
 *    gesture — which would race this one. The delay is what separates "drag this tile"
 *    from "scroll the list", so the tile itself stays scrollable and tappable.
 */
export function useDragReorder<T>(items: T[], onReorder: (next: T[]) => void) {
  const isTouch = useIsTouch();
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Scoping key so a tile from a *different* widget instance on the page can never be
  // picked up as this list's drop target. useId's own colons aren't valid unquoted in
  // an attribute selector, so they're stripped.
  const group = useId().replace(/:/g, '');

  // The touch listeners live on `document` for the duration of a gesture, so they read
  // the live list/callback through refs rather than closing over a stale render.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const commit = useCallback((from: number, to: number) => {
    if (from === to) return;
    const next = [...itemsRef.current];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorderRef.current(next);
  }, []);

  // --- touch path -----------------------------------------------------------------

  const touch = useRef<{
    index: number;
    x: number;
    y: number;
    timer: ReturnType<typeof setTimeout> | null;
    active: boolean;
    over: number | null;
    overEl: HTMLElement | null;
    cleanup: (() => void) | null;
  } | null>(null);

  const endTouchGesture = useCallback(() => {
    const state = touch.current;
    if (!state) return;
    if (state.timer) clearTimeout(state.timer);
    state.overEl?.classList.remove(DROP_TARGET_CLASS);
    state.cleanup?.();
    touch.current = null;
    setDragIndex(null);
  }, []);

  // Any unmount mid-gesture (widget removed, layout swapped) must not leave the
  // document-level listeners behind.
  useEffect(() => endTouchGesture, [endTouchGesture]);

  const onTouchStart = useCallback(
    (index: number) => (e: React.TouchEvent) => {
      if (e.touches.length !== 1 || touch.current) return;
      const { clientX, clientY } = e.touches[0];

      const onMove = (ev: TouchEvent) => {
        const state = touch.current;
        if (!state || ev.touches.length !== 1) return;
        const { clientX: x, clientY: y } = ev.touches[0];

        if (!state.active) {
          // Moved before the press matured: this is a scroll, not a drag.
          if (Math.hypot(x - state.x, y - state.y) > SLOP_PX) endTouchGesture();
          return;
        }

        // Non-passive listener (see below) so this actually pins the page in place
        // while the tile is being dragged.
        ev.preventDefault();
        const el = document
          .elementFromPoint(x, y)
          ?.closest(`[data-reorder-group="${group}"]`) as HTMLElement | null;
        const over = el ? Number(el.dataset.reorderIndex) : null;
        state.over = Number.isInteger(over) ? over : null;

        // Outlining the tile the finger is currently over is the only feedback a touch
        // drag gets — there's no cursor, and the dragged tile is under the finger. The
        // class is toggled straight on the node rather than through React state so a
        // background refetch mid-drag can't re-render the list out from under it; a
        // re-render that does clobber it repaints on the next move, and the gesture's
        // own teardown clears it either way.
        if (el !== state.overEl) {
          state.overEl?.classList.remove(DROP_TARGET_CLASS);
          el?.classList.add(DROP_TARGET_CLASS);
          state.overEl = el;
        }
      };

      const onEnd = () => {
        const state = touch.current;
        if (state?.active) {
          if (state.over !== null) commit(state.index, state.over);
          // A tile can be a link or a button (see the Links widget); the tap that ended
          // the drag must not also follow it. Browsers don't reliably fire that click at
          // all, so the guard is time-boxed rather than left waiting for one.
          const swallow = (ev: MouseEvent) => {
            ev.preventDefault();
            ev.stopPropagation();
          };
          document.addEventListener('click', swallow, { capture: true, once: true });
          setTimeout(() => document.removeEventListener('click', swallow, { capture: true }), 400);
        }
        endTouchGesture();
      };

      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
      document.addEventListener('touchcancel', endTouchGesture);

      touch.current = {
        index,
        x: clientX,
        y: clientY,
        active: false,
        over: null,
        overEl: null,
        cleanup: () => {
          document.removeEventListener('touchmove', onMove);
          document.removeEventListener('touchend', onEnd);
          document.removeEventListener('touchcancel', endTouchGesture);
        },
        timer: setTimeout(() => {
          const state = touch.current;
          if (!state) return;
          state.active = true;
          state.over = index;
          navigator.vibrate?.(10);
          setDragIndex(index);
        }, LONG_PRESS_MS),
      };
    },
    [commit, endTouchGesture, group]
  );

  // --- handlers -------------------------------------------------------------------

  const getHandlers = (index: number) => {
    const shared = { 'data-reorder-group': group, 'data-reorder-index': index };

    if (isTouch) {
      return {
        ...shared,
        // draggable stays off here so Android's own long-press drag gesture doesn't
        // fire alongside ours.
        draggable: false,
        // A tile can be a link (the Links widget) or contain text, and iOS answers a
        // long press on either with its own callout/selection UI — which would hijack
        // the very gesture that starts a reorder.
        style: {
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        } as React.CSSProperties,
        onTouchStart: onTouchStart(index),
      };
    }

    return {
      ...shared,
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        setDragIndex(index);
      },
      onDragOver: (e: React.DragEvent) => e.preventDefault(),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === index) return;
        commit(dragIndex, index);
        setDragIndex(null);
      },
      onDragEnd: () => setDragIndex(null),
    };
  };

  return { getHandlers, isDragging: (index: number) => dragIndex === index };
}
