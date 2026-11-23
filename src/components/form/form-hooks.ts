import { useEffect, useRef, useState } from "react";
import { FILL_TIME_FIELD } from "@/lib/form-schema";

/*
 * What the client side of both forms shares. Only for client components.
 */

/**
 * Moves the focus to an element by its id after the render that shows it,
 * then forgets it: an error that appears with this render, a step heading.
 */
export function useFocusAfterRender(): (id: string) => void {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      document.getElementById(target)?.focus();
      setTarget(null);
    }
  }, [target]);

  return setTarget;
}

/**
 * The time from opening the form to sending it, for the spam protection
 * (BRIEF.md section 5 "Formen"). The returned function writes it into the
 * form's data just before sending.
 */
export function useFillTime(): (formData: FormData) => void {
  const openedAt = useRef(0);

  useEffect(() => {
    openedAt.current = performance.now();
  }, []);

  return (formData) => {
    formData.set(
      FILL_TIME_FIELD,
      String(Math.round(performance.now() - openedAt.current)),
    );
  };
}
