import { z } from "zod";

/**
 * UUID sintático (8-4-4-4-12). O z.string().uuid() exige os bits de
 * versão/variante da RFC 4122 e rejeita os IDs de demonstração do banco
 * (ex.: 00000000-0000-0000-0000-00000000d001).
 */
export const uuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Identificador inválido");
