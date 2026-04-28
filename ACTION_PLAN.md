# 🔬 AUDITORIA FORENSE E PLANO DE AÇÃO SÊNIOR: LEAD_TRACK
**Visão:** Motor de Tracking Server-Side First — Advanced Matching, Identity Resolution, Facebook CAPI + ManyChat.

---

## 🛑 REGRA DE OURO — ORDEM DE EXECUÇÃO

> A casa precisa estar pronta antes de ligar o motor.
> Primeiro: ver os dados no dashboard. Depois: fazer os dados fluírem automaticamente.

```
FASE 1 — ALICERCE (Banco de Dados)                        ✅ CONCLUÍDA
  ├── Schema SQL (lt_* no Supabase)                        ✅
  ├── Auditoria Forense (27 tabelas legadas mapeadas)      ✅
  ├── RLS + Índices + Triggers                             ✅
  └── Hub Integrações (config na lt_companies)             ✅

FASE 2 — ESTRUTURA (Frontend Conectado ao Banco)           ✅ CONCLUÍDA
  ├── supabaseClient configurado                           ✅
  ├── Hooks de dados (useLeads, useVisits, useEvents...)   ✅
  ├── Matar TODOS os mocks → dados reais do banco          ✅
  ├── Todas as abas do dashboard funcionando               ✅
  ├── Hub de Integrações (modal multi-campo + salva DB)    ✅
  ├── Campanhas Meta Ads (API real conectada)              ✅
  └── CRUD básico (criar/editar company, ver leads, etc.)  ✅

FASE 3 — MOTOR (API + Script + Integrações)                🔲 EM EXECUÇÃO
  │
  ├── BLOCO A: CAPTURAÇÃO                                  🔲
  │   ├── 3.1 Edge Function POST /track (Ingestão)         🔲
  │   ├── 3.2 Identity Resolution Engine (Merge)           🔲
  │   ├── 3.3 Edge Function POST /identify (PII)           🔲
  │   └── 3.4 tracker.js (Script GTM / Spy Script)         🔲
  │
  ├── BLOCO B: VERIFICAÇÃO                                 🔲
  │   ├── 3.5 Teste End-to-End (script → banco)            🔲
  │   └── 3.6 Validar dados no Dashboard                   🔲
  │
  └── BLOCO C: DISPATCH (Enviar para fora)                 🔲
      ├── 3.7 Facebook CAPI Dispatcher                     🔲
      ├── 3.8 Webhook Guru (Receber compras)               🔲
      ├── 3.9 ManyChat Dispatcher                          🔲
      └── 3.10 Health Check & Monitoramento                🔲
```

> [!IMPORTANT]
> **Regra do Checkpoint:** Após o BLOCO A, PAUSAR. Testar tudo no site real.
> Verificar se dados aparecem no dashboard. Só avançar para BLOCO C 
> quando a capturação estiver 100% validada.

---

## 🏗️ ARQUITETURA FASE 3

```
┌─────────────────────────────────────────────────────────────────┐
│ NAVEGADOR DO VISITANTE                                         │
│                                                                 │
│  tracker.js → gera lt_id cookie → captura UTMs + _fbp + _fbc  │
│            → POST /track (pageview, scroll, click)             │
│            → POST /identify (form_submit com email)            │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────────────────┐
│ SUPABASE EDGE FUNCTIONS                                         │
│                                                                 │
│  /track     → UPSERT lt_leads → INSERT lt_visits + lt_events  │
│  /identify  → Identity Resolution → UPDATE lt_leads (PII)     │
│  /webhook/guru → Validar Token → INSERT event (purchase)       │
│  /fb-dispatch  → Ler pendentes → POST Meta CAPI → Log         │
│  /tracker      → Servir tracker.js dinâmico (GET)              │
└─────────────────────┬───────────────────────────────────────────┘
                      │ service_role
┌─────────────────────▼───────────────────────────────────────────┐
│ SUPABASE POSTGRESQL                                             │
│                                                                 │
│  lt_companies  → Credenciais (tokens, keys)                    │
│  lt_leads      → CDP Central (cada pessoa única)               │
│  lt_visits     → Sessões com UTMs e geo                        │
│  lt_events     → Cada ação (pageview, click, purchase)         │
│  lt_dispatch_log → Auditoria de entregas                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 TABELAS & O QUE CADA UMA RECEBE NA FASE 3

| Tabela | O que entra | Quem escreve |
|--------|-------------|-------------|
| `lt_leads` | Novo visitante (anônimo), PII (email/phone após identify) | `/track`, `/identify` |
| `lt_visits` | Cada sessão/página visitada com UTMs e device | `/track` |
| `lt_events` | Cada ação: pageview, scroll, click, form_submit, purchase | `/track`, `/identify`, `/webhook/guru` |
| `lt_dispatch_log` | Registro de cada envio para Meta/ManyChat/N8N | `/fb-dispatch` |

---

## 🔐 EDGE FUNCTIONS — MAPA DE DEPLOY

| Function | Método | Público? | Descrição |
|----------|--------|----------|-----------|
| `track` | POST | ✅ Sim | Ingestão de eventos do tracker.js |
| `identify` | POST | ✅ Sim | Merge anônimo → identificado |
| `webhook-guru` | POST | ✅ (com token) | Receber POSTs do Guru |
| `fb-dispatcher` | POST | ❌ (CRON/interno) | Enviar para Meta CAPI |
| `tracker` | GET | ✅ Sim | Servir o tracker.js |
| `meta-insights` | POST | ❌ (JWT) | Buscar campanhas do Meta |

---

## ⏭️ PRÓXIMA AÇÃO

> Aguardando confirmação do usuário sobre:
> 1. Script existente (mostrar para análise)
> 2. Domínio exato do site
> 3. Status do GTM
> 4. Formulários de captura
> 5. Eventos prioritários
