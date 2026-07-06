"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrder, getPatient } from "@/lib/dataProvider";
import { useMutations } from "@/lib/mutations";
import {
  Button,
  Icon,
  TopBarNav,
  SectionLabel,
  StatusPill,
  cn,
} from "@/components/ui";
import { PatientContextRow } from "./ClinicalCheck";

const LOT_POOL = ["27171JJ", "27180KM", "31200QT", "44518RA", "50921ZC"];

/**
 * S6 · Fulfillment — Tech Pack & Ship. Dose-as-assay-recipe: the tech documents
 * the actual vials/lots pulled per dose bag (data capture, NOT inventory draw).
 * Mark shipped is gated until every dose is packed AND tracking is entered.
 */
export function TechPack({ orderId }: { orderId: string }) {
  const router = useRouter();
  const order = getOrder(orderId);
  const { shipOrder, shippedOrders } = useMutations();
  const [tracking, setTracking] = useState("");

  const alreadyShipped = order ? shippedOrders[orderId] : undefined;

  const prophyRx = useMemo(() => {
    if (!order) return null;
    return getPatient(order.patientId)!.prescriptions.find(
      (rx) => rx.doseType === "PROPHYLAXIS",
    );
  }, [order]);

  // recipe parts, e.g. [2000, 500, 500]
  const recipe = useMemo(
    () =>
      (prophyRx?.assayComponents ?? []).flatMap((c) =>
        Array(c.quantity).fill(c.iu),
      ),
    [prophyRx],
  );

  const totalDoses = order
    ? order.lineItems
        .filter((li) => li.kind === "PROPHYLAXIS_DOSE" || li.kind === "PRN_REPLACEMENT")
        .reduce((s, li) => s + li.quantity, 0)
    : 0;

  const prePacked = order
    ? new Set(order.packedManifest.map((v) => v.doseIndex)).size
    : 0;

  const [packed, setPacked] = useState(prePacked);

  if (!order || !prophyRx)
    return (
      <div className="flex min-h-[100dvh] flex-col md:min-h-[844px]">
        <TopBarNav title="Pack & ship" onDismiss={() => router.back()} />
        <div className="flex flex-1 items-center justify-center text-body text-text-muted">
          Order not ready to pack.
        </div>
      </div>
    );

  const patient = getPatient(order.patientId)!;
  const allPacked = packed >= totalDoses;
  const isShipped = !!alreadyShipped;
  const canShip = allPacked && tracking.trim().length >= 6 && !isShipped;

  function lotsForDose(doseIndex: number): string[] {
    const fromManifest = order!.packedManifest
      .filter((v) => v.doseIndex === doseIndex)
      .map((v) => v.lotNumber);
    if (fromManifest.length) return fromManifest;
    return recipe.map((_, i) => LOT_POOL[(doseIndex + i) % LOT_POOL.length]);
  }

  function ship() {
    shipOrder(orderId, tracking.trim());
  }

  return (
    <div className="flex min-h-[100dvh] flex-col md:min-h-[844px] lg:mx-auto lg:min-h-[100dvh] lg:w-full lg:max-w-[680px]">
      <TopBarNav
        title="Pack & ship"
        onDismiss={() => router.back()}
        right={
          <StatusPill tone={isShipped ? "success" : "neutral"} icon={isShipped ? "ti-circle-check-filled" : "ti-package"}>
            {isShipped ? "Shipped" : "Processing"}
          </StatusPill>
        }
      />
      <PatientContextRow
        patient={patient}
        cycle={order.cycleLabel}
        onClick={() => router.push(`/patients/${patient.id}`)}
      />

      <main className="flex-1 overflow-y-auto p-4">
        {isShipped ? (
          <ShippedState tracking={alreadyShipped!.trackingNumber} onNext={() => router.push("/queue")} />
        ) : (
          <>
            {/* Progress + scan */}
            <div className="mb-2 flex items-center justify-between">
              <p className="text-body-strong text-text-primary">
                Doses packed {packed} of {totalDoses}
              </p>
              <Button
                variant="scan-inline"
                onClick={() => setPacked((n) => Math.min(totalDoses, n + 1))}
                disabled={allPacked}
              >
                Scan vial
              </Button>
            </div>
            <p className="mb-3 text-micro text-text-muted">
              Dose-as-recipe: scan each vial to document the actual lot pulled.
            </p>

            {/* Dose cards */}
            <div className="mb-4.5 flex flex-col gap-2">
              {Array.from({ length: totalDoses }).map((_, i) => {
                const idx = i + 1;
                const state = idx <= packed ? "packed" : idx === packed + 1 ? "current" : "future";
                const lots = state === "packed" ? lotsForDose(idx) : [];
                return (
                  <DoseCard
                    key={idx}
                    index={idx}
                    productName={prophyRx.productName}
                    targetIu={prophyRx.targetIu}
                    recipe={recipe}
                    lots={lots}
                    state={state}
                  />
                );
              })}
            </div>

            {/* Tracking */}
            <SectionLabel className="mb-2">Shipment</SectionLabel>
            <div className="mb-2 flex items-center gap-2.5 rounded-control border border-border bg-card px-3 py-3">
              <Icon name="ti-barcode" size={16} className="text-text-muted" />
              <input
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="Paste tracking number or URL"
                className="flex-1 bg-transparent text-body text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>
            <p className="mb-4 text-micro text-text-muted">
              A delivery ticket + digitized packing slip generate on ship.
            </p>

            {/* Actions */}
            <Button variant="primary" block icon="ti-truck" disabled={!canShip} onClick={ship}>
              Mark shipped
            </Button>
            {!canShip && (
              <p className="mt-2 text-center text-micro text-text-muted">
                {!allPacked
                  ? `Pack all ${totalDoses} doses to enable shipping.`
                  : "Enter a tracking number to enable shipping."}
              </p>
            )}
            <Button
              variant="secondary"
              block
              icon="ti-player-pause"
              className="mt-2 border-amber-light text-amber"
              onClick={() => router.push("/queue")}
            >
              Hold — partial / stock issue
            </Button>
          </>
        )}
      </main>
    </div>
  );
}

