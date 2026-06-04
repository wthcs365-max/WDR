// ============================================================================
// Ledger Service — Invoice Service
// Manages invoice generation with VAT, line items, and numbering
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { InvoiceResponse, InvoiceLineItem } from '@wdr/shared-types';
import { config } from '../config';

const prisma = new PrismaClient();

let invoiceCounter = 1000;

function generateInvoiceNumber(): string {
  invoiceCounter++;
  const date = new Date();
  return `WDR-INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${String(invoiceCounter).padStart(6, '0')}`;
}

function toInvoiceResponse(inv: any): InvoiceResponse {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    invoiceType: inv.invoiceType,
    lineItems: inv.lineItems as InvoiceLineItem[],
    subtotalZar: Number(inv.subtotalZar),
    vatZar: Number(inv.vatZar || 0),
    totalZar: Number(inv.totalZar),
    status: inv.status,
    dueDate: inv.dueDate?.toISOString() || null,
    pdfUrl: inv.pdfUrl,
    createdAt: inv.createdAt.toISOString(),
  };
}

export const invoiceService = {
  /**
   * Generate an invoice with line items and VAT
   */
  async generateInvoice(
    userId: string,
    invoiceType: string,
    lineItems: InvoiceLineItem[],
    referenceType?: string,
    referenceId?: string
  ): Promise<InvoiceResponse> {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const vat = lineItems.reduce((sum, item) => sum + item.total * item.vatRate, 0);
    const total = subtotal + vat;

    const invoice = await prisma.invoice.create({
      data: {
        userId,
        invoiceType,
        referenceType,
        referenceId,
        invoiceNumber: generateInvoiceNumber(),
        lineItems: lineItems as any,
        subtotalZar: Math.round(subtotal * 100) / 100,
        vatZar: Math.round(vat * 100) / 100,
        totalZar: Math.round(total * 100) / 100,
        status: 'draft',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Net 30
      },
    });

    return toInvoiceResponse(invoice);
  },

  /**
   * List invoices for a user
   */
  async listInvoices(
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ invoices: InvoiceResponse[]; total: number }> {
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where: { userId } }),
    ]);

    return {
      invoices: invoices.map(toInvoiceResponse),
      total,
    };
  },

  /**
   * Get invoice by ID
   */
  async getInvoice(id: string): Promise<InvoiceResponse> {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error('Invoice not found');
    return toInvoiceResponse(invoice);
  },

  /**
   * Mark invoice as paid
   */
  async markAsPaid(id: string): Promise<InvoiceResponse> {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date() },
    });
    return toInvoiceResponse(invoice);
  },
};