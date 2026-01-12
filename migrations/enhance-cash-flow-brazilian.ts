-- Migration: Add Brazilian cash flow system fields
-- Add comprehensive fields for proper Brazilian cash flow management

-- Add new columns to cash_flow_entries table
ALTER TABLE cash_flow_entries 
ADD COLUMN competence_date DATE,
ADD COLUMN subcategory_id VARCHAR(255) REFERENCES categories(id),
ADD COLUMN gross_amount DECIMAL(10,2),
ADD COLUMN fees DECIMAL(10,2),
ADD COLUMN document TEXT,
ADD COLUMN cost_center TEXT,
ADD COLUMN recurrence TEXT,
ADD COLUMN due_date DATE,
ADD COLUMN actual_date DATE;

-- Update payment method to be NOT NULL with default
ALTER TABLE cash_flow_entries 
ALTER COLUMN payment_method SET NOT NULL,
ALTER COLUMN payment_method SET DEFAULT 'money';

-- Update status to include 'overdue'
ALTER TABLE cash_flow_entries 
ALTER COLUMN status SET NOT NULL,
ALTER COLUMN status SET DEFAULT 'confirmed';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_competence_date ON cash_flow_entries(competence_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_due_date ON cash_flow_entries(due_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_actual_date ON cash_flow_entries(actual_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_cost_center ON cash_flow_entries(cost_center);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_recurrence ON cash_flow_entries(recurrence);

-- Add check constraints for payment methods
ALTER TABLE cash_flow_entries 
ADD CONSTRAINT chk_payment_method 
CHECK (payment_method IN ('money', 'pix', 'credit_card', 'debit_card', 'boleto', 'transfer'));

-- Add check constraints for status
ALTER TABLE cash_flow_entries 
ADD CONSTRAINT chk_status 
CHECK (status IN ('confirmed', 'pending', 'overdue'));

-- Add check constraints for recurrence
ALTER TABLE cash_flow_entries 
ADD CONSTRAINT chk_recurrence 
CHECK (recurrence IN ('monthly', 'weekly', 'none', NULL));

-- Add check constraint for amounts (gross should be >= net + fees when present)
ALTER TABLE cash_flow_entries 
ADD CONSTRAINT chk_amounts 
CHECK (
  (gross_amount IS NULL AND fees IS NULL) OR 
  (gross_amount >= amount + COALESCE(fees, 0))
);
