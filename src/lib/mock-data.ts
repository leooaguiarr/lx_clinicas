export type Status =
  | "Agendado"
  | "Confirmado"
  | "Atendido"
  | "Cancelado"
  | "Faltou";
export type CareType = "Particular" | "Convênio";

export const professionals = [
  "Todos os profissionais",
  "Dra. Marina Lopes",
  "Dr. Rafael Costa",
  "Dra. Ana Beatriz",
];

export type Appointment = {
  id: number;
  date: string; // ISO yyyy-mm-dd
  start: string;
  duration: number; // em slots de 30min
  patient: string;
  procedure: string;
  professional: string;
  type: CareType;
  status: Status;
};

export const appointments: Appointment[] = [
  // Semana de 20 a 24 de julho de 2026
  {
    id: 1,
    date: "2026-07-20",
    start: "08:00",
    duration: 2,
    patient: "Beatriz Almeida",
    procedure: "Avaliação",
    professional: "Dra. Marina Lopes",
    type: "Particular",
    status: "Confirmado",
  },
  {
    id: 2,
    date: "2026-07-20",
    start: "10:00",
    duration: 2,
    patient: "Lucas Ferreira",
    procedure: "Limpeza",
    professional: "Dr. Rafael Costa",
    type: "Convênio",
    status: "Agendado",
  },
  {
    id: 3,
    date: "2026-07-21",
    start: "09:00",
    duration: 3,
    patient: "Camila Nogueira",
    procedure: "Restauração",
    professional: "Dra. Ana Beatriz",
    type: "Particular",
    status: "Confirmado",
  },
  {
    id: 4,
    date: "2026-07-22",
    start: "08:30",
    duration: 2,
    patient: "Pedro Martins",
    procedure: "Retorno",
    professional: "Dra. Marina Lopes",
    type: "Convênio",
    status: "Atendido",
  },
  {
    id: 5,
    date: "2026-07-23",
    start: "11:00",
    duration: 2,
    patient: "Mariana Silva",
    procedure: "Clareamento",
    professional: "Dr. Rafael Costa",
    type: "Particular",
    status: "Agendado",
  },
  {
    id: 6,
    date: "2026-07-24",
    start: "09:30",
    duration: 2,
    patient: "João Oliveira",
    procedure: "Avaliação",
    professional: "Dra. Ana Beatriz",
    type: "Convênio",
    status: "Confirmado",
  },
  // Semana de 27 a 31 de julho de 2026
  {
    id: 7,
    date: "2026-07-27",
    start: "09:00",
    duration: 2,
    patient: "Fernanda Rocha",
    procedure: "Limpeza",
    professional: "Dra. Marina Lopes",
    type: "Particular",
    status: "Agendado",
  },
  {
    id: 8,
    date: "2026-07-28",
    start: "14:00",
    duration: 2,
    patient: "Ricardo Teixeira",
    procedure: "Extração",
    professional: "Dr. Rafael Costa",
    type: "Convênio",
    status: "Agendado",
  },
  {
    id: 9,
    date: "2026-07-30",
    start: "10:30",
    duration: 3,
    patient: "Beatriz Almeida",
    procedure: "Restauração",
    professional: "Dra. Marina Lopes",
    type: "Particular",
    status: "Agendado",
  },
];

export type Patient = {
  id: string;
  name: string;
  phone: string;
  cpf: string;
  last: string;
  next: string;
  professional: string;
  type: CareType;
  insurance: string;
  balance: number;
  status: string;
};

