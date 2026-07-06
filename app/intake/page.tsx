"use client";

import { IntakeFlow } from "@/components/screens/IntakeFlow";

/**
 * The intake flow route. Entered via the rep roster "Add new" modal (which
 * starts a draft first) or the "Open as patient" demo affordance. With no active
 * draft the flow redirects home — there's nothing to build.
 */
export default function IntakePage() {
  return <IntakeFlow />;
}
