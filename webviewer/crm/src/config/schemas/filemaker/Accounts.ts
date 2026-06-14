/**
 * Put your custom overrides or transformations here.
 * Changes to this file will NOT be overwritten.
 */
import { z } from "zod/v4";
import { ZAccounts as ZAccounts_generated } from "./generated/Accounts";

export const ZAccounts = ZAccounts_generated;

export type TAccounts = z.infer<typeof ZAccounts>;
