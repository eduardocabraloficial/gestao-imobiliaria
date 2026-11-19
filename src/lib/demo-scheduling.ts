import type { Appointment, Task } from "@/types";
import { calculateTemporalStatus } from "@/lib/scheduling";

function dateAt(days: number, hour: number, minute = 0) {
  const value = new Date(); value.setHours(hour, minute, 0, 0); value.setDate(value.getDate() + days); return value.toISOString();
}

export const demoAppointments: Appointment[] = [
  { id: "appointment-1", clientId: "maria-santos", propertyId: "demo-property-2", scheduledAt: dateAt(0, 15), durationMinutes: 60, notes: "Apresentar área de lazer e condições do condomínio.", status: "agendada", clientName: "Maria Santos", propertyCode: "CA-2081", propertyTitle: "Casa contemporânea em condomínio exclusivo" },
  { id: "appointment-2", clientId: "ana-souza", propertyId: "demo-property-3", scheduledAt: dateAt(2, 10), durationMinutes: 45, notes: "Cliente prefere visita pela manhã.", status: "agendada", clientName: "Ana Souza", propertyCode: "AP-7715", propertyTitle: "Apartamento mobiliado a poucos passos do parque" },
  { id: "appointment-3", clientId: "joao-silva", propertyId: "demo-property-1", scheduledAt: dateAt(-3, 11), durationMinutes: 60, notes: "Visita concluída com interesse.", status: "realizada", clientName: "João da Silva", propertyCode: "AP-1042", propertyTitle: "Apartamento com vista aberta e varanda gourmet" },
  { id: "appointment-4", clientId: "carlos-lima", propertyId: "demo-property-4", scheduledAt: dateAt(1, 17), durationMinutes: 30, notes: "Cancelada pelo cliente.", status: "cancelada", clientName: "Carlos Lima", propertyCode: "ST-3310", propertyTitle: "Studio moderno próximo ao metrô" },
];

const taskSeeds = [
  { id: "task-1", clientId: "joao-silva", propertyId: null, title: "Enviar documentação para João", description: "Encaminhar relação atualizada de documentos.", dueAt: dateAt(-1, 12), priority: "alta", status: "pendente", completedAt: null, clientName: "João da Silva", propertyCode: "" },
  { id: "task-2", clientId: "maria-santos", propertyId: "demo-property-2", title: "Confirmar visita da casa", description: "Validar presença e horário com a cliente.", dueAt: dateAt(0, 11), priority: "media", status: "pendente", completedAt: null, clientName: "Maria Santos", propertyCode: "CA-2081" },
  { id: "task-3", clientId: null, propertyId: "demo-property-1", title: "Atualizar informações do imóvel", description: "Revisar valor do condomínio.", dueAt: dateAt(3, 16), priority: "baixa", status: "pendente", completedAt: null, clientName: "", propertyCode: "AP-1042" },
  { id: "task-4", clientId: "roberto-almeida", propertyId: null, title: "Registrar contraproposta", description: "Tarefa já finalizada.", dueAt: dateAt(-2, 14), priority: "alta", status: "concluida", completedAt: dateAt(-2, 13), clientName: "Roberto Almeida", propertyCode: "" },
] as const;

export const demoTasks: Task[] = taskSeeds.map((task) => ({ ...task, temporalStatus: calculateTemporalStatus(task.dueAt) }));
