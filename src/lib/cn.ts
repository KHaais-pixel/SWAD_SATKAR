/** Joins class names, dropping falsy ones. */
export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");
