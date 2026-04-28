import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Receber os dados do gatilho (INSERT na lt_events)
    const { record } = await req.json()
    console.log(`[FB-Dispatcher] Processando evento ID: ${record.id}, tipo: ${record.event_type}`)

    // 2. Buscar detalhes do lead e credenciais da empresa
    const { data: event, error: eventError } = await supabase
      .from('lt_events')
      .select(`
        *,
        lt_leads (*),
        lt_companies (fb_pixel_id, fb_access_token, fb_test_event_code)
      `)
      .eq('id', record.id)
      .single()

    if (eventError || !event) throw new Error(`Erro ao buscar evento: ${eventError?.message}`)
    
    const company = event.lt_companies
    const lead = event.lt_leads

    if (!company.fb_pixel_id || !company.fb_access_token) {
      console.log(`[FB-Dispatcher] Empresa ${event.company_id} sem credenciais de Pixel. Pulando.`)
      return new Response(JSON.stringify({ ok: false, msg: 'No credentials' }), { headers: corsHeaders })
    }

    // 3. Preparar Hashing (Privacidade Meta)
    const hash = async (text: string) => {
      if (!text) return null;
      const msgUint8 = new TextEncoder().encode(text.trim().toLowerCase());
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
      return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    // Mapeamento de nomes de eventos p/ Facebook
    const fbEventNames: Record<string, string> = {
      'pageview': 'PageView',
      'click': 'Click',
      'form_submit': 'Lead',
      'begin_checkout': 'InitiateCheckout',
      'purchase': 'Purchase',
      'scroll': 'Scroll', // Custom
      'exit_intent': 'ExitIntent' // Custom
    }

    // 4. Montar Payload CAPI
    const userData = {
      em: await hash(lead.email),
      ph: await hash(lead.phone),
      fn: await hash(lead.first_name),
      ln: await hash(lead.last_name),
      ct: await hash(lead.city),
      st: await hash(lead.state),
      country: await hash(lead.country),
      client_ip_address: event.ip_address || lead.ip_address,
      client_user_agent: lead.user_agent,
      fbp: event.metadata?.fbp || lead.fbp,
      fbc: event.metadata?.fbc || lead.fbc,
    }

    const eventData = {
      event_name: fbEventNames[event.event_type] || event.event_type,
      event_time: Math.floor(new Date(event.event_at).getTime() / 1000),
      event_id: event.event_id, // CRÍTICO para Deduplicação
      event_source_url: event.page_url,
      action_source: 'website',
      user_data: userData,
      custom_data: {
        value: event.event_value ? parseFloat(event.event_value) : undefined,
        currency: event.event_value ? 'BRL' : undefined,
        ...event.metadata
      }
    }

    // 5. Enviar para o Meta
    const pixelId = company.fb_pixel_id
    const accessToken = company.fb_access_token
    const url = `https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`

    const fbPayload = { 
      data: [eventData],
      test_event_code: company.fb_test_event_code || undefined 
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fbPayload)
    })

    const fbResult = await response.json()
    console.log(`[FB-Dispatcher] Resposta Meta:`, fbResult)

    // 6. Marcar como despachado no banco
    await supabase
      .from('lt_events')
      .update({ 
        fb_dispatched: true, 
        fb_dispatched_at: new Date().toISOString() 
      })
      .eq('id', event.id)

    return new Response(JSON.stringify({ ok: true, meta: fbResult }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (err) {
    console.error(`[FB-Dispatcher] Erro fatal:`, err.message)
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
