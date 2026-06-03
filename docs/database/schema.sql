-- ============================================================================
-- WTH Drive Rentals — Complete Database Schema
-- Target: PostgreSQL 15+
-- Notes: All UUIDs are v4. Enums are idempotent (CREATE IF NOT EXISTS).
-- ============================================================================

BEGIN;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================================
-- ENUMS (abbreviated for repo — full version in shared/database/schema.sql)
-- ============================================================================

CREATE TYPE iam.user_role AS ENUM ('renter', 'owner', 'dealer', 'fleet_manager', 'admin', 'super_admin');
CREATE TYPE iam.verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected', 'expired');
CREATE TYPE iam.kyc_document_type AS ENUM ('id_document', 'drivers_license', 'passport', 'proof_of_address', 'selfie', 'bank_statement');
CREATE TYPE fleet.ownership_type AS ENUM ('private_owner', 'dealer', 'fleet_operator', 'wdr_owned');
CREATE TYPE fleet.vehicle_status AS ENUM ('available', 'booked', 'in_transit', 'maintenance', 'unavailable', 'retired');
CREATE TYPE fleet.fuel_type AS ENUM ('petrol', 'diesel', 'electric', 'hybrid', 'plugin_hybrid');
CREATE TYPE booking.booking_status AS ENUM ('quote', 'pending_confirmation', 'confirmed', 'active', 'extended', 'completed', 'cancelled', 'disputed', 'no_show');
CREATE TYPE booking.insurance_tier AS ENUM ('basic', 'standard', 'premium', 'wdr_shield_waived');
CREATE TYPE trust.trust_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');
CREATE TYPE trust.deposit_status AS ENUM ('pending', 'held', 'released', 'partially_released', 'claimed', 'disputed');
CREATE TYPE trust.claim_status AS ENUM ('reported', 'investigating', 'approved', 'denied', 'paid_out', 'appealed');
CREATE TYPE subs.subscription_plan AS ENUM ('vaas_flex', 'vaas_plus', 'vaas_business', 'wdr_plus_membership');
CREATE TYPE subs.billing_period AS ENUM ('weekly', 'biweekly', 'monthly', 'quarterly', 'annual');
CREATE TYPE subs.subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired', 'defaulted');
CREATE TYPE ledger.transaction_type AS ENUM ('rental_payment', 'subscription_payment', 'deposit_hold', 'deposit_release', 'deposit_claim', 'commission', 'payout', 'refund', 'top_up', 'penalty', 'wdr_shield_fee', 'wdr_plus_fee', 'insurance_premium', 'late_fee', 'damage_fee', 'extension_fee', 'cancellation_fee', 'referral_bonus');
CREATE TYPE ledger.transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'reversed', 'disputed');
CREATE TYPE ledger.ledger_direction AS ENUM ('debit', 'credit');
CREATE TYPE telemetry.event_type AS ENUM ('ignition_on', 'ignition_off', 'engine_start', 'engine_stop', 'gps_location', 'speeding', 'harsh_brake', 'harsh_acceleration', 'sharp_turn', 'collision', 'pothole', 'geofence_entry', 'geofence_exit', 'tamper_detected', 'device_disconnected', 'fuel_drop', 'battery_low', 'maintenance_alert', 'door_open', 'door_closed', 'lock', 'unlock');

-- ============================================================================
-- SCHEMA: iam — Identity & Access Management
-- ============================================================================

