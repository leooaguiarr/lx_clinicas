import "server-only";

/**
 * Log de erros do servidor.
 *
 * As mensagens devolvidas ao cliente e ao n8n são propositalmente genéricas
 * ("Falha ao consultar agendamentos") para não vazar detalhe de banco. Sem este
 * log, o motivo real se perde — e a API é consumida por um agente autônomo que
 * ninguém está observando em tempo real.
 *
 * Uma linha JSON por evento: é o formato que os logs da Vercel indexam.
 */

type Context = Record<string, unknown>;

/** Extrai o essencial de um erro do PostgREST, de um Error ou de um throw solto. */
function describe(error: unknown): Context {
  if (error && typeof error === "object") {
    const item = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    if (typeof item.message === "string") {
      return {
        message: item.message,
        ...(item.code ? { code: item.code } : {}),
        ...(item.details ? { details: item.details } : {}),
        ...(item.hint ? { hint: item.hint } : {}),
        ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
      };
    }
  }
  return { message: String(error) };
}

/**
 * `scope` identifica o ponto do código ("api.appointments.POST", "action.createPatient").
 * `context` leva o que ajuda a reproduzir — nunca dados pessoais do paciente:
 * IDs sim, nome/telefone/CPF não.
 */
export function logError(scope: string, error: unknown, context: Context = {}): void {
  console.error(
    JSON.stringify({
      level: "error",
      scope,
      at: new Date().toISOString(),
      ...context,
      error: describe(error),
    }),
  );
}

/** Para situações esperadas mas que merecem rastro (conflito, token inválido, retry). */
export function logWarn(scope: string, message: string, context: Context = {}): void {
  console.warn(JSON.stringify({ level: "warn", scope, at: new Date().toISOString(), message, ...context }));
}
