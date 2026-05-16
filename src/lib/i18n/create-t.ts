import type { Messages } from "./messages/de";

export type TranslateFn = (key: string) => string;

export function createT(messages: Messages): TranslateFn {
  return (key: string) => {
    const parts = key.split(".");
    let current: unknown = messages;
    for (const part of parts) {
      if (current === null || typeof current !== "object") {
        return key;
      }
      current = (current as Record<string, unknown>)[part];
    }
    return typeof current === "string" ? current : key;
  };
}