function DoseCard({
  index,
  productName,
  targetIu,
  recipe,
  lots,
  state,
}: {
  index: number;
  productName: string;
  targetIu: number;
  recipe: number[];
  lots: string[];
  state: "packed" | "current" | "future";
}) {
  return (
    <div
      className={cn(
        "rounded-card border bg-card p-3.5 transition-colors",
        state === "current" ? "border-[1.5px] border-teal" : "border-border",
        state === "future" && "opacity-60",
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-tile",
            state === "packed" ? "bg-teal text-white" : state === "current" ? "bg-teal-light text-teal-dark" : "bg-fill-control text-text-muted",
          )}
        >
          {state === "packed" ? <Icon name="ti-check" size={15} /> : index}
        </div>
        <div className="flex-1">
          <p className="text-title-card text-navy">
            Dose {index} · {targetIu.toLocaleString()} IU
          </p>
          <p className="text-micro text-text-muted">
            {productName} · {recipe.join(" + ")} recipe
          </p>
        </div>
        <span
          className={cn(
            "text-label-strong",
            state === "packed" ? "text-teal-dark" : state === "current" ? "text-teal" : "text-text-muted",
          )}
        >
          {state === "packed" ? "Bagged" : state === "current" ? "Scan to fill" : "Waiting"}
        </span>
      </div>
      <div className="ml-9 flex flex-col gap-1">
        {recipe.map((iu, i) => (
          <div key={i} className="flex items-center gap-2 text-micro">
            <Icon
              name={state === "packed" ? "ti-circle-check-filled" : "ti-circle-dashed"}
              size={13}
              className={state === "packed" ? "text-teal" : "text-text-muted"}
            />
            <span className="text-text-secondary">{iu.toLocaleString()} IU vial</span>
            {state === "packed" && lots[i] && (
              <span className="text-text-muted">· lot {lots[i]}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ShippedState({
  tracking,
  onNext,
}: {
  tracking: string;
  onNext: () => void;
}) {
  return (
    <div className="rounded-card border border-border bg-teal-light p-4 text-center">
      <Icon name="ti-truck-delivery" size={28} className="mb-1 text-teal" />
      <p className="text-title-card text-navy">Shipped</p>
      <p className="mt-0.5 text-body text-text-secondary">
        Tracking <span className="font-semibold text-navy">{tracking}</span>. The
        patient sees the tracker on their dashboard now.
      </p>
      <Button variant="primary" block icon="ti-list-check" className="mt-3" onClick={onNext}>
        Back to queue
      </Button>
    </div>
  );
}
