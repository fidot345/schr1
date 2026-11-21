import { cn } from "@/lib/cn";

export type RadioOption = {
  value: string;
  label: string;
};

type RadioCardsProps = {
  /** The name of the radio group in the submitted form. */
  name: string;
  /** The question, in h3 size. It names the group for a screen reader. */
  legend: string;
  options: readonly RadioOption[];
  /** The value that is chosen at first. */
  defaultValue?: string;
  required?: boolean;
  className?: string;
};

/**
 * A choice of one among a few, as cards in a grid, mockup 03. Real radio
 * buttons inside a fieldset: the keyboard and screen readers work as usual.
 * The chosen card has a 2px Tannengrün frame on Moos and bold text; the
 * padding is one pixel less so the card does not grow.
 */
export function RadioCards({
  name,
  legend,
  options,
  defaultValue,
  required,
  className,
}: RadioCardsProps) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="font-display text-h3">{legend}</legend>
      <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
        {options.map(({ value, label }) => (
          <label
            key={value}
            className="flex min-h-15 cursor-pointer items-center gap-3 rounded border border-feldrand bg-weiss px-4.5 text-ui hover:border-tannengruen-dunkel has-checked:border-2 has-checked:border-tannengruen has-checked:bg-moos has-checked:px-4.25 has-checked:font-bold"
          >
            <input
              type="radio"
              name={name}
              value={value}
              defaultChecked={value === defaultValue}
              required={required}
              className="size-5 shrink-0 accent-tannengruen"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
