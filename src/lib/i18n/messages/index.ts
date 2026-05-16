import { de, type Messages } from "./de";
import { en } from "./en";
import type { Locale } from "../types";

export const messages: Record<Locale, Messages> = { de, en: en as Messages };
