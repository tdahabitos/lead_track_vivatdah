# 🛑 REGRAS ABSOLUTAS DO PROJETO: LEAD_TRACK
**Data:** 2026-04-24 | **Engenheiro:** Antigravity AI

## 1. ISOLAMENTO TOTAL
- **NENHUM** arquivo existente do projeto legado (`apps/painel-utm`, `apps/blog`, `apps/event-pipeline`, `packages/tracking`) deve ser modificado, excluído ou alterado nesta fase.
- Todo o novo desenvolvimento acontecerá **EXCLUSIVAMENTE** dentro da pasta `/lead_track`.
- O objetivo é construir um sistema "Plug & Play". Quando estiver pronto, ele será injetado no ecossistema (via Script/GTM), sem depender da arquitetura antiga.

## 2. ESCOPO BLOQUEADO (O que NÃO fazer)
- 🚫 **PROIBIDO** mencionar, auditar ou tentar consertar o Blog.
- 🚫 **PROIBIDO** tentar consertar ou rodar o `painel-utm` antigo.
- 🚫 **PROIBIDO** tentar resolver erros de comunicação dos servidores antigos.

## 3. O NOVO PADRÃO (O que VAMOS fazer)
- **Centralização:** O banco de dados (Supabase) é a única fonte de verdade.
- **Captura:** Desenvolveremos um script universal (para GTM ou embed direto) focado em extração agressiva de dados (Advanced Matching).
- **Processamento:** O backend do `lead_track` será uma API de altíssima performance focada apenas em receber o evento, resolver a identidade (anônimo -> comprador) e salvar no banco.
- **Distribuição:** A comunicação com Facebook CAPI e outros webhooks sairá deste novo núcleo processado.
- **Visualização:** O frontend será gerado via Lovable (PRD fornecido) conectando diretamente ao banco de dados via RLS.
