-- ============================================================
-- GATILHO PARA DISPARAR FACEBOOK CAPI (SERVER-SIDE)
-- Toda vez que um evento for inserido, o banco avisa o Despachante
-- ============================================================

-- 1. Habilitar a extensão de rede (se não estiver)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Função que chama a Edge Function via HTTP POST
CREATE OR REPLACE FUNCTION public.lt_fn_trigger_fb_dispatcher()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Dispara a Edge Function de forma assíncrona (não trava o banco)
  PERFORM net.http_post(
    url := 'https://zvxttgsilqqcmpuzgcoy.supabase.co/functions/v1/fb-dispatcher',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  
  RETURN NEW;
END;
$$;

-- 3. O Gatilho propriamente dito
DROP TRIGGER IF EXISTS tr_lt_dispatch_fb ON public.lt_events;

CREATE TRIGGER tr_lt_dispatch_fb
AFTER INSERT ON public.lt_events
FOR EACH ROW
WHEN (NEW.fb_dispatched = false) -- Só dispara se ainda não foi enviado
EXECUTE FUNCTION public.lt_fn_trigger_fb_dispatcher();

COMMENT ON FUNCTION public.lt_fn_trigger_fb_dispatcher IS 'LeadTrack: Gatilho que envia novos eventos para a Edge Function de CAPI do Facebook.';
