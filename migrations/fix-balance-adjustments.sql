-- Drop the problematic balance_adjustments table and recreate it properly
DROP TABLE IF EXISTS balance_adjustments;

-- Create balance adjustments table for daily balance management
CREATE TABLE IF NOT EXISTS balance_adjustments (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    balance_type TEXT NOT NULL CHECK (balance_type IN ('initial', 'final')),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    account TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    user_id VARCHAR(255) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_balance_adjustments_date ON balance_adjustments(date);
CREATE INDEX IF NOT EXISTS idx_balance_adjustments_type ON balance_adjustments(balance_type);
CREATE INDEX IF NOT EXISTS idx_balance_adjustments_user ON balance_adjustments(user_id);
