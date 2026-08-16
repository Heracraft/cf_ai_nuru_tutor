import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Guards ids taken from the URL. Postgres throws on a malformed uuid, which
 * would surface as a 500 rather than a not-found.
 */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
