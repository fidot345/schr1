import type {
  ArrayFieldValidation,
  DateFieldValidation,
  RelationshipFieldValidation,
  TextFieldSingleValidation,
} from "payload";
import { array, relationship, text } from "payload/shared";

export const sibling = (data: unknown, key: string): unknown =>
  typeof data === "object" && data !== null
    ? (data as Record<string, unknown>)[key]
    : undefined;

/** The admin form counts array rows as a number, the server sees the rows. */
export const countRows = (value: unknown): number => {
  if (Array.isArray(value)) {
    return value.length;
  }
  return typeof value === "number" ? value : 0;
};

export const exactRows =
  (count: number, message: string): ArrayFieldValidation =>
  (value, options) =>
    countRows(value) === count ? array(value, options) : message;

const relationId = (item: unknown): unknown =>
  typeof item === "object" && item !== null && "id" in item ? item.id : item;

export const exactRelations =
  (count: number, message: string): RelationshipFieldValidation =>
  (value, options) => {
    const items = Array.isArray(value) ? value : [];
    if (items.length !== count) {
      return message;
    }
    if (new Set(items.map(relationId)).size !== items.length) {
      return "Jeder Eintrag darf nur einmal vorkommen.";
    }
    return relationship(value, options);
  };

/**
 * Required in the admin form, while the column stays nullable; then the
 * usual text checks (maxLength).
 */
export const validateLogoWord: TextFieldSingleValidation = (value, options) =>
  typeof value === "string" && value.trim() !== ""
    ? text(value, options)
    : "Bitte das Wort für das Logo eintragen.";

export const validatePostalCode: TextFieldSingleValidation = (value) =>
  (typeof value === "string" && /^\d{5}$/.test(value)) ||
  "Bitte eine fünfstellige Postleitzahl eintragen.";

const vacationOn = (siblingData: unknown): boolean =>
  sibling(siblingData, "enabled") === true;

const missingDate = "Bitte ein Datum eintragen, solange der Urlaub aktiv ist.";

export const validateVacationFrom: DateFieldValidation = (
  value,
  { siblingData },
) => !vacationOn(siblingData) || Boolean(value) || missingDate;

export const validateVacationUntil: DateFieldValidation = (
  value,
  { siblingData },
) => {
  if (!vacationOn(siblingData)) {
    return true;
  }
  if (!value) {
    return missingDate;
  }
  const from = sibling(siblingData, "from");
  if (!from) {
    return true;
  }
  return (
    new Date(value) >= new Date(String(from)) ||
    "Darf nicht vor dem ersten Urlaubstag liegen."
  );
};
