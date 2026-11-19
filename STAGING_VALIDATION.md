# Validação Supabase em Staging

## Estado atual

Em 18/11/2026, o projeto de staging está vinculado pela Supabase CLI 3.2.0. As seis migrations locais correspondem ao histórico remoto e o seed fictício de demonstração foi aplicado a um perfil que não possuía clientes. Isso não substitui a matriz de segurança A/B nem autoriza promoção para produção.

| Validação | Resultado atual | Evidência/bloqueio |
| --- | --- | --- |
| Migrations remotas | `PASS` | seis versões locais e remotas em sincronia |
| Dados de demonstração | `PASS` | seed idempotente aplicado ao perfil isolado: clientes, imóveis, retornos, visitas, tarefas, leads e captações |
| Isolamento A/B | `PENDING` | dois usuários existem; matriz destrutiva não foi executada nesta etapa de demonstração |
| Storage e URLs assinadas | `PENDING` | policies existem; upload, exclusão cruzada e expiração ainda exigem sessão autenticada |
| Recuperação/redefinição | `PENDING` | exige e-mail/SMTP e callback do ambiente publicado |
| Security Advisor | `WARN` | executado; grants de funções e proteção de senhas vazadas exigem revisão antes da produção |
| Headers publicados | `BLOCKED` | URL HTTPS de staging não fornecida |
| Suíte local | `PASS` | resultado final registrado em `PROJECT_STATUS.md` e na entrega desta etapa |

### Avisos atuais do Security Advisor

- Funções de trigger `handle_new_user`, `record_client_stage_change` e a função remota `rls_auto_enable` possuem grants de execução para papéis amplos; revisar e revogar o que não for necessário.
- `submit_property_lead` e `submit_property_submission` são RPCs públicas por desenho; manter validação, rate limiting e grants mínimos.
- `convert_lead_to_client` exige usuário autenticado e valida `auth.uid()`, mas o grant deve ser revisado periodicamente.
- A proteção contra senhas vazadas do Supabase Auth está desabilitada.

Nenhum desses avisos foi classificado como resolvido apenas por análise estrutural. A revisão profunda foi adiada para a etapa de segurança final.

## Migrations e aplicação

Execute exatamente nesta ordem; migrations antigas não devem ser editadas:

1. `202611090001_phase2_crm.sql` — perfis, clientes, interações e retornos.
2. `202611090002_properties_and_interests.sql` — imóveis e interesses.
3. `202611090003_appointments_and_tasks.sql` — visitas e pendências.
4. `202611100004_public_portal_leads_and_storage.sql` — portal, leads, captações e Storage.
5. `202611100005_funnel_reports_and_settings.sql` — funil, histórico e configurações.
6. `202611100006_security_hardening.sql` — isolamento das captações.

Manifesto SHA-256 auditado nesta etapa:

| Migration | SHA-256 |
| --- | --- |
| `202611090001_phase2_crm.sql` | `805f0b94b875410ea0c0e307afafa82a83f115e8f4b5322c4b68d02c7531ae42` |
| `202611090002_properties_and_interests.sql` | `f1671ddd3ddfe6ab28d67b6e9bcc3224debc0ff56ba6f390b6790c371c2e9145` |
| `202611090003_appointments_and_tasks.sql` | `91a2a34a3d3093936bb86fabc7b59d27e6e4b8bd74490ba505c467e24231e604` |
| `202611100004_public_portal_leads_and_storage.sql` | `78ecbe92412a982d9fad55e9841e572d25d23c3c3b496d795233885dde90c57d` |
| `202611100005_funnel_reports_and_settings.sql` | `f887dca7f998bb476abe905553e11a0438780e0fd0482eccd6c1125c51d21784` |
| `202611100006_security_hardening.sql` | `24f6826664a5363bd0ebb07f813cb6a7795cc57762519ae9112377f6796b25e0` |

No terminal, autentique e vincule somente o projeto de staging:

```powershell
npx supabase login
npx supabase link --project-ref <STAGING_PROJECT_REF>
npx supabase migration list --remote
npx supabase db push --dry-run --remote
npx supabase db push --remote
npx supabase migration list --remote
```

Revise o `dry-run` antes do push. Não use `db reset --remote`, `--include-seed` ou `migration repair` sem investigar o histórico remoto. Se já existir schema manual no staging, pare e reconcilie o drift antes de aplicar.

## Ambiente de staging

Configure na plataforma de deploy, nunca no código:

- `NEXT_PUBLIC_SUPABASE_URL`: URL exclusiva do staging.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave pública/anon do staging.
- `NEXT_PUBLIC_SITE_URL`: URL HTTPS publicada do staging.
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: somente se o fluxo for testado.
- `NODE_ENV=production`: deve ser definido pela plataforma; sem Supabase, login demo deve retornar indisponível.

Não configure `SUPABASE_SERVICE_ROLE_KEY`. Confirme que `.env*` continua ignorado, com exceção de `.env.example`. No Supabase Auth, configure Site URL e permita exatamente `<STAGING_URL>/auth/callback`.

