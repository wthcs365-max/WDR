import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { invoiceService } from '../services/invoice-service';

const router = Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.page_size as string) || 20;
    const result = await invoiceService.listInvoices(req.user!.sub, page, pageSize);
    res.json({ data: result.invoices, meta: { page, page_size: pageSize, total: result.total } });
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const invoice = await invoiceService.getInvoice(req.params.id);
    res.json({ data: invoice });
  } catch (err) { next(err); }
});

export default router;