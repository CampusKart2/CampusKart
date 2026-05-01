-- T-79: Track buyer and sold timestamp on listings.
-- These two columns are required to query pending review prompts 24 h after
-- a listing is marked sold.

-- Add sold_at: populated when status transitions to 'sold'.
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;

-- Add buyer_id: the user who bought the item (set by the seller when marking sold).
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_listings_buyer_id ON listings (buyer_id);
CREATE INDEX IF NOT EXISTS idx_listings_sold_at  ON listings (sold_at);
