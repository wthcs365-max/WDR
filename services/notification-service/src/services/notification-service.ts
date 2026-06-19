// ============================================================================
// Notification Service — Notification Service
// Handles event-driven notifications via pluggable providers
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { ProviderRegistry, NotificationPayload, ProviderResult } from '../providers';

const prisma = new PrismaClient();

export interface NotificationEvent {
  type: string;
  userId: string;
  email?: string;
  phone?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  channels?: ('email' | 'sms' | 'push')[];
  referenceType?: string;
  referenceId?: string;
}

export const notificationService = {
  providerRegistry: new ProviderRegistry(),

  /**
   * Send a notification through specified channels
   */
  async send(event: NotificationEvent): Promise<ProviderResult[]> {
    const results: ProviderResult[] = [];
    const channels = event.channels || ['email'];

    for (const channel of channels) {
      try {
        let payload: NotificationPayload;
        let providerName: string;

        switch (channel) {
          case 'email':
            if (!event.email) continue;
            payload = { to: event.email, subject: event.title, body: event.body, metadata: event.data };
            providerName = 'mock_email';
            break;
          case 'sms':
            if (!event.phone) continue;
            payload = { to: event.phone, body: event.body, metadata: event.data };
            providerName = 'mock_sms';
            break;
          case 'push':
            payload = { to: event.userId, body: event.body, subject: event.title, metadata: event.data };
            providerName = 'in_app_push';
            break;
          default:
            continue;
        }

        const provider = this.providerRegistry.getProvider(providerName);
        const result = await provider.send(payload);
        results.push(result);

        // Log notification for auditability
        await this.logNotification(event, channel, result);
      } catch (err: any) {
        results.push({
          success: false,
          provider: channel,
          error: err.message,
        });
      }
    }

    return results;
  },

  /**
   * Log notification to the database for audit trail
   */
  async logNotification(
    event: NotificationEvent,
    channel: string,
    result: ProviderResult
  ): Promise<void> {
    await prisma.domainEvent.create({
      data: {
        aggregateType: 'notification',
        aggregateId: event.userId,
        eventType: `notification.${channel}.${result.success ? 'sent' : 'failed'}`,
        eventData: {
          channel,
          type: event.type,
          title: event.title,
          body: event.body,
          to: channel === 'email' ? event.email : event.phone || event.userId,
          result,
        },
        producer: 'notification-service',
      },
    });
  },

  /**
   * Get notification history for a user
   */
  async getHistory(
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<any> {
    const [events, total] = await Promise.all([
      prisma.domainEvent.findMany({
        where: { aggregateId: userId, aggregateType: 'notification' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.domainEvent.count({
        where: { aggregateId: userId, aggregateType: 'notification' },
      }),
    ]);

    return {
      notifications: events.map(e => ({
        id: e.id,
        type: e.eventType,
        data: e.eventData,
        createdAt: e.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  },

  // ─── Notification Templates ──────────────────────────────────────────

  /**
   * Payment received notification
   */
  paymentReceived(userId: string, email: string | undefined, amount: number, bookingId: string): NotificationEvent {
    return {
      type: 'payment.received',
      userId,
      email,
      title: 'Payment Received',
      body: `Your payment of ZAR ${amount.toLocaleString()} for booking ${bookingId.slice(0, 8)} has been processed.`,
      channels: ['email', 'push'],
      referenceType: 'booking',
      referenceId: bookingId,
      data: { amount, bookingId },
    };
  },

  /**
   * Booking confirmed notification
   */
  bookingConfirmed(userId: string, email: string | undefined, vehicleName: string, bookingId: string): NotificationEvent {
    return {
      type: 'booking.confirmed',
      userId,
      email,
      title: 'Booking Confirmed',
      body: `Your booking for ${vehicleName} is confirmed! Booking ID: ${bookingId.slice(0, 8)}`,
      channels: ['email', 'push'],
      referenceType: 'booking',
      referenceId: bookingId,
      data: { vehicleName, bookingId },
    };
  },

  /**
   * Booking cancelled notification
   */
  bookingCancelled(userId: string, email: string | undefined, vehicleName: string, bookingId: string): NotificationEvent {
    return {
      type: 'booking.cancelled',
      userId,
      email,
      title: 'Booking Cancelled',
      body: `Your booking for ${vehicleName} has been cancelled.`,
      channels: ['email', 'push'],
      referenceType: 'booking',
      referenceId: bookingId,
      data: { vehicleName, bookingId },
    };
  },

  /**
   * Trust tier change notification
   */
  trustTierChanged(userId: string, email: string | undefined, newTier: string, oldTier: string): NotificationEvent {
    const isUpgrade = ['diamond', 'platinum', 'gold', 'silver'].indexOf(newTier) >
                     ['diamond', 'platinum', 'gold', 'silver'].indexOf(oldTier);
    return {
      type: 'trust.tier_changed',
      userId,
      email,
      title: `Trust Tier ${isUpgrade ? 'Upgraded' : 'Changed'}`,
      body: `Your WDR Trust tier has ${isUpgrade ? 'upgraded' : 'changed'} from ${oldTier} to ${newTier}!`,
      channels: ['email', 'push'],
      referenceType: 'trust',
      data: { newTier, oldTier, isUpgrade },
    };
  },

  /**
   * Deposit waiver approved notification
   */
  waiverApproved(userId: string, email: string | undefined, amount: number): NotificationEvent {
    return {
      type: 'trust.waiver_approved',
      userId,
      email,
      title: 'Deposit Waiver Approved',
      body: `Your deposit waiver of ZAR ${amount.toLocaleString()} has been approved. No deposit needed!`,
      channels: ['email', 'push'],
      referenceType: 'trust',
      data: { amount },
    };
  },

  /**
   * Payout processed notification
   */
  payoutProcessed(userId: string, email: string | undefined, amount: number, bookingId: string): NotificationEvent {
    return {
      type: 'payout.processed',
      userId,
      email,
      title: 'Payout Processed',
      body: `Your payout of ZAR ${amount.toLocaleString()} for booking ${bookingId.slice(0, 8)} has been processed.`,
      channels: ['email', 'push'],
      referenceType: 'booking',
      referenceId: bookingId,
      data: { amount, bookingId },
    };
  },

  /**
   * Telemetry alert notification
   */
  telemetryAlert(userId: string, email: string | undefined, phone: string | undefined, alertType: string, severity: string, message: string): NotificationEvent {
    return {
      type: `telemetry.${alertType}`,
      userId,
      email,
      phone,
      title: `${severity.toUpperCase()} Alert: ${alertType.replace('_', ' ')}`,
      body: message,
      channels: severity === 'critical' ? ['sms', 'email', 'push'] : ['email', 'push'],
      referenceType: 'telemetry',
      data: { alertType, severity },
    };
  },
};