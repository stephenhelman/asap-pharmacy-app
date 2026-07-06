/**
 * SERVICE SEAMS — every external call is a stubbed success behind a swappable
 * function (same discipline as `dataProvider`). Each stub IS the interface the
 * real service implements later, so swapping fake → real (GHL OTP, R2 upload,
 * DB write, GHL referral) is a service-module change, not a screen change.
 *
 * Nothing here touches a network. The prototype's "electricity stays off."
 */
export { otpService, DEMO_OTP } from "./otpService";
export type { OtpTarget } from "./otpService";
export { uploadService } from "./uploadService";
export { patientService } from "./patientService";
export { referralService } from "./referralService";
export type { ReferralResult } from "./referralService";
