// ============================================================================
// Notification Service — Pluggable Provider System
// Supports SMS, Email, and In-App Push providers (mocked for now)
// ============================================================================

export interface NotificationPayload {
  to: string;
  subject?: string;
  body: string;
  templateId?: string;
  templateData?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ProviderResult {
  success: boolean;
  provider: string;
  externalId?: string;
  error?: string;
}

export interface NotificationProvider {
  name: string;
  send(payload: NotificationPayload): Promise<ProviderResult>;
}

// ─── Mock SMS Provider ─────────────────────────────────────────────────────

export class MockSmsProvider implements NotificationProvider {
  name = 'mock_sms';

  async send(payload: NotificationPayload): Promise<ProviderResult> {
    console.log(`[MockSMS] To: ${payload.to} | Body: ${payload.body}`);
    return {
      success: true,
      provider: this.name,
      externalId: `sms_mock_${Date.now()}`,
    };
  }
}

// ─── Mock Email Provider ────────────────────────────────────────────────────

export class MockEmailProvider implements NotificationProvider {
  name = 'mock_email';

  async send(payload: NotificationPayload): Promise<ProviderResult> {
    console.log(`[MockEmail] To: ${payload.to} | Subject: ${payload.subject || '(no subject)'} | Body: ${payload.body}`);
    return {
      success: true,
      provider: this.name,
      externalId: `email_mock_${Date.now()}`,
    };
  }
}

// ─── In-App Push Provider ──────────────────────────────────────────────────

export class InAppPushProvider implements NotificationProvider {
  name = 'in_app_push';

  async send(payload: NotificationPayload): Promise<ProviderResult> {
    console.log(`[InAppPush] User: ${payload.to} | Body: ${payload.body}`);
    return {
      success: true,
      provider: this.name,
      externalId: `push_mock_${Date.now()}`,
    };
  }
}

// ─── Provider Registry ─────────────────────────────────────────────────────

export class ProviderRegistry {
  private providers: Map<string, NotificationProvider> = new Map();
  private defaultProvider: string;

  constructor(defaultProvider: string = 'mock_email') {
    this.defaultProvider = defaultProvider;
    this.register(new MockSmsProvider());
    this.register(new MockEmailProvider());
    this.register(new InAppPushProvider());
  }

  register(provider: NotificationProvider): void {
    this.providers.set(provider.name, provider);
  }

  getProvider(name?: string): NotificationProvider {
    const providerName = name || this.defaultProvider;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Notification provider '${providerName}' not found`);
    }
    return provider;
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}