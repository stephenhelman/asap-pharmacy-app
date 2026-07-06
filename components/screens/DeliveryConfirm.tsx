"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOrder, getPatient } from "@/lib/dataProvider";
import { useMutations } from "@/lib/mutations";
import type { DeliveryStatus } from "@/lib/types";
import {
  Button,
  Icon,
  TopBarNav,
  SectionLabel,
  StepperVertical,
  Card,
  cn,
  type Step,
} from "@/components/ui";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/** P7 · Delivery / Confirm — own-data tracker + scan/manual receipt confirmation. */
export function DeliveryConfirm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const order = getOrder(orderId);
  const { confirmDelivery, confirmedDeliveries } = useMutations();
  const [justConfirmed, setJustConfirmed] = useState<null | "scan" | "manual">(null);

  if (!order || !order.delivery) {
    return (
      <div className="flex min-h-[100dvh] flex-col md:min-h-[844px]">
        <TopBarNav title="Delivery" onDismiss={() => router.push("/")} />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <Icon name="ti-package-off" size={32} className="text-text-muted" />
          <p className="text-title-card text-navy">No delivery found</p>
        </div>
      </div>
    );
  }

  const d = order.delivery;
  const patient = getPatient(order.patientId);
  const confirmedMethod = confirmedDeliveries[orderId] ?? justConfirmed;
  const isConfirmed = !!confirmedMethod || !!d.confirmedByPatientAt;

  const statusIdx: Record<DeliveryStatus, number> = {
    PENDING: 0,
    SHIPPED: 0,
    OUT_FOR_DELIVERY: 1,
    DELIVERED: 2,
  };
  const idx = isConfirmed ? 2 : statusIdx[d.status];

  const steps: Step[] = [
    { label: "Shipped", state: idx > 0 ? "done" : "current", sub: d.shippedAt ? fmt(d.shippedAt) : undefined },
    { label: "Out for delivery", state: idx > 1 ? "done" : idx === 1 ? "current" : "future" },
    {
      label: "Delivered",
      state: isConfirmed ? "done" : idx === 2 ? "current" : "future",
      sub: isConfirmed ? "Confirmed by you" : undefined,
    },
  ];

  const bigStatus = isConfirmed
    ? { icon: "ti-circle-check-filled", tone: "teal", title: "Delivery confirmed", sub: "Your cycle timer has reset." }
    : d.status === "OUT_FOR_DELIVERY"
      ? { icon: "ti-truck-delivery", tone: "amber", title: "Out for delivery", sub: "Arriving today" }
      : d.status === "DELIVERED"
        ? { icon: "ti-package", tone: "teal", title: "Delivered", sub: "Confirm you received it" }
        : { icon: "ti-package", tone: "neutral", title: "Shipped", sub: d.carrier ?? "In transit" };

  const canConfirm =
    !isConfirmed && (d.status === "OUT_FOR_DELIVERY" || d.status === "DELIVERED");

  function confirm(method: "scan" | "manual") {
    confirmDelivery(orderId, method);
    setJustConfirmed(method);
  }

  const toneBg = {
    teal: "bg-teal-light text-teal-dark",
    amber: "bg-amber-light text-amber",
    neutral: "bg-fill-control text-text-secondary",
  }[bigStatus.tone];

  return (
    <div className="flex min-h-[100dvh] flex-col md:min-h-[844px]">
      <TopBarNav
        title={order.cycleLabel + " delivery"}
        onDismiss={() => router.push("/")}
      />
      <main className="flex-1 overflow-y-auto p-4">
        {/* Big status */}
        <div className="mb-4.5 flex flex-col items-center text-center">
          <div className={cn("mb-2.5 flex h-14 w-14 items-center justify-center rounded-full", toneBg)}>
            <Icon name={bigStatus.icon} size={28} />
          </div>
          <p className="text-h2 text-navy">{bigStatus.title}</p>
          <p className="text-body text-text-secondary">{bigStatus.sub}</p>
        </div>

        {/* Stepper card */}
        <Card padding="16" className="mb-4.5">
          <StepperVertical steps={steps} />
          {d.trackingUrl && (
            <a
              href={d.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex h-[42px] items-center justify-center gap-2 rounded-control border border-border-strong bg-card text-title-card text-text-primary active:bg-fill-control"
            >
              <Icon name="ti-external-link" size={16} className="text-teal" />
              Track live · {d.carrier}
            </a>
          )}
        </Card>

        {/* Confirm receipt */}
        {isConfirmed ? (
          <div className="rounded-card border border-border bg-teal-light p-4 text-center">
            <Icon name="ti-circle-check-filled" size={24} className="mb-1 text-teal" />
            <p className="text-title-card text-navy">
              Received — confirmed by {confirmedMethod === "scan" ? "scan" : "you"}
            </p>
            <p className="mt-0.5 text-body text-teal-dark">
              Thanks for confirming. Your next order cycle starts now.
            </p>
            <Button variant="primary" block icon="ti-home" className="mt-3" onClick={() => router.push("/")}>
              Back to dashboard
            </Button>
          </div>
        ) : canConfirm ? (
          <>
            <SectionLabel className="mb-2">Confirm receipt</SectionLabel>
            <Card padding="14">
              <p className="mb-3 text-body text-text-secondary">
                When your package arrives, confirm it so we know it's in your hands
                — and your cycle timer resets.
              </p>
              <Button variant="primary" block icon="ti-scan" className="mb-2" onClick={() => confirm("scan")}>
                Scan delivery ticket
              </Button>
              <Button variant="secondary" block icon="ti-checkbox" onClick={() => confirm("manual")}>
                I received it — confirm manually
              </Button>
            </Card>
            <p className="mt-3 text-center text-micro text-text-muted">
              Scanning auto-checks every item against what was shipped.
            </p>
          </>
        ) : (
          <p className="text-center text-micro text-text-muted">
            You'll be able to confirm receipt once it's out for delivery.
          </p>
        )}
      </main>
    </div>
  );
}