CREATE TABLE iam.users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               TEXT NOT NULL UNIQUE,
    phone               TEXT,
    phone_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash       TEXT NOT NULL,
    full_name           TEXT NOT NULL,
    preferred_name      TEXT,
    avatar_url          TEXT,
    date_of_birth       DATE,
    id_number           TEXT,
    nationality         TEXT DEFAULT 'ZA',
    role                iam.user_role NOT NULL DEFAULT 'renter',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_onboarded        BOOLEAN NOT NULL DEFAULT FALSE,
    referral_code       TEXT UNIQUE,
    referred_by         UUID REFERENCES iam.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE iam.kyc_verifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
    document_type       iam.kyc_document_type NOT NULL,
    document_url        TEXT NOT NULL,
    document_hash       TEXT,
    verification_status iam.verification_status NOT NULL DEFAULT 'pending',
    verified_by         UUID REFERENCES iam.users(id),
    verified_at         TIMESTAMPTZ,
    rejection_reason    TEXT,
    expiry_date         DATE,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE iam.biometric_credentials (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
    credential_type     TEXT NOT NULL CHECK (credential_type IN ('face', 'fingerprint', 'voice')),
    credential_id       TEXT NOT NULL,
    provider            TEXT NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    enrolled_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at        TIMESTAMPTZ,
    UNIQUE(user_id, credential_type)
);

