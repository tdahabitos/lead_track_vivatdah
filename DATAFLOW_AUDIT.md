# 🔬 AUDITORIA FORENSE: FLUXO DE DADOS — GTM, Facebook CAPI & ManyChat

**Data:** 26/04/2026 | **Auditor:** Antigravity
**Foco:** Resolver a questão ANTES de codar: como o dado flui do site até o Facebook e ManyChat?

---

## 1. 🎯 A PERGUNTA CERTA

> "Como é que vai funcionar o Script e a API de Ingestão se a gente usa GTM e precisa enviar eventos pro Facebook Advantage+ e ManyChat?"

---

## 2. 🚨 O PROBLEMA DO MODELO ERRADO (Como a maioria faz)

```
Site → GTM → Facebook Pixel (browser)     ← Roda no navegador do visitante
Site → GTM → Google Analytics (browser)    ← Roda no navegador do visitante
```

**Por que isso é péssimo:**
- iOS 14+ bloqueia cookies → Facebook perde 30-50% dos eventos
- Ad blockers matam o Pixel → eventos somem
- Pixel no browser não manda dados de Advanced Matching de qualidade
- Event Match Quality (EMQ) fica baixo → Advantage+ não otimiza
- Resultado: paga MAIS caro por lead/compra

---

## 3. ✅ O MODELO CORRETO (Padrão Ouro VivaTDAH)

**Server-Side First** — O dado passa pelo NOSSO servidor antes de ir para qualquer lugar.

| Aspecto | Pixel no Browser (errado) | LeadTrack Server-Side (certo) |
|---------|--------------------------|-------------------------------|
| iOS 14+ bloqueio | Perde 30-50% dos eventos | **0% de perda** |
| Ad Blockers | Mata o Pixel | **Não afeta** |
| Advanced Matching | Depende do form visível | **Puxa do banco** |
| Event Match Quality | 4-6/10 | **8-10/10** |
| Advantage+ otimização | Fraca | **Máxima** |

---

## 4. 💡 FLUXO REAL: Jornada da Maria

### Passo 1 — Captura (tracker.js via GTM)
Maria clica anúncio IG → tracker.js gera cookie `lt_id`
```json
{ "lt_id": "maria123", "event": "pageview", "url": "vivatdah.com.br/vsl",
  "utm_source": "instagram", "utm_campaign": "vsl_principal" }
```

### Passo 2 — Ingestão (Nossa API)
API salva lead + visit → Despacha PageView pro CAPI com IP + UA + fbp/fbc

### Passo 3 — Clica "COMPRAR"
```json
{ "lt_id": "maria123", "event": "begin_checkout", "element_text": "QUERO COMPRAR AGORA" }
```
→ CAPI: InitiateCheckout | ManyChat: tag `iniciou_checkout`

### Passo 4 — Preenche checkout (Identity Resolution)
```json
{ "lt_id": "maria123", "event": "identify",
  "email": "maria@gmail.com", "phone": "5527999998888",
  "name": "Maria Santos", "city": "Vila Velha", "state": "ES" }
```
→ Atualiza lead com dados reais, gera hashes SHA256

### Passo 5 — Guru confirma pagamento (Webhook)
```json
{ "event": "purchase", "email": "maria@gmail.com", "value": 147.00 }
```
→ CAPI: Purchase com EMQ 9/10 (todos os dados hasheados)
→ ManyChat: tag `comprador`

**Resultado:** Advantage+ sabe EXATAMENTE quem compra → busca mais iguais → custo CAI.

---

## 5. 📋 ORDEM DE EXECUÇÃO

```
FASE 1 — FUNDAÇÃO ✅
  ├── Missão 1: Schema SQL (lt_* no Supabase)           ✅
  ├── Missão 6: Segurança (RLS + 19 índices)             ✅
  ├── Missão 5: Hub Integrações (embutido lt_companies)   ✅
  └── Missão 2: Conexão Frontend                          🔲

FASE 2 — MOTOR
  ├── Missão 3: API de Ingestão + Dispatcher              🔲
  └── Missão 4: Spy Script (tracker.js no GTM)            🔲
```

---

## 6. ⚖️ VEREDITO

O Script e a API são o **HUB CENTRAL** por onde todo dado passa antes de ir para qualquer lugar.
Schema → Integrações → Segurança → Frontend → Script + API.
