/**
 * Joins class names and skips empty values.
 * It does not resolve conflicts: a class passed in `className` is added,
 * it does not replace a component's own class of the same kind.
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
