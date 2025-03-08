import { nanoid } from "nanoid";

/**
 * Create a block id
 *
 * @returns {string}
 */
export function generateBlockId(prefix?: string): string {
  const idLen = 12;
  const id = nanoid(idLen);
  return prefix ? `${prefix}_${id}` : id;
}
