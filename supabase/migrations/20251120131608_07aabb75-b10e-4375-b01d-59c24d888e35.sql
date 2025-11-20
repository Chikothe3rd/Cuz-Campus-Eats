-- Add location tracking columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS runner_lat numeric,
ADD COLUMN IF NOT EXISTS runner_lng numeric,
ADD COLUMN IF NOT EXISTS last_location_update timestamp with time zone;

-- Add index for real-time queries
CREATE INDEX IF NOT EXISTS idx_orders_runner_location ON orders(runner_id, last_location_update) 
WHERE runner_id IS NOT NULL;