CREATE TABLE iam.user_addresses (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
    address_type        TEXT NOT NULL CHECK (address_type IN ('home', 'work', 'billing', 'pickup')),
    street_line1        TEXT NOT NULL,
    street_line2        TEXT,
    suburb              TEXT,
    city                TEXT NOT NULL,
    province            TEXT NOT NULL,
    postal_code         TEXT,
    country             TEXT NOT NULL DEFAULT 'ZA',
    is_primary          BOOLEAN NOT NULL DEFAULT FALSE,
    geo_location        POINT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE iam.user_payment_methods (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
    method_type         TEXT NOT NULL CHECK (method_type IN ('card', 'bank_account', 'ewallet', 'crypto')),
    provider            TEXT NOT NULL,
    token               TEXT NOT NULL,
    last_four           TEXT,
    expiry_month        INT,
    expiry_year         INT,
    card_brand          TEXT,
    is_default          BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SCHEMA: fleet — Vehicle Inventory
-- ============================================================================

CREATE TABLE fleet.vehicle_makes (
    id                  SERIAL PRIMARY KEY,
    name                TEXT NOT NULL UNIQUE,
    logo_url            TEXT
);

CREATE TABLE fleet.vehicle_models (
    id                  SERIAL PRIMARY KEY,
    make_id             INT NOT NULL REFERENCES fleet.vehicle_makes(id),
    name                TEXT NOT NULL,
    year_start          INT,
    year_end            INT,
    vehicle_class       TEXT,
    UNIQUE(make_id, name)
);

CREATE TABLE fleet.vehicles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id            UUID NOT NULL REFERENCES iam.users(id),
    ownership_type      fleet.ownership_type NOT NULL,
    model_id            INT NOT NULL REFERENCES fleet.vehicle_models(id),
    year                INT NOT NULL,
    color               TEXT,
    vin                 TEXT UNIQUE,
    registration_plate  TEXT,
    mileage_km          INT NOT NULL DEFAULT 0,
    fuel_type           fleet.fuel_type NOT NULL DEFAULT 'petrol',
    transmission        TEXT NOT NULL CHECK (transmission IN ('manual', 'automatic', 'cvt', 'dsg')),
    seats               INT NOT NULL DEFAULT 5,
    doors               INT NOT NULL DEFAULT 4,
    features            JSONB DEFAULT '[]',
    photos              JSONB DEFAULT '[]',
    status              fleet.vehicle_status NOT NULL DEFAULT 'available',
    daily_rate_zar      DECIMAL(10,2) NOT NULL,
    weekly_rate_zar     DECIMAL(10,2),
    monthly_rate_zar    DECIMAL(10,2),
    deposit_zar         DECIMAL(10,2),
    minimum_trip_hours  INT DEFAULT 4,
    max_daily_km        INT DEFAULT 200,
    extra_km_rate_zar   DECIMAL(10,2) DEFAULT 2.50,
    late_return_fee_zar DECIMAL(10,2) DEFAULT 100.00,
    insurance_tier      booking.insurance_tier NOT NULL DEFAULT 'standard',
    is_vaas_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    is_p2p_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    location_lat        DECIMAL(10,7),
    location_lng        DECIMAL(10,7),
    location_address    TEXT,
    city                TEXT,
    province            TEXT,
    geo_fence_radius_m  INT DEFAULT 100,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fleet.vehicle_availability (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id          UUID NOT NULL REFERENCES fleet.vehicles(id) ON DELETE CASCADE,
    date                DATE NOT NULL,
    is_available        BOOLEAN NOT NULL DEFAULT TRUE,
    block_reason        TEXT,
    UNIQUE(vehicle_id, date)
);

CREATE TABLE fleet.vehicle_documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id          UUID NOT NULL REFERENCES fleet.vehicles(id) ON DELETE CASCADE,
    document_type       TEXT NOT NULL CHECK (document_type IN ('registration', 'license_disk', 'insurance_certificate', 'roadworthy', 'service_history', 'photo')),
    document_url        TEXT NOT NULL,
    expiry_date         DATE,
    verification_status iam.verification_status NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fleet.vehicle_device (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id          UUID NOT NULL UNIQUE REFERENCES fleet.vehicles(id) ON DELETE CASCADE,
    device_imei         TEXT UNIQUE NOT NULL,
    device_type         TEXT NOT NULL CHECK (device_type IN ('obd2', 'gps_tracker', 'telematics_unit', 'ble_tag')),
    firmware_version    TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    last_ping_at        TIMESTAMPTZ,
    battery_level       INT CHECK (battery_level >= 0 AND battery_level <= 100),
    installed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at      TIMESTAMPTZ
);

-- ============================================================================
-- SCHEMA: booking — Reservations & Trips
-- ============================================================================

CREATE TABLE booking.bookings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    renter_id           UUID NOT NULL REFERENCES iam.users(id),
    vehicle_id          UUID NOT NULL REFERENCES fleet.vehicles(id),
    status              booking.booking_status NOT NULL DEFAULT 'pending_confirmation',
    start_time          TIMESTAMPTZ NOT NULL,
    end_time            TIMESTAMPTZ NOT NULL,
    actual_start_time   TIMESTAMPTZ,
    actual_end_time     TIMESTAMPTZ,
    pickup_location     TEXT,
    return_location     TEXT,
    is_delivery         BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_fee_zar    DECIMAL(10,2) DEFAULT 0,
    estimated_km        INT,
    actual_km_driven    INT,
    estimated_total     DECIMAL(10,2) NOT NULL,
    actual_total        DECIMAL(10,2),
    daily_rate_applied  DECIMAL(10,2) NOT NULL,
    insurance_tier      booking.insurance_tier NOT NULL DEFAULT 'standard',
    insurance_fee_zar   DECIMAL(10,2) DEFAULT 0,
    wdr_shield_fee_zar  DECIMAL(10,2) DEFAULT 0,
    deposit_hold_zar    DECIMAL(10,2),
    late_fee_zar        DECIMAL(10,2) DEFAULT 0,
    extra_km_fee_zar    DECIMAL(10,2) DEFAULT 0,
    damage_fee_zar      DECIMAL(10,2) DEFAULT 0,
    cancellation_fee_zar DECIMAL(10,2) DEFAULT 0,
    discount_zar        DECIMAL(10,2) DEFAULT 0,
    promo_code          TEXT,
    notes               TEXT,
    cancellation_reason TEXT,
    cancellation_at     TIMESTAMPTZ,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT booking_time_check CHECK (end_time > start_time),
    CONSTRAINT booking_no_overlap EXCLUDE USING gist (
        vehicle_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    )
);

CREATE TABLE booking.booking_insurance (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID NOT NULL REFERENCES booking.bookings(id) ON DELETE CASCADE,
    policy_number       TEXT NOT NULL,
    provider            TEXT NOT NULL,
    tier                booking.insurance_tier NOT NULL,
    coverage_details    JSONB DEFAULT '{}',
    premium_zar         DECIMAL(10,2) NOT NULL,
    is_waived           BOOLEAN NOT NULL DEFAULT FALSE,
    waiver_reason       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE booking.check_in_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID NOT NULL REFERENCES booking.bookings(id) ON DELETE CASCADE,
    checkin_type        TEXT NOT NULL CHECK (checkin_type IN ('selfie', 'qr_code', 'nfc', 'in_person', 'remote_unlock')),
    driver_selfie_url   TEXT,
    id_verification_url TEXT,
    odometer_reading    INT,
    fuel_level          DECIMAL(5,2),
    damage_photos       JSONB DEFAULT '[]',
    device_paired       BOOLEAN DEFAULT FALSE,
    gps_coordinates     POINT,
    checked_in_by       UUID REFERENCES iam.users(id),
    checked_in_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE booking.check_out_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID NOT NULL REFERENCES booking.bookings(id) ON DELETE CASCADE,
    odometer_reading    INT,
    fuel_level          DECIMAL(5,2),
    damage_photos       JSONB DEFAULT '[]',
    damage_notes        TEXT,
    is_damaged          BOOLEAN NOT NULL DEFAULT FALSE,
    damage_flagged_by   TEXT CHECK (damage_flagged_by IN ('renter', 'owner', 'system', 'staff')),
    gps_coordinates     POINT,
    checked_out_by      UUID REFERENCES iam.users(id),
    checked_out_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE booking.booking_extensions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID NOT NULL REFERENCES booking.bookings(id) ON DELETE CASCADE,
    original_end_time   TIMESTAMPTZ NOT NULL,
    new_end_time        TIMESTAMPTZ NOT NULL,
    additional_fee_zar  DECIMAL(10,2) NOT NULL,
    status              TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
    approved_by         UUID REFERENCES iam.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SCHEMA: trust — Trust Scoring, Deposits & Claims
-- ============================================================================

CREATE TABLE trust.trust_scores (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
    overall_score       INT NOT NULL CHECK (overall_score >= 300 AND overall_score <= 900),
    tier                trust.trust_tier NOT NULL DEFAULT 'bronze',
    identity_score      INT CHECK (identity_score >= 0 AND identity_score <= 100),
    rental_history_score INT CHECK (rental_history_score >= 0 AND rental_history_score <= 100),
    driving_behavior_score INT CHECK (driving_behavior_score >= 0 AND driving_behavior_score <= 100),
    payment_reliability_score INT CHECK (payment_reliability_score >= 0 AND payment_reliability_score <= 100),
    verification_score  INT CHECK (verification_score >= 0 AND verification_score <= 100),
    social_score        INT CHECK (social_score >= 0 AND social_score <= 100),
    deposit_waiver_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    max_waiver_amount_zar DECIMAL(10,2),
    reduced_deposit_pct   DECIMAL(5,2),
    last_calculated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    calculation_version  INT NOT NULL DEFAULT 1,
    UNIQUE(user_id)
);

CREATE TABLE trust.trust_score_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
    event_type          TEXT NOT NULL,
    score_delta         INT NOT NULL,
    previous_score      INT,
    new_score           INT,
    reason              TEXT NOT NULL,
    reference_id        UUID,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trust.deposits (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID NOT NULL UNIQUE REFERENCES booking.bookings(id) ON DELETE CASCADE,
    renter_id           UUID NOT NULL REFERENCES iam.users(id),
    amount_zar          DECIMAL(10,2) NOT NULL,
    status              trust.deposit_status NOT NULL DEFAULT 'pending',
    hold_method         TEXT NOT NULL CHECK (hold_method IN ('card_hold', 'eft', 'wdr_shield_waiver', 'partner_guarantee')),
    waiver_used         BOOLEAN NOT NULL DEFAULT FALSE,
    waiver_approval_id  UUID,
    released_at         TIMESTAMPTZ,
    claimed_amount_zar  DECIMAL(10,2),
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trust.claims (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID NOT NULL REFERENCES booking.bookings(id) ON DELETE CASCADE,
    vehicle_id          UUID NOT NULL REFERENCES fleet.vehicles(id),
    claimant_id         UUID NOT NULL REFERENCES iam.users(id),
    respondent_id       UUID REFERENCES iam.users(id),
    claim_type          TEXT NOT NULL CHECK (claim_type IN ('damage', 'theft', 'vandalism', 'traffic_fine', 'towing', 'fuel_violation', 'smoking', 'excess_mileage', 'late_return', 'cleaning', 'other')),
    amount_zar          DECIMAL(10,2) NOT NULL,
    status              trust.claim_status NOT NULL DEFAULT 'reported',
    evidence            JSONB DEFAULT '[]',
    description         TEXT NOT NULL,
    assessor_notes      TEXT,
    decision_notes      TEXT,
    paid_out_at         TIMESTAMPTZ,
    paid_out_to         UUID REFERENCES iam.users(id),
    deposit_applied     BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trust.waiver_approvals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    renter_id           UUID NOT NULL REFERENCES iam.users(id),
    booking_id          UUID REFERENCES booking.bookings(id),
    trust_score_id      UUID NOT NULL REFERENCES trust.trust_scores(id),
    waiver_amount_zar   DECIMAL(10,2) NOT NULL,
    approved            BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by         TEXT CHECK (approved_by IN ('system', 'admin')),
    approval_criteria   JSONB DEFAULT '{}',
    expiry_time         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SCHEMA: ledger — Payments & Financial Ledger
-- ============================================================================

CREATE TABLE ledger.wallets (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL UNIQUE REFERENCES iam.users(id) ON DELETE CASCADE,
    balance_zar         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    available_balance   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    hold_balance        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    currency            TEXT NOT NULL DEFAULT 'ZAR',
    is_frozen           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ledger.transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id           UUID NOT NULL REFERENCES ledger.wallets(id),
    transaction_type    ledger.transaction_type NOT NULL,
    direction           ledger.ledger_direction NOT NULL,
    amount_zar          DECIMAL(12,2) NOT NULL,
    balance_before      DECIMAL(12,2) NOT NULL,
    balance_after       DECIMAL(12,2) NOT NULL,
    status              ledger.transaction_status NOT NULL DEFAULT 'pending',
    reference_type      TEXT,
    reference_id        UUID,
    description         TEXT,
    gateway_reference   TEXT,
    gateway_response    JSONB DEFAULT '{}',
    fee_zar             DECIMAL(10,2) DEFAULT 0.00,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at          TIMESTAMPTZ
);

CREATE TABLE ledger.commissions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID NOT NULL REFERENCES booking.bookings(id) ON DELETE CASCADE,
    owner_id            UUID NOT NULL REFERENCES iam.users(id),
    transaction_id      UUID REFERENCES ledger.transactions(id),
    gross_amount_zar    DECIMAL(12,2) NOT NULL,
    commission_rate_pct DECIMAL(5,2) NOT NULL,
    commission_amount_zar DECIMAL(10,2) NOT NULL,
    platform_fee_zar    DECIMAL(10,2) DEFAULT 0.00,
    owner_payout_zar    DECIMAL(12,2) NOT NULL,
    status              TEXT NOT NULL CHECK (status IN ('calculated', 'invoice', 'paid', 'reversed')),
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ledger.ledger_entries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id      UUID NOT NULL REFERENCES ledger.transactions(id),
    account             TEXT NOT NULL,
    direction           ledger.ledger_direction NOT NULL,
    amount_zar          DECIMAL(12,2) NOT NULL,
    entry_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ledger.invoices (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES iam.users(id),
    invoice_type        TEXT NOT NULL CHECK (invoice_type IN ('rental', 'subscription', 'commission', 'penalty', 'refund')),
    reference_type      TEXT,
    reference_id        UUID,
    invoice_number      TEXT NOT NULL UNIQUE,
    line_items          JSONB NOT NULL DEFAULT '[]',
    subtotal_zar        DECIMAL(12,2) NOT NULL,
    vat_zar             DECIMAL(10,2) DEFAULT 0.00,
    total_zar           DECIMAL(12,2) NOT NULL,
    status              TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'credited')),
    due_date            DATE,
    paid_at             TIMESTAMPTZ,
    pdf_url             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SCHEMA: subs — Subscriptions & VaaS
-- ============================================================================

CREATE TABLE subs.subscription_plans (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_type           subs.subscription_plan NOT NULL,
    name                TEXT NOT NULL,
    description         TEXT,
    billing_period      subs.billing_period NOT NULL,
    price_zar           DECIMAL(10,2) NOT NULL,
    setup_fee_zar       DECIMAL(10,2) DEFAULT 0.00,
    included_hours      INT,
    included_km         INT,
    excess_km_rate_zar  DECIMAL(10,2),
    vehicle_categories  JSONB DEFAULT '[]',
    max_active_bookings INT DEFAULT 1,
    features            JSONB DEFAULT '[]',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subs.subscriptions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES iam.users(id),
    plan_id             UUID NOT NULL REFERENCES subs.subscription_plans(id),
    vehicle_id          UUID REFERENCES fleet.vehicles(id),
    status              subs.subscription_status NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end  TIMESTAMPTZ NOT NULL,
    cancelled_at        TIMESTAMPTZ,
    pause_start         TIMESTAMPTZ,
    pause_end           TIMESTAMPTZ,
    auto_renew          BOOLEAN NOT NULL DEFAULT TRUE,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subs.billing_cycles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id     UUID NOT NULL REFERENCES subs.subscriptions(id) ON DELETE CASCADE,
    period_start        TIMESTAMPTZ NOT NULL,
    period_end          TIMESTAMPTZ NOT NULL,
    amount_zar          DECIMAL(10,2) NOT NULL,
    status              TEXT NOT NULL CHECK (status IN ('pending', 'invoiced', 'paid', 'failed', 'refunded')),
    invoice_id          UUID REFERENCES ledger.invoices(id),
    transaction_id      UUID REFERENCES ledger.transactions(id),
    usage_data          JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SCHEMA: telemetry — Real-time Vehicle Data
-- ============================================================================

CREATE TABLE telemetry.telemetry_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id           UUID NOT NULL REFERENCES fleet.vehicle_device(id) ON DELETE CASCADE,
    vehicle_id          UUID NOT NULL REFERENCES fleet.vehicles(id) ON DELETE CASCADE,
    event_type          telemetry.event_type NOT NULL,
    lat                 DECIMAL(10,7),
    lng                 DECIMAL(10,7),
    altitude_m          DECIMAL(8,2),
    heading_deg         DECIMAL(5,2),
    speed_kmh           DECIMAL(6,2),
    odometer_km         INT,
    fuel_level_pct      DECIMAL(5,2),
    engine_rpm          INT,
    battery_voltage     DECIMAL(5,2),
    ev_charge_pct       DECIMAL(5,2),
    engine_temp_c       DECIMAL(5,2),
    tire_pressure_psi   JSONB DEFAULT '{}',
    dtc_codes           JSONB DEFAULT '[]',
    device_battery_pct  INT,
    signal_strength     INT,
    accuracy_m          DECIMAL(8,2),
    recorded_at         TIMESTAMPTZ NOT NULL,
    received_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (recorded_at);

CREATE INDEX idx_telemetry_vehicle_time ON telemetry.telemetry_events (vehicle_id, recorded_at DESC);
CREATE INDEX idx_telemetry_event_type ON telemetry.telemetry_events (event_type, recorded_at DESC);

CREATE TABLE telemetry.trip_segments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID REFERENCES booking.bookings(id) ON DELETE SET NULL,
    vehicle_id          UUID NOT NULL REFERENCES fleet.vehicles(id),
    device_id           UUID NOT NULL REFERENCES fleet.vehicle_device(id),
    start_time          TIMESTAMPTZ NOT NULL,
    end_time            TIMESTAMPTZ,
    start_lat           DECIMAL(10,7),
    start_lng           DECIMAL(10,7),
    end_lat             DECIMAL(10,7),
    end_lng             DECIMAL(10,7),
    distance_km         DECIMAL(10,2),
    max_speed_kmh       DECIMAL(6,2),
    avg_speed_kmh       DECIMAL(6,2),
    harsh_events_count  INT DEFAULT 0,
    score               INT CHECK (score >= 0 AND score <= 100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE telemetry.geofence_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id          UUID NOT NULL REFERENCES fleet.vehicles(id),
    booking_id          UUID REFERENCES booking.bookings(id),
    fence_type          TEXT NOT NULL CHECK (fence_type IN ('home', 'pickup', 'return', 'restricted', 'speed_zone')),
    event               TEXT NOT NULL CHECK (event IN ('enter', 'exit', 'breach')),
    lat                 DECIMAL(10,7),
    lng                 DECIMAL(10,7),
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SCHEMA: events — Domain Event Store
-- ============================================================================

CREATE TABLE events.domain_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_type      TEXT NOT NULL,
    aggregate_id        UUID NOT NULL,
    event_type          TEXT NOT NULL,
    event_data          JSONB NOT NULL,
    event_version       INT NOT NULL DEFAULT 1,
    producer            TEXT NOT NULL,
    trace_id            TEXT,
    published           BOOLEAN NOT NULL DEFAULT FALSE,
    published_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_domain_events_unpublished ON events.domain_events (created_at) WHERE published = FALSE;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_users_role ON iam.users(role);
CREATE INDEX idx_users_referral ON iam.users(referral_code);
CREATE INDEX idx_kyc_user_status ON iam.kyc_verifications(user_id, verification_status);
CREATE INDEX idx_vehicles_owner ON fleet.vehicles(owner_id);
CREATE INDEX idx_vehicles_status_city ON fleet.vehicles(status, city);
CREATE INDEX idx_vehicles_geo ON fleet.vehicles(location_lat, location_lng);
CREATE INDEX idx_bookings_renter ON booking.bookings(renter_id);
CREATE INDEX idx_bookings_vehicle ON booking.bookings(vehicle_id);
CREATE INDEX idx_bookings_status ON booking.bookings(status);
CREATE INDEX idx_bookings_dates ON booking.bookings(start_time, end_time);
CREATE INDEX idx_trust_scores_tier ON trust.trust_scores(tier);
CREATE INDEX idx_trust_scores_score ON trust.trust_scores(overall_score DESC);
CREATE INDEX idx_deposits_status ON trust.deposits(status);
CREATE INDEX idx_claims_status ON trust.claims(status);
CREATE INDEX idx_transactions_wallet ON ledger.transactions(wallet_id, created_at DESC);
CREATE INDEX idx_transactions_reference ON ledger.transactions(reference_type, reference_id);
CREATE INDEX idx_commissions_booking ON ledger.commissions(booking_id);
CREATE INDEX idx_subscriptions_user ON subs.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subs.subscriptions(status);
CREATE INDEX idx_billing_cycles_status ON subs.billing_cycles(status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON iam.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON fleet.vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON booking.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_trust_scores_updated_at BEFORE UPDATE ON trust.trust_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subs.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO ledger.wallets (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_wallet_after_user_insert AFTER INSERT ON iam.users FOR EACH ROW EXECUTE FUNCTION create_user_wallet();

COMMIT;