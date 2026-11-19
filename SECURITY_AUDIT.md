# Auditoria de Segurança

## Escopo e metodologia

Auditoria estática e dinâmica da aplicação Gestão Imobiliária, orientada pelo OWASP Top 10:2025, recomendações do Next.js 16 e checklists de produção do Supabase. Foram analisados autenticação, autorização, RLS, grants, Server Actions, Route Handlers, RPCs, Storage, formulários públicos, cache, headers, dependências e exposição de dados.

O repositório não possui histórico Git, mas agora está vinculado a um projeto Supabase de staging. Histórico de migrations e Security Advisor foram verificados remotamente; expiração de URLs assinadas, recuperação por e-mail e isolamento completo entre dois usuários ainda precisam de validação autenticada.

## Baseline inicial — antes das correções

Score inicial estimado: **61/100**.

| ID | Área | Vulnerabilidade | Severidade | Impacto | Evidência | Recomendação | Status inicial |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-01 | Autorização/RLS | Captações acessíveis por qualquer usuário autenticado | ALTA | Exposição e alteração cruzada de nome, telefone, e-mail e dados do imóvel | Policies `submissions_admin_read/update` usam `true`; action atualiza somente por `id` | Associar captação a `user_id`, aplicar policy própria e filtrar action/consulta | ABERTO |
| SEC-02 | Redirecionamentos | Redirecionamento externo após login ou callback | MÉDIA | Phishing e navegação para domínio controlado pelo atacante | `redirectTo` usado diretamente no cliente; callback aceita valores iniciados por `//` | Aceitar apenas paths locais normalizados | ABERTO |
| SEC-03 | Headers/clickjacking | Ausência de CSP, `nosniff`, Referrer e Permissions Policy | MÉDIA | Maior impacto de XSS, framing da área administrativa e exposição de referrer | `next.config.ts` não define headers | Adicionar headers modernos e `frame-ancestors 'none'` | ABERTO |
| SEC-04 | Autenticação | Login e recuperação sem limitador da aplicação | MÉDIA | Brute force, abuso e esgotamento da cota de recuperação | Route Handlers chamam Supabase Auth sem limitação local | Limitar por IP/e-mail e manter limites do Supabase em produção | ABERTO |
| SEC-05 | CSRF | Route Handlers mutáveis sem validação explícita de origem | MÉDIA | Login CSRF, logout forçado ou tentativa forjada de troca de senha | POSTs de Auth não comparam `Origin` e `Host` | Rejeitar origem divergente; preservar proteção nativa das Server Actions | ABERTO |
| SEC-06 | Disponibilidade | Limite global de Server Actions em 85 MB | MÉDIA | Consumo excessivo de memória/banda por request | `serverActions.bodySizeLimit: "85mb"` | Reduzir limite e limitar quantidade/tamanho total de imagens | ABERTO |
| SEC-07 | Upload/Storage | Extensão não validada contra MIME e conteúdo | MÉDIA | Arquivo disfarçado, conteúdo inesperado e risco de interpretação incorreta | Upload confia em `File.type` e usa extensão do nome original | Validar MIME, extensão, assinatura básica, quantidade e bytes totais | ABERTO |
| SEC-08 | Validação | Enums e limites incompletos em algumas Server Actions | MÉDIA | Requests inválidos, erros internos e abuso de campos extensos | Status de visita/tarefa e vários campos não têm allowlist/limite runtime | Centralizar allowlists e limites server-side | ABERTO |
| SEC-09 | Produção | Modo demonstração ativado quando Supabase não está configurado | MÉDIA | Deploy mal configurado aceita login arbitrário, ainda que com dados fictícios | Cookie `demo-session` é aceito sempre que faltam variáveis Supabase | Desabilitar demo automaticamente em produção | ABERTO |
| SEC-10 | Rate limiting público | Limitador em memória e fingerprint dependente de header | BAIXA | Limites não são compartilhados entre instâncias e podem perder eficácia | `Map` local em `public-forms.ts` | Manter como defesa local e exigir rate limit compartilhado/WAF em produção | PENDENTE PARA PRODUÇÃO |
| SEC-11 | Segredos | Variável de service role documentada apesar de não utilizada | BAIXA | Incentiva configuração desnecessária de segredo privilegiado | `.env.example` e README citam `SUPABASE_SERVICE_ROLE_KEY` | Remover do template até existir uso server-side legítimo | ABERTO |
| SEC-12 | Cache | Privacidade das rotas administrativas depende da detecção dinâmica | BAIXA | Configuração futura poderia permitir cache compartilhado indevido | Layout lê sessão, mas não há header explícito para `/admin` | Aplicar `private, no-store` como defesa adicional | ABERTO |
| SEC-13 | Dependências | Sem vulnerabilidades conhecidas no audit atual | INFORMATIVA | Nenhum risco identificado pelo banco npm na data da auditoria | `npm audit --omit=dev`: 0 vulnerabilidades | Repetir em CI e antes de cada release | VALIDADO |
| SEC-14 | XSS/SQL/CSV | Controles existentes adequados | INFORMATIVA | React escapa texto; Supabase parametriza consultas; CSV neutraliza fórmulas | Sem `dangerouslySetInnerHTML` ou SQL concatenado; testes de CSV presentes | Manter testes de regressão | VALIDADO |
| SEC-15 | Funções Postgres | `SECURITY DEFINER` com `search_path` vazio e verificações de usuário nas RPCs privadas | INFORMATIVA | Reduz risco de sequestro de objetos e IDOR | Migrations qualificam objetos e `convert_lead_to_client` usa `auth.uid()` | Revalidar com Security Advisor após aplicar migrations | VALIDADO |

