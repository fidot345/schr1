import type { Access } from "payload";

export const anyone: Access = () => true;

export const authenticated: Access = ({ req }) => Boolean(req.user);

export const publicRead = {
  read: anyone,
  create: authenticated,
  update: authenticated,
  delete: authenticated,
};
