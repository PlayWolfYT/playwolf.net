import configPromise from "@payload-config";
import { getPayload } from "payload";

/**
 * Payload runs in-process, so server components query it directly instead of
 * going back out over HTTP to our own API. `getPayload` memoizes the instance
 * and the database pool, so calling this per request is free after the first.
 */
export const getPayloadClient = () => getPayload({ config: configPromise });
