-- ============================================================
-- ADICIONAR EVENT_ID PARA DEDUPLICAÇÃO FB CAPI
-- ============================================================

ALTER TABLE lt_events ADD COLUMN IF NOT EXISTS event_id varchar(64);

COMMENT ON COLUMN lt_events.event_id IS 'LeadTrack: ID único do evento para deduplicação entre Browser e Servidor (FB CAPI)';

-- Índice para busca rápida de deduplicação
CREATE INDEX IF NOT EXISTS idx_lt_events_event_id ON lt_events (event_id);
