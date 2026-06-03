// ============================================================================
// IAM Service — KYC Service
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { VerificationStatus } from '@wdr/shared-types';

const prisma = new PrismaClient();

export const kycService = {
  /**
   * Submit a KYC document
   */
  async uploadDocument(
    userId: string,
    documentType: string,
    documentUrl: string
  ): Promise<any> {
    return prisma.kycVerification.create({
      data: {
        userId,
        documentType,
        documentUrl,
        verificationStatus: VerificationStatus.PENDING,
      },
    });
  },

  /**
   * List user's KYC documents
   */
  async listDocuments(userId: string): Promise<any[]> {
    return prisma.kycVerification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Approve a KYC document (admin)
   */
  async approveDocument(documentId: string, verifiedBy: string): Promise<any> {
    return prisma.kycVerification.update({
      where: { id: documentId },
      data: {
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedBy,
        verifiedAt: new Date(),
      },
    });
  },

  /**
   * Reject a KYC document (admin)
   */
  async rejectDocument(documentId: string, verifiedBy: string, reason: string): Promise<any> {
    return prisma.kycVerification.update({
      where: { id: documentId },
      data: {
        verificationStatus: VerificationStatus.REJECTED,
        verifiedBy,
        verifiedAt: new Date(),
        rejectionReason: reason,
      },
    });
  },

  /**
   * Get pending KYC documents (admin)
   */
  async getPendingVerifications(page: number = 1, pageSize: number = 20): Promise<any> {
    const [documents, total] = await Promise.all([
      prisma.kycVerification.findMany({
        where: { verificationStatus: VerificationStatus.PENDING },
        include: { user: { select: { id: true, email: true, fullName: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.kycVerification.count({
        where: { verificationStatus: VerificationStatus.PENDING },
      }),
    ]);

    return { documents, total };
  },
};