/**
 * tel: link for a German phone number as people write it,
 * for example "089 99998 412" → "tel:+498999998412".
 * "+49 (0)89 …" and "0049 89 …" work too.
 */
export function telHref(phone: string): `tel:${string}` {
  const digits = phone.replace(/\(0\)/g, "").replace(/[^\d+]/g, "");

  if (digits.startsWith("+")) return `tel:${digits}`;
  if (digits.startsWith("00")) return `tel:+${digits.slice(2)}`;
  if (digits.startsWith("0")) return `tel:+49${digits.slice(1)}`;
  return `tel:${digits}`;
}