## Matriz RLS inicial

| Tabela | RLS | Isolamento observado |
| --- | --- | --- |
| `profiles`, `clients`, `properties` | Ativo | Próprio usuário |
| `interactions`, `follow_ups` | Ativo | Usuário e cliente proprietário |
| `appointments`, `tasks` | Ativo | Usuário; vínculos validados |
| `leads` | Ativo | Próprio usuário |
| `property_images` | Ativo | Proprietário ou imagem de imóvel público |
| `client_property_interests` | Ativo | Usuário, cliente e imóvel proprietários |
| `client_stage_history` | Ativo | Usuário e cliente proprietário; somente leitura |
| `organization_settings` | Ativo | Próprio usuário |
| `property_submissions` | Ativo | **Falha: todos os autenticados** |

## Controles confirmados no baseline

- Todas as mutações administrativas obtêm a sessão no servidor; `user_id` não é aceito do navegador.
- Consultas administrativas relevantes combinam RLS com filtros de propriedade.
- RPC de conversão bloqueia conversão duplicada com lock e valida `auth.uid()`.
- Bucket `property-images` é privado, limitado a 8 MB e aos MIME types JPG, PNG e WebP.
- URLs assinadas expiram em uma hora.
- Formulários públicos possuem honeypot, limites de tamanho, validação de contato e limitador local.
- Recuperação de senha usa mensagem não enumerável.
- `.env*` está ignorado, exceto `.env.example`; nenhum segredo real foi encontrado no workspace.
- Não há CORS permissivo, SQL manual, renderização de HTML não confiável ou logs sensíveis no código-fonte.

## Referências

