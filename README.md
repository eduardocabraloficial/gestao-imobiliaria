# Cabral House Negócios Imobiliários

Plataforma da Cabral House que reúne CRM, rotina comercial, imóveis e captação em um painel privado, além de um portal público para divulgação e geração de leads.

## Stack e arquitetura

- Next.js 16 (App Router), React 19 e TypeScript estrito.
- Tailwind CSS 4 e Lucide React.
- Identidade visual em DM Serif Display e Manrope, com tokens centralizados em `src/app/globals.css`.
- Supabase Auth, PostgreSQL com RLS e Storage privado.
- Páginas e Route Handlers em `src/app`, componentes em `src/components`, domínio e acesso a dados em `src/lib`, tipos em `src/types`.

O navegador nunca recebe uma service role. Server Actions e consultas usam a sessão atual, e o banco aplica isolamento por `user_id` com RLS.

A fonte oficial da marca é `public/brand/cabral-house-logo.svg`; não gere variantes destrutivas do arquivo.

## Módulos

O painel contém Hoje, Dashboard, Clientes, Leads, Imóveis, Funil, Agenda, Pendências, Captações, Relatórios e Configurações. O portal público oferece home, catálogo filtrável, detalhe do imóvel, formulário de interesse e captação de imóveis. Há estados vazios, carregamento, erro administrativo e layout responsivo.

## Executar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. Para validar antes de entregar:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
```

## Ambiente

Copie `.env.example` para `.env.local` e preencha sem versionar valores reais:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=
```

Não configure `SUPABASE_SERVICE_ROLE_KEY`. O modo demonstrativo só funciona sem Supabase em desenvolvimento e fica desabilitado quando `NODE_ENV=production`.

## Supabase e migrations

As migrations em `supabase/migrations` devem ser aplicadas na ordem abaixo e nunca editadas depois de publicadas:

1. `202611090001_phase2_crm.sql`
2. `202611090002_properties_and_interests.sql`
3. `202611090003_appointments_and_tasks.sql`
4. `202611100004_public_portal_leads_and_storage.sql`
5. `202611100005_funnel_reports_and_settings.sql`
6. `202611100006_security_hardening.sql`

Com a CLI autenticada e o projeto correto vinculado:

```bash
npx supabase migration list --remote
npx supabase db push --dry-run --remote
npx supabase db push --remote
```

Crie o primeiro usuário em **Authentication → Users**; o trigger cria seu perfil. O bucket privado `property-images` aceita JPG, PNG e WebP de até 8 MB, com paths no padrão `USER_ID/PROPERTY_ID/`. Imagens públicas são servidas por URL assinada apenas quando o imóvel está público e disponível.

Para preparar dados fictícios em um usuário vazio de staging, execute deliberadamente:

```bash
npx supabase db query --remote --file supabase/demo_seed.sql --yes
```

O script é idempotente, não é migration e não deve ser executado em produção.

## Deploy de staging na Vercel

1. Importe o repositório e mantenha os comandos padrão `npm run build` e `npm start`.
2. Cadastre as quatro variáveis acima para Preview/Production, com a URL HTTPS real em `NEXT_PUBLIC_SITE_URL`.
3. No Supabase Auth, configure a **Site URL** publicada e permita `<STAGING_URL>/auth/callback` em Redirect URLs.
4. Faça o deploy, teste `/login`, `/admin`, recuperação de senha e os headers de segurança.
5. Não promova para produção antes do roteiro A/B, Storage e Auth de `STAGING_VALIDATION.md`.

## Demonstração e estado

- Roteiro de apresentação: [`DEMO_GUIDE.md`](DEMO_GUIDE.md).
- Estado honesto do produto: [`PROJECT_STATUS.md`](PROJECT_STATUS.md).
- Validação de staging: [`STAGING_VALIDATION.md`](STAGING_VALIDATION.md).
- Auditoria estrutural: [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md).

Rate limiting público e de autenticação usa memória local; antes da produção definitiva, substitua-o por armazenamento compartilhado/WAF. Personalização de marca, dados reais, MFA, SMTP e validação A/B completa permanecem fora desta etapa.
