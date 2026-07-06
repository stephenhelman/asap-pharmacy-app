/**
 * Schema-shaped types for the prototype.
 *
 * Every "Row" type is derived from a Prisma-generated model type, so field names
 * and enums are compiler-verified against `prisma/schema.prisma` (the contract).
 * The only transform is DateTime → ISO string, because the fixtures are JSON.
 * When the data source swaps to live Prisma, the dataProvider returns the same
 * nested shapes (Prisma `include`) and these types still describe them.
 */
import type {
  User,
  UserRole,
  Patient,
  CareTeamAssignment,
  AuthorizedUser,
  Prescription,
  AssayComponent,
  Onboarding,
  Gate,
  GateEvent,
  Authorization,
  Order,
  OrderLineItem,
  PackedVial,
  OrderSignature,
  ClinicalCheck,
  Delivery,
  InfusionEntry,
  Bleed,
  SupplyItem,
  Thread,
  Message,
  InternalNote,
  NoteTag,
  NoteAcknowledgement,
  Notification,
  AuditEvent,
} from "@prisma/client";

// Re-export the enums as string-literal unions for use across the UI.
export type {
  StaffRole,
  LifecycleStage,
  HemophiliaType,
  Severity,
  DoseType,
  PrnTier,
  GateType,
  GateStatus,
  AuthorizationType,
  AuthorizationStatus,
  OrderStage,
  OrderStatus,
  HoldReason,
  LineItemKind,
  DeliveryStatus,
  BleedCause,
  MessageSender,
  MessageKind,
  NotificationFlavor,
  NotificationType,
  NotificationChannel,
} from "@prisma/client";

/** Convert every DateTime field (Prisma `Date`) to the ISO string the JSON holds. */
type DateToString<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Date | null
      ? string | null
      : T[K];
};

// ── Flat rows (one per model) ──────────────────────────────────────────────
export type UserRow = DateToString<User>;
export type UserRoleRow = DateToString<UserRole>;
export type PatientRow = DateToString<Patient>;
export type CareTeamRow = DateToString<CareTeamAssignment>;
export type AuthorizedUserRow = DateToString<AuthorizedUser>;
export type PrescriptionRow = DateToString<Prescription>;
export type AssayComponentRow = DateToString<AssayComponent>;
export type OnboardingRow = DateToString<Onboarding>;
export type GateRow = DateToString<Gate>;
export type GateEventRow = DateToString<GateEvent>;
export type AuthorizationRow = DateToString<Authorization>;
export type OrderRow = DateToString<Order>;
export type OrderLineItemRow = DateToString<OrderLineItem>;
export type PackedVialRow = DateToString<PackedVial>;
export type OrderSignatureRow = DateToString<OrderSignature>;
export type ClinicalCheckRow = DateToString<ClinicalCheck>;
export type DeliveryRow = DateToString<Delivery>;
export type InfusionEntryRow = DateToString<InfusionEntry>;
export type BleedRow = DateToString<Bleed>;
export type SupplyItemRow = DateToString<SupplyItem>;
export type ThreadRow = DateToString<Thread>;
export type MessageRow = DateToString<Message>;
export type InternalNoteRow = DateToString<InternalNote>;
export type NoteTagRow = DateToString<NoteTag>;
export type NoteAckRow = DateToString<NoteAcknowledgement>;
export type NotificationRow = DateToString<Notification>;
export type AuditEventRow = DateToString<AuditEvent>;

// ── The raw fixtures DB shape (mirrors dummy-data.json, keyed per model) ────
export interface FixturesDB {
  users: UserRow[];
  userRoles: UserRoleRow[];
  patients: PatientRow[];
  careTeamAssignments: CareTeamRow[];
  authorizedUsers: AuthorizedUserRow[];
  prescriptions: PrescriptionRow[];
  assayComponents: AssayComponentRow[];
  onboardings: OnboardingRow[];
  gates: GateRow[];
  gateEvents: GateEventRow[];
  authorizations: AuthorizationRow[];
  orders: OrderRow[];
  orderLineItems: OrderLineItemRow[];
  packedVials: PackedVialRow[];
  orderSignatures: OrderSignatureRow[];
  clinicalChecks: ClinicalCheckRow[];
  deliveries: DeliveryRow[];
  infusionEntries: InfusionEntryRow[];
  bleeds: BleedRow[];
  supplyItems: SupplyItemRow[];
  threads: ThreadRow[];
  messages: MessageRow[];
  internalNotes: InternalNoteRow[];
  noteTags: NoteTagRow[];
  noteAcknowledgements: NoteAckRow[];
  notifications: NotificationRow[];
  auditEvents: AuditEventRow[];
}

// ── Joined / nested view shapes returned by the dataProvider ────────────────
// (Exactly what Prisma `include` would return once live.)

export type PrescriptionDetail = PrescriptionRow & {
  assayComponents: AssayComponentRow[];
};

export type BleedDetail = BleedRow & {
  treatments: InfusionEntryRow[];
};

export type OrderDetail = OrderRow & {
  lineItems: OrderLineItemRow[];
  signature: OrderSignatureRow | null;
  clinicalCheck: ClinicalCheckRow | null;
  delivery: DeliveryRow | null;
  packedManifest: PackedVialRow[];
};

export type GateDetail = GateRow & {
  events: GateEventRow[];
};

export type OnboardingDetail = OnboardingRow & {
  gates: GateDetail[];
};

export type CareTeamMember = CareTeamRow & {
  user: UserRow;
};

/** The full patient record — the join a `getPatient(id)` returns. */
export type PatientDetail = PatientRow & {
  prescriptions: PrescriptionDetail[];
  orders: OrderDetail[];
  infusions: InfusionEntryRow[];
  bleeds: BleedDetail[];
  authorizations: AuthorizationRow[];
  onboarding: OnboardingDetail | null;
  careTeam: CareTeamMember[];
  authorizedUsers: AuthorizedUserRow[];
};

export type StaffUser = UserRow & {
  roles: import("@prisma/client").StaffRole[];
};
