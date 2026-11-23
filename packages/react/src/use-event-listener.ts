import { useEffect } from 'react';

export default function useEventListener(
  eventName: 'keypress' | 'keydown' | 'keyup',
  handler: (event: KeyboardEvent) => void,
  // TODO: don't add event listener to window otherwise this event will
  // affect multiple MathEditor instances
  element: WindowProxy = window,
): void {
  useEffect(
    () => {
      // Make sure element supports addEventListener.
      if (element == null || !('addEventListener' in element)) return;

      // Listen in the capture phase so the editor's handlers run before the
      // page's own key handlers, and can call e.stopPropagation() to keep
      // keys the editor uses (e.g. '/' for fractions) from also triggering
      // page shortcuts, such as a '/' shortcut that focuses a search box.
      const options = { capture: true };

      // Add event listener
      element.addEventListener(eventName, handler, options);

      // Remove event listener on cleanup
      return () => {
        element.removeEventListener(eventName, handler, options);
      };
    },
    [eventName, element, handler], // Re-run if eventName or element changes
  );
}