export const patients: Patient[] = [
  {
    id: "beatriz-almeida",
    name: "Beatriz Almeida",
    phone: "(35) 99912-8432",
    cpf: "123.456.789-00",
    last: "08/07/2026",
    next: "21/07, 08:00",
    professional: "Dra. Marina Lopes",
    type: "Particular",
    insurance: "—",
    balance: 0,
    status: "Ativo",
  },
  {
    id: "lucas-ferreira",
    name: "Lucas Ferreira",
    phone: "(35) 98841-2093",
    cpf: "234.567.890-11",
    last: "10/06/2026",
    next: "21/07, 10:00",
    professional: "Dr. Rafael Costa",
    type: "Convênio",
    insurance: "Unimed",
    balance: 120,
    status: "Pendente",
  },
  {
    id: "camila-nogueira",
    name: "Camila Nogueira",
    phone: "(35) 99720-5518",
    cpf: "345.678.901-22",
    last: "02/07/2026",
    next: "22/07, 09:00",
    professional: "Dra. Ana Beatriz",
    type: "Particular",
    insurance: "—",
    balance: 0,
    status: "Ativo",
  },
  {
    id: "pedro-martins",
    name: "Pedro Martins",
    phone: "(35) 99106-3374",
    cpf: "456.789.012-33",
    last: "20/07/2026",
    next: "—",
    professional: "Dra. Marina Lopes",
    type: "Convênio",
    insurance: "Bradesco Saúde",
    balance: 85,
    status: "Pendente",
  },
  {
    id: "mariana-silva",
    name: "Mariana Silva",
    phone: "(35) 98413-6620",
    cpf: "567.890.123-44",
    last: "15/05/2026",
    next: "24/07, 11:00",
    professional: "Dr. Rafael Costa",
    type: "Particular",
    insurance: "—",
    balance: 0,
    status: "Ativo",
  },
  {
    id: "joao-oliveira",
    name: "João Oliveira",
    phone: "(35) 99284-7751",
    cpf: "678.901.234-55",
    last: "30/06/2026",
    next: "24/07, 09:30",
    professional: "Dra. Ana Beatriz",
    type: "Convênio",
    insurance: "Amil Dental",
    balance: 0,
    status: "Ativo",
  },
  {
    id: "fernanda-rocha",
    name: "Fernanda Rocha",
    phone: "(35) 99655-0912",
    cpf: "789.012.345-66",
    last: "12/07/2026",
    next: "27/07, 09:00",
    professional: "Dra. Marina Lopes",
    type: "Particular",
    insurance: "—",
    balance: 0,
    status: "Ativo",
  },
  {
    id: "ricardo-teixeira",
    name: "Ricardo Teixeira",
    phone: "(35) 98122-4467",
    cpf: "890.123.456-77",
    last: "05/06/2026",
    next: "28/07, 14:00",
    professional: "Dr. Rafael Costa",
    type: "Convênio",
    insurance: "Unimed",
    balance: 240,
    status: "Pendente",
  },
  {
    id: "aline-castro",
    name: "Aline Castro",
    phone: "(35) 99340-8825",
    cpf: "901.234.567-88",
    last: "18/07/2026",
    next: "—",
    professional: "Dra. Ana Beatriz",
    type: "Particular",
    insurance: "—",
    balance: 0,
    status: "Ativo",
  },
  {
    id: "gustavo-mendes",
    name: "Gustavo Mendes",
    phone: "(35) 98770-3319",
    cpf: "012.345.678-99",
    last: "25/04/2026",
    next: "—",
    professional: "Dr. Rafael Costa",
    type: "Convênio",
    insurance: "Bradesco Saúde",
    balance: 0,
    status: "Inativo",
  },
  {
    id: "patricia-lima",
    name: "Patrícia Lima",
    phone: "(35) 99501-6684",
    cpf: "111.222.333-44",
    last: "09/07/2026",
    next: "—",
    professional: "Dra. Marina Lopes",
    type: "Particular",
    insurance: "—",
    balance: 60,
    status: "Pendente",
  },
  {
    id: "andre-souza",
    name: "André Souza",
    phone: "(35) 98218-9053",
    cpf: "222.333.444-55",
    last: "01/07/2026",
    next: "—",
    professional: "Dra. Ana Beatriz",
    type: "Convênio",
    insurance: "Amil Dental",
    balance: 0,
    status: "Ativo",
  },
];

export type Transaction = {
  date: string;
  description: string;
  category: "Receita" | "Despesa";
  method: string;
  amount: number;
  status: "Pago" | "Pendente" | "Parcial" | "Atrasado";
};

