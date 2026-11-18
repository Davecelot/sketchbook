import type { Page } from '@playwright/test';

const countHostEvents = (page: Page, tagName: string, type: 'change' | 'input') =>
  page.evaluateHandle(
    ([tag, eventType]) => {
      const counter = { count: 0 };
      document.addEventListener(eventType, (event) => {
        if ((event.target as Element).localName === tag && event.composed && event.bubbles) counter.count++;
      });
      return counter;
    },
    [tagName, type] as const,
  );

export const countHostChanges = (page: Page, tagName: string) => countHostEvents(page, tagName, 'change');

export const countHostInputs = (page: Page, tagName: string) => countHostEvents(page, tagName, 'input');

export const recordHostChangeTargets = (page: Page, tagName: string, attribute: string) =>
  page.evaluateHandle(
    ([tag, attr]) => {
      const targets: (string | null)[] = [];
      document.addEventListener('change', (event) => {
        const target = event.target as Element;
        if (target.localName === tag && event.composed && event.bubbles) targets.push(target.getAttribute(attr));
      });
      return targets;
    },
    [tagName, attribute] as const,
  );

interface RecordedEvent {
  bubbles: boolean;
  composed: boolean;
  cancelable: boolean;
  target: string;
}

export const recordHostEvents = (page: Page, type: string) =>
  page.evaluateHandle((eventType) => {
    const events: RecordedEvent[] = [];
    document.addEventListener(eventType, (event) =>
      events.push({
        bubbles: event.bubbles,
        composed: event.composed,
        cancelable: event.cancelable,
        target: (event.target as Element).localName,
      }),
    );
    return events;
  }, type);
