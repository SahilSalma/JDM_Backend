import { Request, Response, NextFunction } from 'express';
import {
  getShippingZones,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  getShippingRate,
  type ShippingType,
} from '../services/shippingService';

const VALID_TYPES: ShippingType[] = ['forklift', 'no_forklift', 'liftgate', 'residential_delivery'];

export async function listZones(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const zones = await getShippingZones();
    res.json({ success: true, data: zones });
  } catch (err) {
    next(err);
  }
}

export async function createZone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { state_code, city, zone_type, rate_cents, is_active } = req.body;
    const zone = await createShippingZone({
      state_code: state_code || null,
      city: city || null,
      zone_type,
      rate_cents,
      is_active: is_active ?? true,
    });
    res.status(201).json({ success: true, data: zone });
  } catch (err) {
    next(err);
  }
}

export async function updateZone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const zone = await updateShippingZone(id, req.body);
    res.json({ success: true, data: zone });
  } catch (err) {
    next(err);
  }
}

export async function removeZone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    await deleteShippingZone(id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getRate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const type = String(req.query.type || 'no_forklift') as ShippingType;
    const state = req.query.state ? String(req.query.state) : undefined;
    const city = req.query.city ? String(req.query.city) : undefined;

    if (!VALID_TYPES.includes(type)) {
      res.status(400).json({ success: false, error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
      return;
    }

    const rate_cents = await getShippingRate(type, state, city);
    res.json({ success: true, data: { rate_cents, type } });
  } catch (err) {
    next(err);
  }
}

export async function getAllRates(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const state = req.query.state ? String(req.query.state) : undefined;
    const city = req.query.city ? String(req.query.city) : undefined;

    const [forklift, no_forklift, liftgate, residential_delivery] = await Promise.all([
      getShippingRate('forklift', state, city),
      getShippingRate('no_forklift', state, city),
      getShippingRate('liftgate', state, city),
      getShippingRate('residential_delivery', state, city),
    ]);

    res.json({
      success: true,
      data: {
        forklift,
        no_forklift,
        liftgate,
        residential_delivery,
      },
    });
  } catch (err) {
    next(err);
  }
}
