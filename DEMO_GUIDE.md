# Roteiro de Demonstração

## Preparação

1. Confirme o staging e faça login com o usuário que recebeu os dados fictícios.
2. Abra uma janela anônima para o portal público.
3. Não use nem cadastre dados pessoais reais durante a apresentação.

## Roteiro sugerido — 10 a 15 minutos

1. **Portal público:** apresente a home, os destaques e a busca de imóveis.
2. **Catálogo:** abra `/imoveis`, use finalidade/tipo/bairro e entre no imóvel `AP-1042`.
3. **Conversão:** mostre “Tenho interesse” sem enviar o formulário; depois abra `/anuncie-seu-imovel`.
4. **Login:** entre no painel e explique o isolamento por conta.
5. **Hoje:** comece por `/admin/hoje` e mostre retornos, pendências, visitas e leads prioritários.
6. **Dashboard:** destaque retornos atrasados, tarefas, visitas, imóveis e clientes ativos; abra um card para provar a navegação.
7. **Clientes e Funil:** abra João da Silva, mostre histórico, interesses e próximas ações; depois apresente o funil sem salvar uma mudança desnecessária.
8. **Imóveis:** mostre filtros, cadastro, detalhe e gerenciamento de imagens.
9. **Agenda e Pendências:** apresente itens de hoje, próximos e concluídos.
10. **Leads e Captações:** explique o fluxo de entrada até a conversão em cliente.
11. **Relatórios e Configurações:** finalize com indicadores, CSV e campos preparados para personalização futura.

## Cuidados

- Evite excluir registros durante a apresentação.
- Não exponha `.env.local`, tokens, UUIDs completos ou o painel SQL.
- Se uma sessão expirar, volte a `/login`; não ative modo demonstrativo em staging.
- Em caso de indisponibilidade externa, use as telas públicas já abertas e descreva o painel com base neste roteiro.
