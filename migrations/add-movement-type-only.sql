-- Adicionar campo movement_type à tabela cash_flow_entries existente
ALTER TABLE cash_flow_entries 
ADD COLUMN IF NOT EXISTS movement_type TEXT DEFAULT 'normal';

-- Adicionar comentário para documentar os valores possíveis
COMMENT ON COLUMN cash_flow_entries.movement_type IS 'Tipo de movimentação: normal, balance_adjustment, withdrawal, initial_balance';