- [OWASP Top 10:2025](https://top10.owasp.org/2025/en/)
- [Next.js Data Security](https://nextjs.org/docs/app/guides/data-security)
- [Supabase Production Security Checklist](https://supabase.com/docs/guides/security/production-checklist)
- [Supabase Auth Rate Limits](https://supabase.com/docs/guides/auth/rate-limits)

## Resultado final

Score final estimado: **89/100**. O score considera o código e o ambiente local; não substitui pentest nem validação do projeto Supabase real.

| ID | Correção aplicada | Status final |
| --- | --- | --- |
| SEC-01 | Migration adiciona `user_id`, policies próprias e RPC com destinatário; consulta e action também filtram proprietário | CORRIGIDO; aplicar migration e testar com dois usuários |
| SEC-02 | `safeInternalPath` rejeita URL absoluta, `//`, barras invertidas, controles e formas percent-encoded | CORRIGIDO E TESTADO |
| SEC-03 | CSP com `frame-ancestors`, `nosniff`, Referrer, Permissions Policy, DNS prefetch e HSTS em produção | CORRIGIDO; CSP ainda usa `unsafe-inline` por compatibilidade com Next.js |
| SEC-04 | Login e recuperação limitados por IP/e-mail, além dos limites do provedor | CORRIGIDO LOCALMENTE; usar armazenamento compartilhado em produção |
| SEC-05 | Todos os POSTs de Auth agora exigem `Origin` da própria aplicação | CORRIGIDO E TESTADO |
| SEC-06 | Server Actions reduzidas para 35 MB; imagens limitadas a quatro, 8 MB cada e 32 MB no total | CORRIGIDO |
| SEC-07 | Upload cruza MIME/extensão, verifica magic bytes e deriva a extensão do MIME validado | CORRIGIDO E TESTADO |
| SEC-08 | Allowlists e limites adicionados a imóveis, tarefas e visitas | CORRIGIDO NO ESCOPO DE MAIOR RISCO |
| SEC-09 | Cookie demo e login arbitrário ficam desabilitados quando `NODE_ENV=production` | CORRIGIDO |
| SEC-10 | Defesa local preservada; ausência de rate limiter distribuído | PENDENTE PARA INFRAESTRUTURA |
| SEC-11 | Service role removida do template; documentação desencoraja sua configuração | CORRIGIDO |
| SEC-12 | Respostas administrativas recebem `private, no-store` | CORRIGIDO |

### Evidências de validação

- `npm test`: 35/35 testes aprovados, incluindo redirect, CSRF, rate limit, XSS, assinatura de imagem, modo demo em produção, ordem das migrations e policy RLS.
- `npm run typecheck`, `npm run lint` e `npm run build`: aprovados.
- `npm audit --omit=dev`: zero vulnerabilidades conhecidas.
- Navegador: logout bloqueou `/admin`; login com `redirectTo=//evil.example` permaneceu em `/admin`; ID inexistente retornou 404; payload XSS foi exibido como texto; formulário público foi aceito; exportação CSV autenticada foi acionada.
- Headers observados em `localhost`: CSP, `nosniff` e Referrer Policy ativos.

### Pendências e riscos do ambiente real

- Aplicar `202611100006_security_hardening.sql` em staging e validar matriz usuário A/B para todas as tabelas, RPCs e objetos do Storage.
- A captação pública é direcionada ao primeiro usuário com `organization_settings` (fallback: primeiro perfil), adequado ao modelo atual de uma imobiliária. Um futuro modelo multi-organização deve resolver a organização explicitamente por domínio/tenant.
- Registros antigos sem usuário e sem perfil permanecem com `user_id` nulo e invisíveis até migração assistida; isso evita exposição acidental.
- Validar recuperação de senha, URLs assinadas, expiração, remoção de arquivos e Security Advisor no projeto Supabase real. Esses fluxos não podem ser certificados sem credenciais e dois usuários de staging.
- Substituir Maps locais por rate limiting compartilhado/WAF e configurar MFA, política de senha, alertas, backups e rotação de segredos antes da produção.
- Considerar CSP com nonce para retirar `unsafe-inline`; `unsafe-eval` existe apenas em desenvolvimento para o debugger do React.

## Validação de staging — atualização de 18/11/2026

### VALIDADO EM AMBIENTE REAL

- As seis migrations locais correspondem às seis versões do histórico remoto.
- O Security Advisor remoto foi executado. Ele apontou grants amplos em funções de trigger, grants esperados nas RPCs públicas, grant autenticado da conversão de lead e proteção contra senhas vazadas desabilitada.
- Um seed idempotente exclusivamente fictício foi aplicado a um perfil de staging antes vazio; isso valida conectividade e escrita administrativa, não isolamento A/B.

### VALIDADO LOCALMENTE

- As seis migrations estão presentes, numeradas e ordenadas da Fase 2 ao hardening da Fase 8; nenhuma migration antiga foi modificada nesta etapa.
- Supabase CLI 3.2.0 disponível via `npx`; `supabase/config.toml` permanece sem secrets.
- `.env.example` contém somente placeholders; `.env*` permanece ignorado e a aplicação não utiliza service role.
- Teste automatizado confirma que modo demo é recusado quando `NODE_ENV=production`.
- Testes automatizados cobrem redirect interno, origem dos POSTs de Auth, rate limit, XSS, upload, CSV e presença da policy própria de captações.
- A ordem de aplicação, matriz RLS e roteiros A/B, Storage, Auth, Advisor e headers estão documentados em `STAGING_VALIDATION.md`.

### PENDENTE PARA PRODUÇÃO

- Executar toda a matriz A/B e registrar respostas e ausência de mutação no banco.
- Validar bucket privado, exclusão cruzada, arquivo privado, URL assinada válida e expirada, incluindo a exceção intencional de imagens públicas.
- Validar login, logout, revogação/expiração de sessão, recuperação e redefinição de senha com SMTP e redirect allowlist reais.
- Revisar e decidir cada aviso do Security Advisor, incluindo grants de funções e proteção contra senhas vazadas.
- Confirmar variáveis do deploy sem revelar valores e verificar headers na URL HTTPS publicada, inclusive bloqueio por iframe.
- Reexecutar a suíte após a configuração do staging e anexar evidências. Falhas de isolamento impedem o deploy.

## Hardening de funções SECURITY DEFINER — 19/11/2026

### VALIDADO EM AMBIENTE REAL

- A migration `202611190002_restrict_security_definer_execute.sql` foi aplicada ao staging e registrada no histórico remoto.
- `handle_new_user()`, `record_client_stage_change()` e `rls_auto_enable()` perderam `EXECUTE` de `PUBLIC`, `anon` e `authenticated`; os respectivos triggers continuam funcionando.
- `submit_property_lead(...)` e `submit_property_submission(...)` preservam `anon` e `authenticated`, pois os formulários públicos usam a role da sessão atual e também devem funcionar para corretores logados.
- `convert_lead_to_client(uuid)` permanece somente para `authenticated` e valida o proprietário com `auth.uid()`.
- Testes descartáveis confirmaram criação de perfil, login, leads e captações públicas, conversão de lead, movimentação de funil, portal público e isolamento RLS A/B. A limpeza foi concluída.
- O Security Advisor caiu de 12 para 6 warnings: cinco grants intencionais das RPCs e a proteção contra senhas vazadas desabilitada.

### VALIDADO LOCALMENTE

- As seis funções auditadas possuem `search_path` fixo e referências qualificadas por schema.
- `npm test` aprovou 46/46 testes; typecheck, lint e build foram aprovados.

### PENDENTE PARA PRODUÇÃO

- Avaliar e habilitar Leaked Password Protection no Supabase Auth depois de validar compatibilidade com a política de senhas e os usuários reais. A configuração não foi alterada automaticamente.
- Manter os cinco warnings de `SECURITY DEFINER` documentados enquanto as RPCs permanecerem necessárias; qualquer mudança de arquitetura deve reavaliar seus grants e testes de abuso.