## Preparação dos usuários A e B

Crie dois usuários de teste confirmados pelo painel Auth, com e-mails distintos. Use dois perfis de navegador isolados. Registre em uma planilha temporária os UUIDs dos usuários e IDs criados; não inclua senhas ou tokens no repositório.

Como usuário A, crie cliente, imóvel privado, retorno, interação, visita, pendência, lead pelo formulário público, captação e duas imagens. Guarde todos os IDs e `storage_path`. Crie também um imóvel público para distinguir acesso público intencional de vazamento privado.

Como usuário B, tente para cada ID de A: abrir a URL direta, editar, excluir, criar vínculo cliente-imóvel, trocar status e repetir a requisição de uma Server Action substituindo o ID. O resultado deve ser 404, resposta genérica de não encontrado/negado ou zero linhas afetadas, sem revelar os dados de A.

## Matriz RLS esperada

| Tabela | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `profiles` | próprio | trigger Auth | próprio | negado |
| `clients` | próprio | próprio | próprio | próprio |
| `interactions`, `follow_ups` | próprio + cliente próprio | próprio + cliente próprio | próprio + cliente próprio | próprio |
| `properties` | próprio; anon apenas público/disponível | próprio | próprio | próprio |
| `client_property_interests` | próprio + vínculos próprios | próprio + vínculos próprios | próprio + vínculos próprios | próprio |
| `appointments`, `tasks` | próprio | próprio + vínculos próprios | próprio + vínculos próprios | próprio |
| `property_images` | próprio; leitura pública apenas se imóvel público/disponível | próprio + imóvel próprio | próprio | próprio |
| `leads` | próprio | somente RPC pública validada | próprio | próprio |
| `property_submissions` | próprio | somente RPC pública com destinatário | próprio | negado |
| `client_stage_history` | próprio + cliente próprio | somente trigger | negado | negado |
| `organization_settings` | próprio | próprio | próprio | próprio |

Em todos os testes negativos, confirme tanto a resposta da aplicação quanto a ausência de alteração no Table Editor. Teste também chamadas REST diretas com o JWT de B; não use a service role, pois ela ignora RLS.

## Storage e URLs assinadas

1. A envie JPG, PNG e WebP válidos para imóvel privado; registre os paths.
2. B tente `download`, `update` e `remove` nos paths de A: todos devem falhar.
3. Sem JWT, tente a URL direta do objeto privado: deve falhar.
4. Gere URL assinada curta para o objeto privado, por exemplo 10 segundos; abra imediatamente e confirme HTTP 200.
5. Após a expiração, repita a mesma URL e confirme 4xx.
6. Publique um imóvel de A e confirme a exceção intencional: a imagem pública pode ser lida conforme a policy. Volte o imóvel para privado e confirme a negação.

Não confunda bucket privado com ausência total de policies: o catálogo possui leitura intencional para imagens de imóveis públicos/disponíveis.

## Autenticação real

- Login válido de A e B; senha inválida deve retornar mensagem genérica.
- Logout e tentativa imediata de `/admin`; esperado: `/login`.
- Remova/revogue a sessão no painel e confirme que a próxima ação exige login.
- Solicite recuperação; a resposta não deve revelar se o e-mail existe.
- Abra o e-mail de staging, confirme callback permitido, redefina para senha de 8+ caracteres e valide login antigo/novo.
- Teste `redirectTo=/admin/clientes` e entradas maliciosas (`//example.com`, URL absoluta); somente path interno deve ser aceito.
- Abra `/admin` em janela sem cookies; esperado: redirecionamento ao login.

## Security Advisor

Execute e salve a saída sem tokens:

```powershell
npx supabase db advisors --remote --type security --level info --output-format json
```

Registre ID, nível, objeto, descrição, decisão e evidência. RPCs públicas `SECURITY DEFINER` podem gerar avisos: `submit_property_lead` e `submit_property_submission` são públicas por desenho; `convert_lead_to_client` exige usuário e valida `auth.uid()`. Não ignore automaticamente — confirme grants, validações e impacto de cada aviso.

## Headers publicados

```powershell
$r = Invoke-WebRequest '<STAGING_URL>/login' -UseBasicParsing
$r.Headers['Content-Security-Policy']
$r.Headers['X-Content-Type-Options']
$r.Headers['Referrer-Policy']
$r.Headers['Permissions-Policy']
```

Confirme `frame-ancestors 'none'` na CSP, `nosniff`, Referrer Policy, Permissions Policy e HSTS sob HTTPS. Tente incorporar `/login` e `/admin` em um iframe de outra origem; ambos devem ser bloqueados.

## Registro dos resultados

Para cada caso, anote data, executor, usuário, recurso/ID parcial, operação, resultado HTTP/UI, alteração no banco e evidência. Classifique como `PASS`, `FAIL` ou `BLOCKED`. Qualquer `FAIL` de isolamento bloqueia o deploy.
