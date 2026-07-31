import type { Access, PayloadRequest } from "payload";

/** Public content: the site reads it, and so may the REST/GraphQL API. */
export const anyone: Access = () => true;

/** Everything that writes, plus the users collection itself. */
export const authenticated: Access = ({ req }) => Boolean(req.user);

/**
 * `access.admin` gates the whole admin panel, so unlike the document-level
 * controls it must resolve to a plain boolean — a `Where` constraint has
 * nothing to filter.
 */
export const authenticatedAdmin = ({ req }: { req: PayloadRequest }): boolean =>
  Boolean(req.user);
