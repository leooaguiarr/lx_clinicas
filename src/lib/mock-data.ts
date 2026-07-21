export type Status = "Agendado" | "Confirmado" | "Atendido" | "Cancelado" | "Faltou";
export type CareType = "Particular" | "Convênio";
export const professionals = ["Todos os profissionais", "Dra. Marina Lopes", "Dr. Rafael Costa", "Dra. Ana Beatriz"];
export const appointments = [
  { id: 1, day: 0, start: "08:00", duration: 2, patient: "Beatriz Almeida", procedure: "Avaliação", professional: "Dra. Marina Lopes", type: "Particular" as CareType, status: "Confirmado" as Status },
  { id: 2, day: 0, start: "10:00", duration: 2, patient: "Lucas Ferreira", procedure: "Limpeza", professional: "Dr. Rafael Costa", type: "Convênio" as CareType, status: "Agendado" as Status },
  { id: 3, day: 1, start: "09:00", duration: 3, patient: "Camila Nogueira", procedure: "Restauração", professional: "Dra. Ana Beatriz", type: "Particular" as CareType, status: "Confirmado" as Status },
  { id: 4, day: 2, start: "08:30", duration: 2, patient: "Pedro Martins", procedure: "Retorno", professional: "Dra. Marina Lopes", type: "Convênio" as CareType, status: "Atendido" as Status },
  { id: 5, day: 3, start: "11:00", duration: 2, patient: "Mariana Silva", procedure: "Clareamento", professional: "Dr. Rafael Costa", type: "Particular" as CareType, status: "Agendado" as Status },
  { id: 6, day: 4, start: "09:30", duration: 2, patient: "João Oliveira", procedure: "Avaliação", professional: "Dra. Ana Beatriz", type: "Convênio" as CareType, status: "Confirmado" as Status },
];
export const patients = [
 {id:"beatriz-almeida",name:"Beatriz Almeida",phone:"(35) 99912-8432",last:"08/07/2026",next:"21/07, 08:00",professional:"Dra. Marina Lopes",type:"Particular",insurance:"—",balance:0,status:"Ativo"},
 {id:"lucas-ferreira",name:"Lucas Ferreira",phone:"(35) 98841-2093",last:"10/06/2026",next:"21/07, 10:00",professional:"Dr. Rafael Costa",type:"Convênio",insurance:"Unimed",balance:120,status:"Pendente"},
 {id:"camila-nogueira",name:"Camila Nogueira",phone:"(35) 99720-5518",last:"02/07/2026",next:"22/07, 09:00",professional:"Dra. Ana Beatriz",type:"Particular",insurance:"—",balance:0,status:"Ativo"},
 {id:"pedro-martins",name:"Pedro Martins",phone:"(35) 99106-3374",last:"20/07/2026",next:"—",professional:"Dra. Marina Lopes",type:"Convênio",insurance:"Bradesco Saúde",balance:85,status:"Pendente"},
 {id:"mariana-silva",name:"Mariana Silva",phone:"(35) 98413-6620",last:"15/05/2026",next:"24/07, 11:00",professional:"Dr. Rafael Costa",type:"Particular",insurance:"—",balance:0,status:"Ativo"},
];
export const transactions = [
 {date:"21/07/2026",description:"Avaliação • Beatriz Almeida",category:"Receita",method:"Pix",amount:180,status:"Pago"},
 {date:"21/07/2026",description:"Materiais odontológicos",category:"Despesa",method:"Boleto",amount:-840,status:"Pago"},
 {date:"20/07/2026",description:"Limpeza • Lucas Ferreira",category:"Receita",method:"Convênio",amount:120,status:"Pendente"},
 {date:"18/07/2026",description:"Clareamento • Mariana Silva",category:"Receita",method:"Crédito",amount:650,status:"Parcial"},
];
