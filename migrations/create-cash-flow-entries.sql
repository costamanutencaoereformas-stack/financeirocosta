-- Create cash flow entries table for manual cash flow movements
CREATE TABLE IF NOT EXISTS cash_flow_entries (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    description TEXT NOT NULL,
    category_id VARCHAR(255) REFERENCES categories(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    account TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    user_id VARCHAR(255) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_date ON cash_flow_entries(date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_type ON cash_flow_entries(type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_user ON cash_flow_entries(user_id);
