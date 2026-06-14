/**
 * Put your custom overrides or transformations here.
 * Changes to this file will NOT be overwritten.
 */
import { z } from "zod/v4";
import { ZProjects as ZProjects_generated } from "./generated/Projects";

export const ZProjects = ZProjects_generated;

export type TProjects = z.infer<typeof ZProjects>;
