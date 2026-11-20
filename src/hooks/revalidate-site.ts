import { revalidatePath } from "next/cache";
import type { CollectionConfig, PayloadRequest, RequestContext } from "payload";

type RevalidateArgs<T> = {
  context: RequestContext;
  doc: T;
  req: PayloadRequest;
};

/**
 * Refreshes the whole site after a save or delete in the admin panel.
 * Skipped when `context.disableRevalidate` is set (seed runs outside Next.js).
 * A failed refresh is logged and never blocks the save.
 */
export const revalidateSite = <T>({
  context,
  doc,
  req,
}: RevalidateArgs<T>): T => {
  if (context.disableRevalidate) {
    return doc;
  }
  try {
    revalidatePath("/", "layout");
  } catch (error) {
    req.payload.logger.error({
      err: error,
      msg: "Site revalidation failed after a save in the admin panel",
    });
  }
  return doc;
};

export const revalidateSiteHooks: NonNullable<CollectionConfig["hooks"]> = {
  afterChange: [revalidateSite],
  afterDelete: [revalidateSite],
};