export const transactions: Transaction[] = [
  {
    date: "21/07/2026",
    description: "Avaliação • Beatriz Almeida",
    category: "Receita",
    method: "Pix",
    amount: 180,
    status: "Pago",
  },
  {
    date: "21/07/2026",
    description: "Materiais odontológicos",
    category: "Despesa",
    method: "Boleto",
    amount: -840,
    status: "Pago",
  },
  {
    date: "20/07/2026",
    description: "Limpeza • Lucas Ferreira",
    category: "Receita",
    method: "Convênio",
    amount: 120,
    status: "Pendente",
  },
  {
    date: "18/07/2026",
    description: "Clareamento • Mariana Silva",
    category: "Receita",
    method: "Crédito",
    amount: 650,
    status: "Parcial",
  },
  {
    date: "15/07/2026",
    description: "Retorno • Pedro Martins",
    category: "Receita",
    method: "Convênio",
    amount: 85,
    status: "Atrasado",
  },
  {
    date: "14/07/2026",
    description: "Aluguel da unidade",
    category: "Despesa",
    method: "Transferência",
    amount: -3200,
    status: "Pago",
  },
];

export type PatientEvent = {
  patientId: string;
  date: string;
  time: string;
  procedure: string;
  professional: string;
  type: CareType;
  status: Status;
  value: number;
};

// Histórico de agendamentos exibido no perfil do paciente
export const patientAppointments: PatientEvent[] = [
  {
    patientId: "beatriz-almeida",
    date: "30/07/2026",
    time: "10:30",
    procedure: "Restauração",
    professional: "Dra. Marina Lopes",
    type: "Particular",
    status: "Agendado",
    value: 420,
  },
  {
    patientId: "beatriz-almeida",
    date: "21/07/2026",
    time: "08:00",
    procedure: "Avaliação",
    professional: "Dra. Marina Lopes",
    type: "Particular",
    status: "Confirmado",
    value: 180,
  },
  {
    patientId: "beatriz-almeida",
    date: "08/07/2026",
    time: "09:00",
    procedure: "Limpeza",
    professional: "Dra. Marina Lopes",
    type: "Particular",
    status: "Atendido",
    value: 220,
  },
  {
    patientId: "beatriz-almeida",
    date: "12/05/2026",
    time: "14:00",
    procedure: "Avaliação",
    professional: "Dra. Marina Lopes",
    type: "Particular",
    status: "Faltou",
    value: 180,
  },
  {
    patientId: "lucas-ferreira",
    date: "21/07/2026",
    time: "10:00",
    procedure: "Limpeza",
    professional: "Dr. Rafael Costa",
    type: "Convênio",
    status: "Agendado",
    value: 120,
  },
  {
    patientId: "lucas-ferreira",
    date: "10/06/2026",
    time: "11:00",
    procedure: "Restauração",
    professional: "Dr. Rafael Costa",
    type: "Convênio",
    status: "Atendido",
    value: 260,
  },
  {
    patientId: "camila-nogueira",
    date: "22/07/2026",
    time: "09:00",
    procedure: "Restauração",
    professional: "Dra. Ana Beatriz",
    type: "Particular",
    status: "Confirmado",
    value: 420,
  },
  {
    patientId: "camila-nogueira",
    date: "02/07/2026",
    time: "15:30",
    procedure: "Avaliação",
    professional: "Dra. Ana Beatriz",
    type: "Particular",
    status: "Atendido",
    value: 180,
  },
];

export type HistoryEntry = {
  patientId: string;
  date: string;
  author: string;
  text: string;
};

export const patientHistory: HistoryEntry[] = [
  {
    patientId: "beatriz-almeida",
    date: "08/07/2026",
    author: "Dra. Marina Lopes",
    text: "Profilaxia realizada sem intercorrências. Orientações de higiene reforçadas.",
  },
  {
    patientId: "beatriz-almeida",
    date: "21/06/2026",
    author: "Recepção",
    text: "Telefone de contato atualizado a pedido da paciente.",
  },
  {
    patientId: "beatriz-almeida",
    date: "12/05/2026",
    author: "Recepção",
    text: "Paciente faltou à consulta. Reagendamento oferecido via WhatsApp.",
  },
  {
    patientId: "lucas-ferreira",
    date: "10/06/2026",
    author: "Dr. Rafael Costa",
    text: "Restauração no dente 26 concluída. Retorno em 6 meses.",
  },
  {
    patientId: "camila-nogueira",
    date: "02/07/2026",
    author: "Dra. Ana Beatriz",
    text: "Avaliação inicial. Indicada restauração no dente 14.",
  },
];
