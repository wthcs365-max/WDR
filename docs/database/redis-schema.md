# WTH Drive Rentals — Redis Schema & Caching Strategy

## Key Patterns
All keys follow: `wdr:{domain}:{entity}:{id}:{field}`

## Session & Auth Cache
```
wdr:session:{token_hash} → { user_id, role, permissions, expires_at } TTL: 3600s
wdr:otp:{phone} → { code, attempts, expires_at } TTL: 300s
wdr:rate_limit:{endpoint}:{user_id}:{window} → { count } TTL: window duration
```

## Vehicle Cache (Hot Inventory)
```
wdr:vehicle:{id} → { id, model, year, daily_rate, deposit, status, location... } TTL: 300s
wdr:vehicle:{id}:availability → { next_available, booked_dates[] } TTL: 60s
wdr:vehicle:geo:{city}:{lat}:{lng} → Set of vehicle IDs TTL: 120s
wdr:vehicle:top_picks → Sorted Set (score = rating * bookings)
```

## User & Trust Cache
```
wdr:user:{id}:profile → { id, name, trust_tier, score, waiver_eligible } TTL: 600s
wdr:user:{id}:active_booking → { booking_id, vehicle_id, status } TTL: 60s
```

## Pricing & Promotion Cache
```
wdr:pricing:vehicle:{id}:{start}:{end} → { base_rate, discounts, final_total } TTL: 300s
wdr:promo:{code} → { type, discount, expiry, usage } TTL: remainder of promo
```

## Real-time Telematics Streams
```
Stream: wdr:telemetry:raw — device_id, vehicle_id, event_type, lat, lng, speed
Stream: wdr:telemetry:alerts — vehicle_id, alert_type, severity, details
Consumers: telemetry-processor, tracking-consumer, analytics-consumer
```

## Distributed Locking
```
wdr:lock:booking:{vehicle_id}:{timeslot} TTL: 10s
wdr:lock:payment:{user_id}:{booking_id} TTL: 30s
```

## Memory Sizing: ~1.5GB (comfortable on 4GB Redis instance)
- Vehicle cache (20k vehicles): ~500MB
- Active sessions (50k concurrent): ~250MB
- Telematics stream buffer: ~500MB
- Geo indexes: ~100MB
- Other: ~150MB

## HA: Redis Cluster (3 master + 3 replica) + Sentinel, AOF fsync=everysec