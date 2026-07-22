-- seed.sql
-- Dados de exemplo em PT-BR (uma clínica), espelhando os mocks do frontend.
-- Rodar como superusuário/owner (via psql) — o RLS é ignorado nesse contexto.
-- Idempotente: limpa e recria os dados da clínica de exemplo.

do $$
declare
  v_clinic uuid := '00000000-0000-0000-0000-0000000c1171';
  v_marina uuid := '00000000-0000-0000-0000-00000000d001';
  v_rafael uuid := '00000000-0000-0000-0000-00000000d002';
  v_ana    uuid := '00000000-0000-0000-0000-00000000d003';
  v_unimed uuid := '00000000-0000-0000-0000-0000000c0001';
  v_brad   uuid := '00000000-0000-0000-0000-0000000c0002';
  v_amil   uuid := '00000000-0000-0000-0000-0000000c0003';
  v_beatriz uuid := '00000000-0000-0000-0000-0000000fa001';
  v_lucas   uuid := '00000000-0000-0000-0000-0000000fa002';
begin
  -- Limpa dados anteriores desta clínica (respeita as FKs via cascade)
  delete from clinics where id = v_clinic;

  insert into clinics (id, name, legal_name, document, phone, whatsapp, email,
    address, main_specialty, timezone, default_appointment_minutes)
  values (v_clinic, 'Clínica Sorriso', 'Sorriso Odontologia LTDA',
    '12.345.678/0001-90', '(35) 3333-1000', '(35) 99999-1000',
    'contato@clinicasorriso.com.br', 'Rua das Flores, 100 - Centro',
    'Odontologia', 'America/Sao_Paulo', 30);

  -- Profissionais
  insert into professionals (id, clinic_id, full_name, specialty, council_type,
    council_number, calendar_color) values
    (v_marina, v_clinic, 'Dra. Marina Lopes', 'Clínico Geral', 'CRO', 'MG-12345', '#176B87'),
    (v_rafael, v_clinic, 'Dr. Rafael Costa', 'Endodontia', 'CRO', 'MG-23456', '#2F8FA3'),
    (v_ana,    v_clinic, 'Dra. Ana Beatriz', 'Ortodontia', 'CRO', 'MG-34567', '#7566B8');

  -- Convênios
  insert into insurance_companies (id, clinic_id, name, average_payment_days) values
    (v_unimed, v_clinic, 'Unimed', 30),
    (v_brad,   v_clinic, 'Bradesco Saúde', 45),
    (v_amil,   v_clinic, 'Amil Dental', 40);

  -- Procedimentos
  insert into procedures (clinic_id, name, category, default_duration_minutes, private_price) values
    (v_clinic, 'Avaliação', 'Consulta', 30, 180.00),
    (v_clinic, 'Limpeza', 'Preventivo', 60, 220.00),
    (v_clinic, 'Restauração', 'Dentística', 90, 420.00),
    (v_clinic, 'Clareamento', 'Estética', 60, 650.00),
    (v_clinic, 'Extração', 'Cirurgia', 60, 300.00),
    (v_clinic, 'Retorno', 'Consulta', 30, 0.00);

  -- Pacientes (telefone normalizado em E.164)
  insert into patients (id, clinic_id, full_name, normalized_phone, phone_display,
    cpf, main_professional_id, insurance_company_id, communication_consent) values
    (v_beatriz, v_clinic, 'Beatriz Almeida', '+5535999128432', '(35) 99912-8432',
      '123.456.789-00', v_marina, null, true),
    (v_lucas, v_clinic, 'Lucas Ferreira', '+5535988412093', '(35) 98841-2093',
      '234.567.890-11', v_rafael, v_unimed, true),
    (gen_random_uuid(), v_clinic, 'Camila Nogueira', '+5535997205518', '(35) 99720-5518',
      '345.678.901-22', v_ana, null, true),
    (gen_random_uuid(), v_clinic, 'Pedro Martins', '+5535991063374', '(35) 99106-3374',
      '456.789.012-33', v_marina, v_brad, false),
    (gen_random_uuid(), v_clinic, 'Mariana Silva', '+5535984136620', '(35) 98413-6620',
      '567.890.123-44', v_rafael, null, true);

  -- Agendamentos da semana de 20 a 24 de julho de 2026 (fuso -03:00)
  insert into appointments (clinic_id, patient_id, professional_id, procedure_id,
    care_type, start_at, end_at, status, expected_value, source) values
    (v_clinic, v_beatriz, v_marina,
      (select id from procedures where clinic_id = v_clinic and name = 'Avaliação'),
      'private', '2026-07-20T08:00:00-03:00', '2026-07-20T09:00:00-03:00',
      'confirmed', 180.00, 'reception'),
    (v_clinic, v_lucas, v_rafael,
      (select id from procedures where clinic_id = v_clinic and name = 'Limpeza'),
      'insurance', '2026-07-20T10:00:00-03:00', '2026-07-20T11:00:00-03:00',
      'scheduled', 120.00, 'ai_agent');

  -- Movimentações financeiras
  insert into financial_transactions (clinic_id, patient_id, type, category,
    description, amount, payment_method, status, paid_at) values
    (v_clinic, v_beatriz, 'income', 'Procedimento',
      'Avaliação • Beatriz Almeida', 180.00, 'pix', 'paid', now()),
    (v_clinic, null, 'expense', 'Materiais',
      'Materiais odontológicos', 840.00, 'bank_slip', 'paid', now()),
    (v_clinic, v_lucas, 'income', 'Procedimento',
      'Limpeza • Lucas Ferreira', 120.00, 'insurance', 'pending', null);
end;
$$;
