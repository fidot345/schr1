import { cn } from "@/lib/cn";

/*
 * The round number of a step. The only round element of the design.
 * Hidden from assistive technology: the numbered list around it
 * (<ol>) already counts the steps.
 *
 * default: Tannengrün frame, "So läuft Ihr Auftrag" and "Was passiert danach?"
 * active:  filled Tannengrün, the current step of the 3D section
 * muted:   thin Linie frame and Schiefer, the other steps of the 3D section
 */
export type StepNumberState = "default" | "active" | "muted";
export type StepNumberSize = 32 | 44;

const SIZE: Record<StepNumberSize, string> = {
  32: "size-8 text-xs font-bold",
  44: "size-11 font-display text-h4 font-bold",
};

const STATE: Record<StepNumberState, string> = {
  default: "border-2 border-tannengruen text-tannengruen",
  active: "bg-tannengruen text-weiss",
  muted: "border-[1.5px] border-linie text-schiefer",
};

type StepNumberProps = {
  value: number | string;
  size?: StepNumberSize;
  state?: StepNumberState;
  className?: string;
};

export function StepNumber({
  value,
  size = 32,
  state = "default",
  className,
}: StepNumberProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex flex-none items-center justify-center rounded-full",
        SIZE[size],
        STATE[state],
        className,
      )}
    >
      {value}
    </span>
  );
}
