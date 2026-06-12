import { BookingStatus } from '@wdr/shared-types';

export interface StateTransition {
  from: BookingStatus | BookingStatus[];
  to: BookingStatus;
  trigger: string;
}

export const VALID_TRANSITIONS: StateTransition[] = [
  { from: BookingStatus.QUOTE, to: BookingStatus.PENDING_CONFIRMATION, trigger: 'submit_booking' },
  { from: BookingStatus.PENDING_CONFIRMATION, to: BookingStatus.CONFIRMED, trigger: 'owner_accept' },
  { from: BookingStatus.PENDING_CONFIRMATION, to: BookingStatus.CANCELLED, trigger: 'owner_reject' },
  { from: BookingStatus.PENDING_CONFIRMATION, to: BookingStatus.CANCELLED, trigger: 'timeout' },
  { from: BookingStatus.CONFIRMED, to: BookingStatus.ACTIVE, trigger: 'check_in' },
  { from: BookingStatus.CONFIRMED, to: BookingStatus.CANCELLED, trigger: 'renter_cancel' },
  { from: BookingStatus.ACTIVE, to: BookingStatus.EXTENDED, trigger: 'extension_approved' },
  { from: BookingStatus.ACTIVE, to: BookingStatus.COMPLETED, trigger: 'check_out' },
  { from: BookingStatus.ACTIVE, to: BookingStatus.CANCELLED, trigger: 'admin_cancel' },
  { from: BookingStatus.EXTENDED, to: BookingStatus.COMPLETED, trigger: 'check_out' },
  { from: BookingStatus.COMPLETED, to: BookingStatus.DISPUTED, trigger: 'file_claim' },
];

export function isValidTransition(from: BookingStatus, to: BookingStatus): boolean {
  return VALID_TRANSITIONS.some(t => {
    if (Array.isArray(t.from)) {
      return t.from.includes(from) && t.to === to;
    }
    return t.from === from && t.to === to;
  });
}
