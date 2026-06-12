import { Router } from 'express';
import { bookingService } from '../services/booking-service';
import { InsuranceTier } from '@wdr/shared-types';

const router = Router();

/**
 * POST /bookings/quote
 * Get price quote
 */
router.post('/quote', async (req, res, next) => {
  try {
    const { vehicleId, startTime, endTime, insuranceTier, isDelivery, promoCode } = req.body;
    const userId = (req as any).user?.sub;

    const quote = await bookingService.createQuote({
      userId,
      vehicleId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      insuranceTier: insuranceTier as InsuranceTier,
      isDelivery,
      promoCode,
    });

    res.json({ data: quote });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /bookings
 * Create booking
 */
router.post('/', async (req, res, next) => {
  try {
    const { vehicleId, startTime, endTime, insuranceTier, isDelivery, promoCode } = req.body;
    const userId = (req as any).user?.sub;

    const booking = await bookingService.createBooking({
      userId,
      vehicleId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      insuranceTier: insuranceTier as InsuranceTier,
      isDelivery,
      promoCode,
    });

    res.status(201).json({ data: booking });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /bookings/:id/confirm
 */
router.post('/:id/confirm', async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await bookingService.confirmBooking(id);
    res.json({ data: booking });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /bookings/:id/checkin
 */
router.post('/:id/checkin', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { selfieUrl, odometerReading, fuelLevel, damagePhotos, devicePaired } = req.body;
    const booking = await bookingService.checkIn(id, {
      selfieUrl,
      odometerReading,
      fuelLevel,
      damagePhotos,
      devicePaired,
    });
    res.json({ data: booking });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /bookings/:id/checkout
 */
router.post('/:id/checkout', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { odometerReading, fuelLevel, damagePhotos, isDamaged, damageNotes } = req.body;
    const booking = await bookingService.checkOut(id, {
      odometerReading,
      fuelLevel,
      damagePhotos,
      isDamaged,
      damageNotes,
    });
    res.json({ data: booking });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /bookings/:id/extend
 */
router.post('/:id/extend', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newEndTime } = req.body;
    const booking = await bookingService.extendBooking(id, new Date(newEndTime));
    res.json({ data: booking });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /bookings/:id/cancel
 */
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const booking = await bookingService.cancelBooking(id, reason);
    res.json({ data: booking });
  } catch (error) {
    next(error);
  }
});

export default router;
