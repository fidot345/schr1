/**
 * tel: link for a German phone number as people write it,
 * for example "089 99998 412" → "tel:+498999998412".
 * "+49 (0)89 …" and "0049 89 …" work too. null when there is no number:
 * the field in SiteSettings is empty, so the page leaves the link out.
 */
export function telHref(
  phone: string | null | undefined,
): `tel:${string}` | null {
  const digits = (phone ?? "").replace(/\(0\)/g, "").replace(/[^\d+]/g, "");

  if (!/\d/.test(digits)) return null;
  if (digits.startsWith("+")) return `tel:${digits}`;
  if (digits.startsWith("00")) return `tel:+${digits.slice(2)}`;
  if (digits.startsWith("0")) return `tel:+49${digits.slice(1)}`;
  return `tel:${digits}`;
}
