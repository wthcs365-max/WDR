// ============================================================================
// Ledger Service — Wallet Service
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { WalletResponse } from '@wdr/shared-types';

const prisma = new PrismaClient();

function toWalletResponse(wallet: any): WalletResponse {
  return {
    id: wallet.id,
    userId: wallet.userId,
    balanceZar: Number(wallet.balanceZar),
    availableBalance: Number(wallet.availableBalance),
    holdBalance: Number(wallet.holdBalance),
    currency: wallet.currency,
    isFrozen: wallet.isFrozen,
  };
}

export const walletService = {
  async getWallet(userId: string): Promise<WalletResponse> {
    let wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId } });
    }
    return toWalletResponse(wallet);
  },

  async getWalletById(id: string): Promise<WalletResponse> {
    const wallet = await prisma.wallet.findUnique({ where: { id } });
    if (!wallet) throw new Error('Wallet not found');
    return toWalletResponse(wallet);
  },

  async freezeWallet(id: string): Promise<WalletResponse> {
    const wallet = await prisma.wallet.update({
      where: { id },
      data: { isFrozen: true },
    });
    return toWalletResponse(wallet);
  },

  async unfreezeWallet(id: string): Promise<WalletResponse> {
    const wallet = await prisma.wallet.update({
      where: { id },
      data: { isFrozen: false },
    });
    return toWalletResponse(wallet);
  },

  async topUp(userId: string, amountZar: number): Promise<WalletResponse> {
    const wallet = await this.getWallet(userId);
    if (wallet.isFrozen) throw new Error('Wallet is frozen');

    const updated = await prisma.wallet.update({
      where: { userId },
      data: {
        balanceZar: { increment: amountZar },
        availableBalance: { increment: amountZar },
      },
    });
    return toWalletResponse(updated);
  },

  async holdFunds(userId: string, amountZar: number): Promise<void> {
    await prisma.wallet.update({
      where: { userId },
      data: {
        availableBalance: { decrement: amountZar },
        holdBalance: { increment: amountZar },
      },
    });
  },

  async releaseHold(userId: string, amountZar: number): Promise<void> {
    await prisma.wallet.update({
      where: { userId },
      data: {
        availableBalance: { increment: amountZar },
        holdBalance: { decrement: amountZar },
      },
    });
  },

  async debit(userId: string, amountZar: number): Promise<void> {
    const wallet = await this.getWallet(userId);
    if (wallet.isFrozen) throw new Error('Wallet is frozen');
    if (wallet.availableBalance < amountZar) throw new Error('Insufficient available balance');

    await prisma.wallet.update({
      where: { userId },
      data: {
        balanceZar: { decrement: amountZar },
        availableBalance: { decrement: amountZar },
      },
    });
  },

  async credit(userId: string, amountZar: number): Promise<void> {
    await prisma.wallet.update({
      where: { userId },
      data: {
        balanceZar: { increment: amountZar },
        availableBalance: { increment: amountZar },
      },
    });
  },
};