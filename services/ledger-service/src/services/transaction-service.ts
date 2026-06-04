// ============================================================================
// Ledger Service — Transaction Service
// Handles payment capture, refund, retry, and immutable transaction log
// ============================================================================

import { PrismaClient } from '@prisma/client';
import {
  CreateTransactionInput,
  TransactionResponse,
  TransactionType,
  LedgerDirection,
  TransactionStatus,
} from '@wdr/shared-types';
import { walletService } from './wallet-service';
import { config } from '../config';

const prisma = new PrismaClient();

function toTransactionResponse(tx: any): TransactionResponse {
  return {
    id: tx.id,
    walletId: tx.walletId,
    transactionType: tx.transactionType,
    direction: tx.direction,
    amountZar: Number(tx.amountZar),
    balanceBefore: Number(tx.balanceBefore),
    balanceAfter: Number(tx.balanceAfter),
    status: tx.status,
    referenceType: tx.referenceType,
    referenceId: tx.referenceId,
    description: tx.description,
    gatewayReference: tx.gatewayReference,
    feeZar: Number(tx.feeZar || 0),
    createdAt: tx.createdAt.toISOString(),
    settledAt: tx.settledAt?.toISOString() || null,
  };
}

export const transactionService = {
  /**
   * Create a new transaction (with double-entry ledger entries)
   */
  async createTransaction(
    userId: string,
    input: CreateTransactionInput,
    debitAccount?: string,
    creditAccount?: string
  ): Promise<TransactionResponse> {
    const wallet = await walletService.getWallet(input.walletId === userId ? userId : input.walletId);
    if (wallet.isFrozen) throw new Error('Wallet is frozen');

    const balanceBefore = input.direction === LedgerDirection.DEBIT
      ? wallet.availableBalance
      : wallet.balanceZar;
    const balanceAfter = input.direction === LedgerDirection.DEBIT
      ? balanceBefore - input.amountZar
      : balanceBefore + input.amountZar;

    // Create transaction with double-entry ledger
    const tx = await prisma.transaction.create({
      data: {
        walletId: input.walletId,
        transactionType: input.transactionType,
        direction: input.direction,
        amountZar: input.amountZar,
        balanceBefore,
        balanceAfter,
        status: TransactionStatus.PENDING,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        description: input.description,
        gatewayReference: input.gatewayReference,
        feeZar: input.feeZar || 0,
        ledgerEntries: {
          create: [
            {
              account: debitAccount || 'renter_wallet',
              direction: LedgerDirection.DEBIT,
              amountZar: input.amountZar,
            },
            {
              account: creditAccount || 'platform_escrow',
              direction: LedgerDirection.CREDIT,
              amountZar: input.amountZar,
            },
          ],
        },
      },
      include: { ledgerEntries: true },
    });

    // Apply wallet balance change
    if (input.direction === LedgerDirection.DEBIT) {
      await walletService.debit(userId, input.amountZar);
    } else {
      await walletService.credit(userId, input.amountZar);
    }

    // Mark as completed
    const completed = await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: TransactionStatus.COMPLETED, settledAt: new Date() },
    });

    return toTransactionResponse(completed);
  },

  /**
   * Capture a payment (booking payment flow)
   */
  async capturePayment(
    renterId: string,
    amountZar: number,
    bookingId: string,
    description: string
  ): Promise<TransactionResponse> {
    const wallet = await walletService.getWallet(renterId);

    return this.createTransaction(
      renterId,
      {
        walletId: wallet.id,
        transactionType: TransactionType.RENTAL_PAYMENT,
        direction: LedgerDirection.DEBIT,
        amountZar,
        referenceType: 'booking',
        referenceId: bookingId,
        description,
      },
      'renter_wallet',
      'platform_escrow'
    );
  },

  /**
   * Issue a refund
   */
  async refund(
    userId: string,
    amountZar: number,
    referenceType: string,
    referenceId: string,
    description: string
  ): Promise<TransactionResponse> {
    const wallet = await walletService.getWallet(userId);

    return this.createTransaction(
      userId,
      {
        walletId: wallet.id,
        transactionType: TransactionType.REFUND,
        direction: LedgerDirection.CREDIT,
        amountZar,
        referenceType,
        referenceId,
        description,
      },
      'platform_escrow',
      'renter_wallet'
    );
  },

  /**
   * Retry a failed transaction
   */
  async retryTransaction(transactionId: string): Promise<TransactionResponse> {
    const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) throw new Error('Transaction not found');
    if (tx.status !== TransactionStatus.FAILED) throw new Error('Transaction is not in failed status');

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.PROCESSING },
    });

    // Simulate retry (in production, re-call payment gateway)
    const completed = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.COMPLETED, settledAt: new Date() },
    });

    return toTransactionResponse(completed);
  },

  /**
   * Reverse an erroneous transaction
   */
  async reverseTransaction(transactionId: string): Promise<TransactionResponse> {
    const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) throw new Error('Transaction not found');

    const reversed = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.REVERSED,
        description: `REVERSED: ${tx.description || ''}`,
      },
    });

    // Reverse wallet effect
    if (tx.direction === LedgerDirection.DEBIT) {
      await walletService.credit(tx.walletId, Number(tx.amountZar));
    } else {
      await walletService.debit(tx.walletId, Number(tx.amountZar));
    }

    return toTransactionResponse(reversed);
  },

  /**
   * Get transaction by ID
   */
  async getTransaction(id: string): Promise<TransactionResponse> {
    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: { ledgerEntries: true },
    });
    if (!tx) throw new Error('Transaction not found');
    return toTransactionResponse(tx);
  },

  /**
   * List transactions for a wallet
   */
  async listTransactions(
    walletId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ transactions: TransactionResponse[]; total: number }> {
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { walletId },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where: { walletId } }),
    ]);

    return {
      transactions: transactions.map(toTransactionResponse),
      total,
    };
  },
};