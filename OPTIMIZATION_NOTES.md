# Database Optimization Notes

This document contains recommended database indexes to improve dashboard query performance.

## Overview

The admin panel dashboard makes several queries that would benefit from proper indexing. These indexes are based on the actual queries used in the application.

## Main Database (Laravel Database)

The main database contains `franchise_requests` and `support_tickets` tables.

### Recommended Indexes

```sql
-- Index for franchise_requests table
-- Used by: /api/admin/analytics (batched status queries)
CREATE INDEX idx_franchise_requests_status ON franchise_requests(status);

-- Composite index for zone-based franchise queries
-- Used by: /api/franchise/stats (plan lookup by zone)
CREATE INDEX idx_franchise_requests_zone_status ON franchise_requests(zone_id, status);

-- Index for support tickets status queries
-- Used by: /api/admin/analytics (pending/replied tickets count)
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
```

### Impact Analysis

- **idx_franchise_requests_status**: Speeds up the batched count query in analytics endpoint (3 counts combined into 1 query with CASE statements)
- **idx_franchise_requests_zone_status**: Optimizes franchise plan lookup by zone for revenue calculations
- **idx_support_tickets_status**: Improves support ticket counting performance

## Franchise Database (Read-Only Database)

The franchise database contains `orders`, `order_transactions`, `stores`, and related tables.

### Recommended Indexes

```sql
-- Index for orders by zone and status
-- Used by: /api/franchise/stats (active orders count, delivered orders)
CREATE INDEX idx_orders_zone_status ON orders(zone_id, order_status);

-- Composite index for date-based queries
-- Used by: /api/franchise/stats (today's payout calculation)
CREATE INDEX idx_orders_zone_created ON orders(zone_id, created_at, order_status);

-- Index for order_transactions zone queries
-- Used by: /api/franchise/stats (admin commission calculations)
CREATE INDEX idx_order_transactions_zone ON order_transactions(zone_id);

-- Index for JOIN operations
-- Used by: Revenue calculations across orders and transactions
CREATE INDEX idx_order_transactions_order_id ON order_transactions(order_id);

-- Index for stores by zone
-- Used by: /api/franchise/vendors (vendor listing by zone)
CREATE INDEX idx_stores_zone_id ON stores(zone_id);
```

### Impact Analysis

- **idx_orders_zone_status**: Major performance improvement for active/delivered order counts per zone
- **idx_orders_zone_created**: Significantly speeds up today's payout calculation (uses DATE function on created_at)
- **idx_order_transactions_zone**: Optimizes revenue aggregation queries
- **idx_order_transactions_order_id**: Improves JOIN performance between orders and order_transactions
- **idx_stores_zone_id**: Faster vendor/store listing for franchise zones

## Query-Specific Optimizations

### Analytics Revenue Calculation

**Current Query:**
```sql
SELECT 
    SUM(ot.admin_commission) as totalAdminCommission,
    COUNT(DISTINCT o.id) as totalDeliveredOrders
FROM orders o
INNER JOIN order_transactions ot ON o.id = ot.order_id
WHERE o.order_status = 'delivered'
```

**Optimization**: With the recommended indexes, this query will benefit from:
- Index on `order_status` column
- Index on `order_id` for faster JOINs

### Franchise Stats Calculation

**Current Query:**
```sql
SELECT 
    SUM(ot.admin_commission) as totalAdminCommission, 
    COUNT(DISTINCT o.id) as deliveredOrders 
FROM orders o
INNER JOIN order_transactions ot ON o.id = ot.order_id
WHERE o.zone_id = ? AND o.order_status = 'delivered'
```

**Optimization**: With composite index `idx_orders_zone_status`, this query can efficiently filter by zone and status before performing the JOIN.

### Today's Payout Query

**Current Query:**
```sql
SELECT 
    SUM(ot.admin_commission) as todaysAdminCommission, 
    COUNT(DISTINCT o.id) as ordersToday 
FROM orders o
INNER JOIN order_transactions ot ON o.id = ot.order_id
WHERE ot.zone_id = ? AND o.order_status = 'delivered' AND DATE(o.created_at) = ?
```

**Optimization**: With `idx_orders_zone_created`, this query can efficiently use the zone + date range for filtering.

## Implementation Steps

1. **Backup Database**: Always backup before creating indexes
   ```bash
   mysqldump -u username -p database_name > backup.sql
   ```

2. **Apply Indexes**: Run the index creation statements during low-traffic period

3. **Verify Index Usage**: Use EXPLAIN to confirm indexes are being used
   ```sql
   EXPLAIN SELECT ... (your query here)
   ```

4. **Monitor Performance**: Track query execution time before and after

## Expected Performance Improvements

Based on typical scenarios:

- **Analytics Endpoint**: 40-60% faster (combined with query batching)
- **Franchise Stats**: 50-70% faster (especially with large order volumes)
- **Vendor Listing**: 30-50% faster
- **Overall Dashboard Load**: 2-3x faster (combined with caching)

## Maintenance

- **Rebuild Indexes**: Periodically rebuild indexes for optimal performance
  ```sql
  OPTIMIZE TABLE orders;
  OPTIMIZE TABLE order_transactions;
  OPTIMIZE TABLE franchise_requests;
  ```

- **Monitor Index Size**: Check index sizes don't grow excessively
  ```sql
  SELECT 
    table_name, 
    index_name, 
    ROUND(stat_value * @@innodb_page_size / 1024 / 1024, 2) as size_mb
  FROM mysql.innodb_index_stats
  WHERE stat_name = 'size';
  ```

## Notes

- These indexes are read-optimized. If there are heavy write operations, consider the trade-off between read and write performance.
- Composite indexes should be ordered based on query patterns (most selective column first).
- Monitor database size increase after adding indexes (typically 10-20% for these indexes).
