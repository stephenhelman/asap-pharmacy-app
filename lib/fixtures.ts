/**
 * Fixtures loader — the ONLY module that touches dummy-data.json.
 *
 * Everything above this reads through the dataProvider. Swapping to live Prisma
 * means replacing dataProvider's internals; this file simply goes away.
 */
import raw from "@/docs/dummy-data.json";
import type { FixturesDB } from "./types";

// The JSON is authored to conform to the Prisma-derived FixturesDB shape.
export const db = raw as unknown as FixturesDB;

/** The story's "today" — from the fixtures _meta.anchorToday. */
export const ANCHOR_TODAY = "2026-07-12T00:00:00Z";
