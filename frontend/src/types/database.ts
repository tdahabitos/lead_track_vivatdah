export interface Company {
  id: number;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  is_active: boolean;
  primary_domain: string;
  webhook_secret?: string | null;
  fb_pixel_id?: string | null;
  fb_access_token?: string | null;
  fb_test_event_code?: string | null;
  fb_conversion_id?: string | null;
  fb_ad_account_id?: string | null;
  manychat_api_token?: string | null;
  brevo_api_key?: string | null;
  mautic_url?: string | null;
  mautic_username?: string | null;
  mautic_password?: string | null;
  clarity_project_id?: string | null;
}

export interface Lead {
  id: number;
  company_id: number;
  lt_id: string; // O identificador único do LeadTrack
  name?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  is_customer: boolean;
  is_identified: boolean;
  score: number;
  tags?: string[] | null;
  
  // Facebook
  fbp?: string | null;
  fbc?: string | null;

  // Localização
  country?: string | null;
  state?: string | null;
  city?: string | null;
  
  // Primeiro Toque
  first_visit_at: string;
  first_utm_source?: string | null;
  first_utm_medium?: string | null;
  first_utm_campaign?: string | null;
  first_referrer?: string | null;
  first_page?: string | null;

  // Último Toque
  last_visit_at: string;
  last_utm_source?: string | null;
  last_city?: string | null;
  last_ip_address?: string | null;
  ip_address?: string | null; // Alias para compatibilidade
  
  // Status
  lead_stage?: string | null;
  
  // Dispositivo
  device_type?: string | null;
  os_name?: string | null;
  browser_name?: string | null;
  user_agent?: string | null;

  // Estatísticas
  total_visits: number;
  total_events: number;
  
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: number;
  company_id: number;
  lead_id: number;
  session_id: string;
  external_user_id: string;
  visit_timestamp: number;
  visit_datetime: string;
  visit_date: string; // YYYY-MM-DD
  page_url: string;
  page_path: string;
  page_title: string;
  referrer?: string | null;
  ip_address?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  cookie_domain: string;
  user_agent: string;
  screen_width: number;
  screen_height: number;
  language: string;
}

export interface Event {
  id: number;
  company_id: number;
  lead_id: number;
  visit_id?: number | null;
  event_timestamp: number;
  event_datetime: string;
  event_type: 'pageview' | 'scroll' | 'click' | 'form_submit' | 'begin_checkout' | 'purchase' | 'identify' | 'custom';
  event_name: string;
  page_path: string;
  page_url: string;
  element_id?: string | null;
  element_class?: string | null;
  element_text?: string | null;
  element_href?: string | null;
  scroll_position?: number | null;
  event_value?: string | null;
  metadata?: Record<string, any> | null;
}
