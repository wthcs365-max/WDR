// ============================================================================
// WTH Drive Rentals — Shared Type Definitions
// Mirrors the PostgreSQL enum definitions from schema.sql
// ============================================================================

// ─── IAM ─────────────────────────────────────────────────────────────────────

export enum UserRole {
  RENTER = 'renter',
  OWNER = 'owner',
  DEALER = 'dealer',
  FLEET_MANAGER = 'fleet_manager',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum KycDocumentType {
  ID_DOCUMENT = 'id_document',
  DRIVERS_LICENSE = 'drivers_license',
  PASSPORT = 'passport',
  PROOF_OF_ADDRESS = 'proof_of_address',
  SELFIE = 'selfie',
  BANK_STATEMENT = 'bank_statement',
}

// ─── Fleet ──────────────────────────────────────────────────────────────────

export enum OwnershipType {
  PRIVATE_OWNER = 'private_owner',
  DEALER = 'dealer',
  FLEET_OPERATOR = 'fleet_operator',
  WDR_OWNED = 'wdr_owned',
}

export enum VehicleStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  IN_TRANSIT = 'in_transit',
  MAINTENANCE = 'maintenance',
  UNAVAILABLE = 'unavailable',
  RETIRED = 'retired',
}

export enum FuelType {
  PETROL = 'petrol',
  DIESEL = 'diesel',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid',
  PLUGIN_HYBRID = 'plugin_hybrid',
}

export enum Transmission {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  CVT = 'cvt',
  DSG = 'dsg',
}

// ─── Booking ────────────────────────────────────────────────────────────────

export enum BookingStatus {
  QUOTE = 'quote',
  PENDING_CONFIRMATION = 'pending_confirmation',
  CONFIRMED = 'confirmed',
  ACTIVE = 'active',
  EXTENDED = 'extended',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
  NO_SHOW = 'no_show',
}

export enum InsuranceTier {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  WDR_SHIELD_WAIVED = 'wdr_shield_waived',
}

// ─── Trust ──────────────────────────────────────────────────────────────────

export enum TrustTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

export enum DepositStatus {
  PENDING = 'pending',
  HELD = 'held',
  RELEASED = 'released',
  PARTIALLY_RELEASED = 'partially_released',
  CLAIMED = 'claimed',
  DISPUTED = 'disputed',
}

export enum ClaimStatus {
  REPORTED = 'reported',
  INVESTIGATING = 'investigating',
  APPROVED = 'approved',
  DENIED = 'denied',
  PAID_OUT = 'paid_out',
  APPEALED = 'appealed',
}

// ─── Subscriptions ──────────────────────────────────────────────────────────

export enum SubscriptionPlan {
  VAAS_FLEX = 'vaas_flex',
  VAAS_PLUS = 'vaas_plus',
  VAAS_BUSINESS = 'vaas_business',
  WDR_PLUS_MEMBERSHIP = 'wdr_plus_membership',
}

export enum BillingPeriod {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  DEFAULTED = 'defaulted',
}

// ─── Ledger ─────────────────────────────────────────────────────────────────

export enum TransactionType {
  RENTAL_PAYMENT = 'rental_payment',
  SUBSCRIPTION_PAYMENT = 'subscription_payment',
  DEPOSIT_HOLD = 'deposit_hold',
  DEPOSIT_RELEASE = 'deposit_release',
  DEPOSIT_CLAIM = 'deposit_claim',
  COMMISSION = 'commission',
  PAYOUT = 'payout',
  REFUND = 'refund',
  TOP_UP = 'top_up',
  PENALTY = 'penalty',
  WDR_SHIELD_FEE = 'wdr_shield_fee',
  WDR_PLUS_FEE = 'wdr_plus_fee',
  INSURANCE_PREMIUM = 'insurance_premium',
  LATE_FEE = 'late_fee',
  DAMAGE_FEE = 'damage_fee',
  EXTENSION_FEE = 'extension_fee',
  CANCELLATION_FEE = 'cancellation_fee',
  REFERRAL_BONUS = 'referral_bonus',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
  DISPUTED = 'disputed',
}

export enum LedgerDirection {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

// ─── API Response Types ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, any>;
  errors?: ApiError[];
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  request_id: string;
}

// ─── Auth Types ─────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;           // user UUID
  role: UserRole;
  trust_tier?: TrustTier;
  permissions: string[];
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ─── User Types ─────────────────────────────────────────────────────────────

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  idNumber?: string;
  nationality?: string;
  role?: UserRole;
  referralCode?: string;
  referredBy?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  preferredName?: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  phone: string | null;
  phoneVerified: boolean;
  fullName: string;
  preferredName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  isOnboarded: boolean;
  createdAt: string;
}

// ─── Vehicle Types ──────────────────────────────────────────────────────────

export interface VehicleSearchParams {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  startDate?: string;
  endDate?: string;
  minRate?: number;
  maxRate?: number;
  makes?: string;
  transmission?: Transmission;
  fuelType?: FuelType;
  minSeats?: number;
  features?: string;
  ownershipType?: OwnershipType;
  p2pEnabled?: boolean;
  vaasEnabled?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'distance';
  page?: number;
  pageSize?: number;
}

export interface VehicleResponse {
  id: string;
  ownerId: string;
  ownershipType: OwnershipType;
  make: string;
  model: string;
  year: number;
  color: string | null;
  transmission: Transmission;
  seats: number;
  doors: number;
  fuelType: FuelType;
  features: string[];
  photos: { url: string; isPrimary: boolean; caption?: string }[];
  status: VehicleStatus;
  dailyRateZar: number;
  weeklyRateZar: number | null;
  monthlyRateZar: number | null;
  depositZar: number | null;
  location: { lat: number; lng: number; address?: string; city?: string; province?: string } | null;
  isP2pEnabled: boolean;
  isVaasEnabled: boolean;
  insuranceTier: InsuranceTier;
  distance?: number;  // from search center
}

export interface CreateVehicleInput {
  ownershipType: OwnershipType;
  modelId: number;
  year: number;
  color?: string;
  vin?: string;
  registrationPlate?: string;
  mileageKm: number;
  fuelType: FuelType;
  transmission: Transmission;
  seats: number;
  doors: number;
  dailyRateZar: number;
  weeklyRateZar?: number;
  monthlyRateZar?: number;
  depositZar?: number;
  features?: string[];
  insuranceTier?: InsuranceTier;
  isP2pEnabled?: boolean;
  isVaasEnabled?: boolean;
  city?: string;
  province?: string;
}

// ─── Telematics ─────────────────────────────────────────────────────────────

export interface TelemetryEvent {
  deviceId: string;
  vehicleId: string;
  eventType: string;
  lat: number | null;
  lng: number | null;
  speedKmh: number | null;
  headingDeg: number | null;
  odometerKm: number | null;
  fuelLevelPct: number | null;
  recordedAt: string;
}

export interface DeviceRegistrationInput {
  vehicleId: string;
  deviceImei: string;
  deviceType: 'obd2' | 'gps_tracker' | 'telematics_unit' | 'ble_tag';
  firmwareVersion?: string;
}