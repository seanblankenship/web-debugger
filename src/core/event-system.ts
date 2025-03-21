import { EventSystem } from './types';

/**
 * Implementation of the Event System
 */
export class EventSystemImpl implements EventSystem {
    private eventListeners: Record<string, Array<(...args: any[]) => void>> = {};

    /**
     * Register an event listener
     */
    public on(event: string, callback: (...args: any[]) => void): void {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    /**
     * Remove an event listener
     */
    public off(event: string, callback: (...args: any[]) => void): void {
        if (!this.eventListeners[event]) {
            return;
        }
        this.eventListeners[event] = this.eventListeners[event].filter(
            listener => listener !== callback
        );
    }

    /**
     * Emit an event
     */
    public emit(event: string, ...args: any[]): void {
        if (!this.eventListeners[event]) {
            return;
        }
        this.eventListeners[event].forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });
    }

    /**
     * Observe DOM changes and emit events
     * @returns The MutationObserver instance
     */
    public observeDOMChanges(selector: string, callback: (elements: Element[]) => void): MutationObserver {
        // Create a MutationObserver to watch for DOM changes
        const observer = new MutationObserver((mutations) => {
            // Check if any new elements match our selector
            const matchingElements = document.querySelectorAll(selector);
            if (matchingElements.length > 0) {
                callback(Array.from(matchingElements));
            }
        });

        // Start observing with a configuration to watch for changes to the DOM
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'id']
        });

        // Check immediately in case elements already exist
        const existingElements = document.querySelectorAll(selector);
        if (existingElements.length > 0) {
            callback(Array.from(existingElements));
        }

        // Return the observer so it can be disconnected if needed
        return observer;
    }
} 