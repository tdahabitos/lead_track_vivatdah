# 🎨 ARQUITETURA DE FRONTEND SÊNIOR: LEAD_TRACK (VIVATDAH)
**Data:** 2026-04-24 | **Engenheiro:** Antigravity AI
**Objetivo:** Construção local (neste projeto) do Dashboard LeadTrack. Não usaremos geradores externos. Vamos construir a fundação em React/Vite com Mocks e depois conectar ao Supabase real.

## 1. IDENTIDADE VISUAL & UI/UX (O Padrão Diamond)
- **Tema Base:** Dark Mode estrito.
- **Background Principal:** Slate 900 (`#0F172A`).
- **Cards & Sidebar:** Slate 800 (`#1E293B`) com opacidade e bordas sutis (`border-slate-700/50`).
- **Cor Primária (Ações):** Indigo 600 (`#4F46E5`) com hover para Indigo 500 (`#6366F1`).
- **Sucesso:** Emerald 500 (`#10B981`).
- **Aviso:** Amber 500 (`#F59E0B`).
- **Erro:** Red 500 (`#EF4444`).
- **Efeito Assinatura (Glassmorphism):** Menus e Headers usarão `backdrop-blur-md bg-slate-900/80`.
- **Tipografia:** Fonte `Inter`.

## 2. STACK TECNOLÓGICA
- **Base:** Vite + React 19 + TypeScript.
- **Estilização:** Tailwind CSS v4 + `shadcn/ui` (para botões, tabelas, modais, dropdowns).
- **Ícones:** Lucide React.
- **Gráficos:** Recharts (customizados com a paleta VivaTDAH).
- **Roteamento:** React Router DOM v7.
- **Gerenciamento de Estado:** Zustand (para controle da empresa selecionada) e TanStack Query (React Query) para chamadas de dados e cache.

## 3. ESTRUTURA DE DIRETÓRIOS DO FRONTEND (`/lead_track/frontend`)
```text
src/
  ├── components/
  │   ├── ui/           # Componentes base (shadcn)
  │   ├── charts/       # Gráficos reutilizáveis (Recharts)
  │   └── layout/       # Sidebar, Header, PageContainer
  ├── pages/            # Telas principais (Dashboard, Leads, etc)
  ├── mocks/            # DADOS FALSOS (Fase 1)
  │   └── mockData.ts   # Simulador de banco de dados
  ├── hooks/            # Custom hooks (useLeads, useCompany)
  ├── lib/              # Configurações (utils do tailwind, etc)
  └── types/            # Tipagens do TypeScript (Company, Lead, Visit, Event)
```

## 4. CHECKLIST DE EXECUÇÃO (Fase 1: Mocks & Layout)

Faremos a construção passo a passo. Como alinhado, usaremos MOCKS (dados falsos) no início para validar todo o layout e a navegação.

- [ ] **Tarefa 1: Setup Inicial do Projeto**
  - Rodar `npm create vite@latest frontend -- --template react-ts`.
  - Instalar Tailwind v4, React Router, Recharts, Lucide, e React Query.
  - Configurar as cores do Padrão Diamond no CSS global.

- [ ] **Tarefa 2: Criação dos Tipos e Mocks**
  - Criar `src/types/database.ts` mapeando exatamente o PRD (`companies`, `leads`, `visits`, `events`).
  - Criar `src/mocks/mockData.ts` populando com 20 leads falsos, 100 visitas, etc., para as telas ganharem vida.

- [ ] **Tarefa 3: O Layout Principal (Shell)**
  - Criar a `Sidebar` fixa com largura de 220px.
  - Criar o `Header` com o dropdown de seleção de empresa ("VivaTDAH").
  - Configurar o roteamento no `App.tsx` envolvendo as rotas na Sidebar.

- [ ] **Tarefa 4: Tela 1 - Dashboard Principal (`/`)**
  - Montar os 4 KPI Cards (Leads, Visitas, Eventos, Clientes).
  - Montar o Funil de Vendas Visual.
  - Tabela simples de Últimos Leads.

- [ ] **Tarefa 5: Tela 2 - Lista e Detalhe de Leads (`/leads`)**
  - Tabela principal com filtros de busca.
  - Ao clicar, abre `/leads/:id` mostrando a **Timeline Cronológica** (Visitas e Eventos misturados).

- [ ] **Tarefa 6: Restante das Views Analíticas**
  - Criar a visão de Funil detalhada (`/funnel`).
  - Criar Análise UTM com gráfico de barras (`/utm`).
  - Criar painel Geográfico (`/geo`).
  - Criar painel de Eventos (`/events`) e Temporal (`/temporal`).

---

**Status:** ARQUITETURA DEFINIDA. Prontos para iniciar a **Tarefa 1**.
