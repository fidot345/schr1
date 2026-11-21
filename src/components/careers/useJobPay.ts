import { useFormatter, useTranslations } from "next-intl";
import { type JobPay, payShape } from "@/lib/job-pay";

/**
 * Writes the pay of a job in the page's language: "19–23 € pro Stunde",
 * "€19–23 per hour", or the text the owner wrote. Whole amounts have no
 * decimals, "19,50" has two. Null when the job has no pay to show.
 */
export function useJobPay(): (pay: JobPay) => string | null {
  const t = useTranslations("JobPay");
  const format = useFormatter();
  const amount = (value: number): string =>
    format.number(value, {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    });

  return (pay) => {
    const shape = payShape(pay);
    if (!shape) {
      return null;
    }
    if (shape.kind === "text") {
      return shape.text;
    }

    const unit = t(`unit.${shape.unit}`);
    switch (shape.kind) {
      case "fixed":
        return t("fixed", { amount: amount(shape.amount), unit });
      case "range":
        return t("range", {
          min: amount(shape.min),
          max: amount(shape.max),
          unit,
        });
      case "from":
        return t("from", { min: amount(shape.min), unit });
      case "upTo":
        return t("upTo", { max: amount(shape.max), unit });
    }
  };
}
