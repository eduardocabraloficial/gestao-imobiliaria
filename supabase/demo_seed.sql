-- Dados fictícios para o projeto de staging.
-- NÃO é uma migration e não deve ser aplicado em produção.
-- O script escolhe somente um perfil sem clientes para não misturar dados.

do $$
declare
  v_user_id uuid;
  v_today date := (now() at time zone 'America/Cayenne')::date;
begin
  select p.id into v_user_id
  from public.profiles p
  where not exists (select 1 from public.clients c where c.user_id = p.id)
  order by p.created_at
  limit 1;

  if v_user_id is null then
    raise exception 'Nenhum perfil vazio disponível para receber os dados demonstrativos.';
  end if;

  insert into public.organization_settings (
    id, user_id, business_name, trade_name, creci, phone, whatsapp, email,
    address, instagram, website, description, primary_color, secondary_color,
    hero_title, hero_subtitle, footer_text
  ) values (
    'd0000000-0000-4000-8000-000000000001', v_user_id,
    'Gestão Imobiliária — Demonstração', 'Gestão Imobiliária', 'CRECI 00000-J',
    '(11) 4000-0000', '(11) 99999-0000', 'contato@gestaoimobiliaria.com.br',
    'São Paulo — SP', '@gestaoimobiliaria', 'https://example.com',
    'Ambiente fictício preparado exclusivamente para demonstração.',
    '#173f35', '#d7bd94', 'Encontre o imóvel ideal para o seu próximo capítulo',
    'Atendimento próximo, carteira selecionada e acompanhamento em cada etapa.',
    'Dados e contatos apresentados neste ambiente são fictícios.'
  )
  on conflict (user_id) do update set
    business_name = excluded.business_name, trade_name = excluded.trade_name,
    creci = excluded.creci, phone = excluded.phone, whatsapp = excluded.whatsapp,
    email = excluded.email, address = excluded.address, instagram = excluded.instagram,
    website = excluded.website, description = excluded.description,
    primary_color = excluded.primary_color, secondary_color = excluded.secondary_color,
    hero_title = excluded.hero_title, hero_subtitle = excluded.hero_subtitle,
    footer_text = excluded.footer_text;

  insert into public.clients (
    id, user_id, name, phone, whatsapp, email, source, purpose, property_type,
    neighborhoods, min_price, max_price, bedrooms, notes, stage, estimated_value, loss_reason
  ) values
    ('d1000000-0000-4000-8000-000000000001', v_user_id, 'João da Silva', '(11) 98880-1042', '(11) 98880-1042', 'joao.demo@example.com', 'Indicação', 'Compra', 'Apartamento', array['Jardim Europa', 'Itaim Bibi'], 900000, 1300000, 3, 'Busca varanda e duas vagas. Dados fictícios.', 'qualificacao', 1180000, null),
    ('d1000000-0000-4000-8000-000000000002', v_user_id, 'Maria Santos', '(11) 97770-2081', '(11) 97770-2081', 'maria.demo@example.com', 'Instagram', 'Compra', 'Casa', array['Alphaville', 'Tamboré'], 1400000, 2000000, 4, 'Prioriza condomínio e área de lazer. Dados fictícios.', 'negociacao', 1790000, null),
    ('d1000000-0000-4000-8000-000000000003', v_user_id, 'Carlos Lima', '(11) 96660-3310', '(11) 96660-3310', 'carlos.demo@example.com', 'Site', 'Compra', 'Studio', array['Pinheiros', 'Vila Madalena'], 450000, 650000, 1, 'Imóvel para investimento. Dados fictícios.', 'visita_agendada', 590000, null),
    ('d1000000-0000-4000-8000-000000000004', v_user_id, 'Ana Souza', '(11) 95550-7715', '(11) 95550-7715', 'ana.demo@example.com', 'Site', 'Aluguel', 'Apartamento', array['Moema'], 4000, 7000, 2, 'Precisa de imóvel mobiliado. Dados fictícios.', 'documentacao', 6200, null),
    ('d1000000-0000-4000-8000-000000000005', v_user_id, 'Roberto Almeida', '(11) 94440-5522', '(11) 94440-5522', 'roberto.demo@example.com', 'Evento', 'Compra', 'Apartamento', array['Vila Nova Conceição'], 1800000, 2600000, 3, 'Atendimento demonstrativo encerrado.', 'perdido', 2200000, 'Cliente fictício optou por adiar a compra.')
  on conflict (id) do update set
    name = excluded.name, phone = excluded.phone, whatsapp = excluded.whatsapp,
    email = excluded.email, source = excluded.source, purpose = excluded.purpose,
    property_type = excluded.property_type, neighborhoods = excluded.neighborhoods,
    min_price = excluded.min_price, max_price = excluded.max_price,
    bedrooms = excluded.bedrooms, notes = excluded.notes, stage = excluded.stage,
    estimated_value = excluded.estimated_value, loss_reason = excluded.loss_reason;

  insert into public.properties (
    id, user_id, code, title, purpose, property_type, description, price,
    condominium_fee, iptu, address, neighborhood, city, state, zip_code,
    area, bedrooms, suites, bathrooms, parking_spaces, furnished, pets_allowed,
    featured, status, image_url, is_public, characteristics
  ) values
    ('d2000000-0000-4000-8000-000000000001', v_user_id, 'AP-1042', 'Apartamento com vista aberta e varanda gourmet', 'venda', 'Apartamento', 'Ambientes amplos, varanda gourmet e excelente iluminação natural.', 1180000, 980, 420, 'Alameda das Flores, 120', 'Jardim Europa', 'São Paulo', 'SP', '01400-000', 128, 3, 1, 3, 2, false, true, true, 'disponivel', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85', true, array['Varanda gourmet', 'Iluminação natural', 'Portaria 24 horas']),
    ('d2000000-0000-4000-8000-000000000002', v_user_id, 'AP-7715', 'Apartamento mobiliado a poucos passos do parque', 'aluguel', 'Apartamento', 'Pronto para morar, mobiliado e com localização privilegiada em Moema.', 6200, 1100, 310, 'Alameda dos Arapanés, 715', 'Moema', 'São Paulo', 'SP', '04524-001', 92, 2, 1, 2, 1, true, true, true, 'disponivel', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=85', true, array['Mobiliado', 'Próximo ao parque', 'Ar-condicionado']),
    ('d2000000-0000-4000-8000-000000000003', v_user_id, 'CA-2081', 'Casa contemporânea em condomínio exclusivo', 'venda', 'Casa', 'Casa ampla com jardim, piscina e espaços integrados para receber.', 1790000, 1350, 650, 'Alameda das Acácias, 81', 'Alphaville', 'Barueri', 'SP', '06454-010', 310, 4, 3, 5, 4, false, true, false, 'disponivel', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85', true, array['Piscina', 'Jardim', 'Condomínio fechado']),
    ('d2000000-0000-4000-8000-000000000004', v_user_id, 'ST-3310', 'Studio moderno próximo ao metrô', 'venda', 'Studio', 'Planta inteligente para morar ou investir, perto de serviços e mobilidade.', 590000, 540, 180, 'Rua dos Pinheiros, 331', 'Pinheiros', 'São Paulo', 'SP', '05422-010', 42, 1, 0, 1, 1, true, true, false, 'disponivel', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85', true, array['Mobiliado', 'Coworking', 'Próximo ao metrô']),
    ('d2000000-0000-4000-8000-000000000005', v_user_id, 'AP-5522', 'Cobertura com terraço e vista panorâmica', 'venda', 'Cobertura', 'Cobertura fictícia usada para demonstrar imóveis reservados.', 2350000, 1800, 790, 'Rua Domingos Leme, 522', 'Vila Nova Conceição', 'São Paulo', 'SP', '04510-041', 210, 3, 3, 4, 3, false, true, false, 'reservado', 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=85', false, array['Terraço', 'Vista panorâmica', 'Elevador privativo'])
  on conflict (id) do update set
    code = excluded.code, title = excluded.title, purpose = excluded.purpose,
    property_type = excluded.property_type, description = excluded.description,
    price = excluded.price, condominium_fee = excluded.condominium_fee,
    iptu = excluded.iptu, address = excluded.address, neighborhood = excluded.neighborhood,
    city = excluded.city, state = excluded.state, zip_code = excluded.zip_code,
    area = excluded.area, bedrooms = excluded.bedrooms, suites = excluded.suites,
    bathrooms = excluded.bathrooms, parking_spaces = excluded.parking_spaces,
    furnished = excluded.furnished, pets_allowed = excluded.pets_allowed,
    featured = excluded.featured, status = excluded.status, image_url = excluded.image_url,
    is_public = excluded.is_public, characteristics = excluded.characteristics;

  insert into public.client_property_interests (id, user_id, client_id, property_id, notes) values
    ('d3000000-0000-4000-8000-000000000001', v_user_id, 'd1000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001', 'Principal opção apresentada ao cliente.'),
    ('d3000000-0000-4000-8000-000000000002', v_user_id, 'd1000000-0000-4000-8000-000000000002', 'd2000000-0000-4000-8000-000000000003', 'Negociação em andamento.'),
    ('d3000000-0000-4000-8000-000000000003', v_user_id, 'd1000000-0000-4000-8000-000000000003', 'd2000000-0000-4000-8000-000000000004', 'Visita agendada.'),
    ('d3000000-0000-4000-8000-000000000004', v_user_id, 'd1000000-0000-4000-8000-000000000004', 'd2000000-0000-4000-8000-000000000002', 'Documentação em análise.')
  on conflict (client_id, property_id) do update set notes = excluded.notes;

  insert into public.interactions (id, client_id, user_id, type, description, occurred_at) values
    ('d4000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', v_user_id, 'whatsapp', 'Cliente confirmou interesse e pediu mais detalhes da varanda.', (v_today - 8) + time '10:15'),
    ('d4000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002', v_user_id, 'reuniao', 'Reunião fictícia para alinhamento da proposta.', (v_today - 2) + time '15:00'),
    ('d4000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000004', v_user_id, 'email', 'Documentos demonstrativos recebidos para análise.', (v_today - 1) + time '11:20')
  on conflict (id) do update set description = excluded.description, occurred_at = excluded.occurred_at;

  insert into public.follow_ups (id, client_id, user_id, scheduled_at, notes, status, completed_at) values
    ('d5000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', v_user_id, (v_today - 1) + time '09:30', 'Retorno demonstrativo atrasado.', 'pendente', null),
    ('d5000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002', v_user_id, v_today + time '11:00', 'Confirmar condições da proposta.', 'pendente', null),
    ('d5000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000003', v_user_id, (v_today + 1) + time '14:30', 'Confirmar presença na visita.', 'pendente', null),
    ('d5000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000004', v_user_id, (v_today - 2) + time '10:00', 'Documentos recebidos.', 'concluido', (v_today - 2) + time '10:20')
  on conflict (id) do update set scheduled_at = excluded.scheduled_at, notes = excluded.notes, status = excluded.status, completed_at = excluded.completed_at;

  insert into public.appointments (id, user_id, client_id, property_id, scheduled_at, duration_minutes, notes, status) values
    ('d6000000-0000-4000-8000-000000000001', v_user_id, 'd1000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001', v_today + time '16:00', 60, 'Visita de hoje para demonstração.', 'agendada'),
    ('d6000000-0000-4000-8000-000000000002', v_user_id, 'd1000000-0000-4000-8000-000000000003', 'd2000000-0000-4000-8000-000000000004', (v_today + 1) + time '10:30', 45, 'Visita futura para demonstração.', 'agendada'),
    ('d6000000-0000-4000-8000-000000000003', v_user_id, 'd1000000-0000-4000-8000-000000000002', 'd2000000-0000-4000-8000-000000000003', (v_today - 1) + time '11:00', 60, 'Visita já realizada.', 'realizada')
  on conflict (id) do update set scheduled_at = excluded.scheduled_at, duration_minutes = excluded.duration_minutes, notes = excluded.notes, status = excluded.status;

  insert into public.tasks (id, user_id, client_id, property_id, title, description, due_at, priority, status, completed_at) values
    ('d7000000-0000-4000-8000-000000000001', v_user_id, 'd1000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001', 'Enviar documentação do imóvel', 'Pendência fictícia atrasada.', (v_today - 1) + time '17:00', 'alta', 'pendente', null),
    ('d7000000-0000-4000-8000-000000000002', v_user_id, 'd1000000-0000-4000-8000-000000000002', 'd2000000-0000-4000-8000-000000000003', 'Revisar condições da proposta', 'Pendência fictícia para hoje.', v_today + time '13:30', 'alta', 'pendente', null),
    ('d7000000-0000-4000-8000-000000000003', v_user_id, 'd1000000-0000-4000-8000-000000000003', 'd2000000-0000-4000-8000-000000000004', 'Confirmar visita do studio', 'Pendência fictícia para amanhã.', (v_today + 1) + time '09:00', 'media', 'pendente', null),
    ('d7000000-0000-4000-8000-000000000004', v_user_id, 'd1000000-0000-4000-8000-000000000004', 'd2000000-0000-4000-8000-000000000002', 'Solicitar comprovantes', 'Pendência demonstrativa concluída.', (v_today - 2) + time '12:00', 'baixa', 'concluida', (v_today - 2) + time '11:30')
  on conflict (id) do update set title = excluded.title, description = excluded.description, due_at = excluded.due_at, priority = excluded.priority, status = excluded.status, completed_at = excluded.completed_at;

  insert into public.leads (id, user_id, property_id, name, phone, whatsapp, email, message, source, status, created_at, converted_at, converted_client_id) values
    ('d8000000-0000-4000-8000-000000000001', v_user_id, 'd2000000-0000-4000-8000-000000000001', 'Fernanda Oliveira', '(11) 98888-3322', '(11) 98888-3322', 'fernanda.demo@example.com', 'Gostaria de conhecer o apartamento AP-1042.', 'site', 'novo', now() - interval '2 hours', null, null),
    ('d8000000-0000-4000-8000-000000000002', v_user_id, 'd2000000-0000-4000-8000-000000000002', 'Lucas Martins', '(11) 97777-2211', '(11) 97777-2211', 'lucas.demo@example.com', 'O apartamento mobiliado aceita contrato de 30 meses?', 'site', 'em_atendimento', now() - interval '1 day', null, null),
    ('d8000000-0000-4000-8000-000000000003', v_user_id, 'd2000000-0000-4000-8000-000000000004', 'Paula Ribeiro', '(11) 96666-1100', '(11) 96666-1100', 'paula.demo@example.com', 'Interesse demonstrativo já convertido.', 'site', 'convertido', now() - interval '3 days', now() - interval '2 days', 'd1000000-0000-4000-8000-000000000003')
  on conflict (id) do update set name = excluded.name, phone = excluded.phone, whatsapp = excluded.whatsapp, email = excluded.email, message = excluded.message, status = excluded.status, converted_at = excluded.converted_at, converted_client_id = excluded.converted_client_id;

  insert into public.property_submissions (id, user_id, owner_name, phone, email, purpose, property_type, neighborhood, city, desired_price, description, status) values
    ('d9000000-0000-4000-8000-000000000001', v_user_id, 'Renato Carvalho', '(11) 95555-8899', 'renato.demo@example.com', 'venda', 'Apartamento', 'Perdizes', 'São Paulo', 980000, 'Captação fictícia para apresentação.', 'novo'),
    ('d9000000-0000-4000-8000-000000000002', v_user_id, 'Beatriz Moura', '(11) 94444-7788', 'beatriz.demo@example.com', 'aluguel', 'Casa', 'Vila Mariana', 'São Paulo', 8500, 'Captação fictícia em análise.', 'em_analise')
  on conflict (id) do update set status = excluded.status, description = excluded.description;
end $$;

