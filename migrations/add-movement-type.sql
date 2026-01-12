-- Adicionar campo movement_type à tabela cash_flow_entries
-- Para suportar os tipos de movimentação do sistema brasileiro

ALTER TABLE cash_flow_entries 
ADD COLUMN IF NOT EXISTS movement_type TEXT NOT NULL DEFAULT 'normal';

-- Adicionar comentário para documentar os valores possíveis
COMMENT ON COLUMN cash_flow_entries.movement_type IS 'Tipo de movimentação: normal, balance_adjustment, withdrawal, initial_balance';

-- Opcional: Adicionar check constraint para validar valores
ALTER TABLE cash_flow_entries 
ADD CONSTRAINT check_movement_type 
CHECK (movement_type IN ('normal', 'balance_adjustment', 'withdrawal', 'initial_balance'));
