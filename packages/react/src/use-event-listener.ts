import {useEffect} from "react";

export default function useEventListener(
    eventName: "keypress" | "keydown" | "keyup",
    handler: (event: KeyboardEvent) => void,
    // TODO: don't add event listener to window otherwise this event will
    // affect multiple MathEditor instances
    element: WindowProxy = window,
): void {
    useEffect(
        () => {
            // Make sure element supports addEventListener
            // On the element
            const isSupported = element?.addEventListener;
            if (!isSupported) return;

            // This allows us to call e.stopPropagation() before StoryBook
            // steals the focus when '/' is pressed.
            const options = {capture: true};

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
