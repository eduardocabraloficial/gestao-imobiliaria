# Estado do Projeto

Identidade visual definitiva aplicada para **Cabral House Negócios Imobiliários**, preservando os fluxos e dados demonstrativos existentes.

## FUNCIONAL

- Portal público: home, catálogo, filtros, detalhes, interesse e captação.
- Painel: Hoje, Dashboard, Clientes, Leads, Imóveis, Funil, Agenda, Pendências, Captações, Relatórios e Configurações.
- Autenticação, sessão, recuperação/redefinição, rotas protegidas e logout implementados.
- Estados de carregamento, erro, vazio, navegação responsiva e formatação pt-BR.
- Testes automatizados para regras comerciais e hardening crítico.

## EM STAGING

- Projeto Supabase vinculado; as seis migrations locais correspondem ao histórico remoto.
- Dois usuários de Auth e perfis existentes.
- Dados fictícios idempotentes carregados para um usuário antes vazio: 5 clientes, 5 imóveis, 4 retornos, 3 interações, 3 visitas, 4 pendências, 3 leads e 2 captações.
- Portal público validado em desktop e viewport móvel; `/admin` sem sessão redireciona para login.
- Security Advisor executado e avisos registrados para revisão.

## PENDENTE DE TESTE FINAL

- Smoke test autenticado de todas as telas administrativas com credenciais do responsável.
- Matriz A/B completa de SELECT, INSERT, UPDATE, DELETE, Server Actions e IDs diretos.
- Upload/exclusão cruzada no Storage e expiração real de URL assinada.
- Recuperação de senha por e-mail/SMTP e sessão expirada no ambiente publicado.
- Headers e bloqueio por iframe na URL HTTPS de staging.
- Revisão individual dos avisos do Security Advisor antes da produção.

## PENDENTE DE PERSONALIZAÇÃO

- Nome definitivo, logotipo, cores, textos institucionais e domínio.
- Telefone/WhatsApp, dados da organização e imagens próprias.
- Substituição dos registros fictícios por dados autorizados.

## FUTURO

- Organização multiusuário com papéis e permissões.
- Rate limiting distribuído/WAF, MFA, SMTP transacional e observabilidade.
- Automação comercial, integrações externas e melhorias de relatórios conforme uso real.

O projeto está preparado para demonstração em staging, mas não está declarado pronto para produção definitiva até a conclusão dos testes finais acima.
