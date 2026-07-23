# API de integração — /api/v1

API REST usada pelo n8n, Chatwoot e pelo agente de IA da Lexion para operar a
agenda da clínica. Cada requisição é autenticada por um **token de integração
por clínica** — o token identifica a clínica; todos os dados ficam isolados a ela.

- Base local: `http://localhost:3000/api/v1`
- Base produção: `https://lx-clinicas.vercel.app/api/v1`

## Autenticação

Gere o token em **Configurações → Integrações** (apenas administradores).
O valor aparece uma única vez; o banco guarda somente o hash SHA-256.

Envie em toda requisição:

```
Authorization: Bearer lxc_...
```

### Configurar no n8n

1. **Credentials → New → Header Auth**
2. Name: `Authorization`
3. Value: `Bearer lxc_...` (o token completo)
4. Nos nós **HTTP Request**, selecione essa credencial em *Authentication → Generic Credential Type → Header Auth*.

### Erros

Formato: `{"error": {"code": "...", "message": "..."}}`

| Status | code | Quando |
| --- | --- | --- |
| 401 | `missing_token` / `invalid_token` / `expired_token` | Token ausente, revogado ou vencido |
| 403 | `insufficient_scope` | Token sem o escopo necessário |
| 404 | `not_found` / `patient_not_found` / `professional_not_found` | Recurso inexistente na clínica |
| 409 | `conflict_appointment` / `conflict_block` | Horário ocupado ou bloqueado |
| 422 | `validation_error` | Corpo/parâmetros inválidos |

## Datas e fuso

O banco opera em UTC; a clínica em `America/Sao_Paulo`. Duas formas de informar horário:

- `date` + `time` — interpretados no fuso da clínica (recomendado para o agente): `"date": "2026-07-24", "time": "14:00"`
- `start_at` ISO **com offset**: `"2026-07-24T14:00:00-03:00"` (ISO sem fuso é rejeitado)

As respostas sempre devolvem instantes ISO em UTC.

---

## GET /catalog

Profissionais, procedimentos e convênios ativos — para mapear nomes em IDs.

```bash
curl -H "Authorization: Bearer $TOKEN" "$BASE/catalog"
```

## GET /availability

Horários livres (grade do profissional menos agendamentos e bloqueios).

| Parâmetro | Obrigatório | Descrição |
| --- | --- | --- |
| `date` | sim | `YYYY-MM-DD` |
| `days` | não | 1–14 dias a partir de `date` (padrão 1) |
| `professional_id` | não | filtra um profissional |
| `procedure_id` | não | usa a duração do procedimento para dimensionar os slots |

```bash
curl -H "Authorization: Bearer $TOKEN" "$BASE/availability?date=2026-07-24&days=3"
```

Resposta: `data.days[].professionals[].slots[]` com `start_at`, `end_at` (UTC) e `time` (hora local).

## GET /appointments

Filtros: `date`, `from`, `to`, `professional_id`, `patient_id`, `patient_phone`, `status`, `limit`.

```bash
curl -H "Authorization: Bearer $TOKEN" "$BASE/appointments?patient_phone=(35)%2099912-8432&status=scheduled"
```

## POST /appointments

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -H "Idempotency-Key: whatsapp-msg-8734" \
  -d '{
    "patient_phone": "(35) 99912-8432",
    "patient_name": "Beatriz Almeida",
    "professional_id": "...",
    "procedure_id": "...",
    "date": "2026-07-24",
    "time": "14:00",
    "notes": "agendado pelo WhatsApp"
  }' "$BASE/appointments"
```

Regras:

- Paciente por `patient_id` **ou** `patient_phone`. Telefone inexistente + `patient_name` → paciente criado automaticamente (fluxo do agente).
- Duração: `duration_minutes` → duração do procedimento → padrão da clínica.
- `source` padrão: `ai_agent` (aparece na agenda como origem do agendamento).
- **Idempotency-Key** (header ou campo `idempotency_key`): repetir a mesma chave devolve o agendamento já criado em vez de duplicar — use o ID da mensagem/execução do n8n.
- Conflito de horário → `409`.

## GET /appointments/:id

## PATCH /appointments/:id

Confirmar, remarcar, concluir, cancelar ou trocar profissional.

```bash
# confirmar
curl -X PATCH ... -d '{"status": "confirmed"}' "$BASE/appointments/$ID"

# remarcar (revalida conflito)
curl -X PATCH ... -d '{"date": "2026-07-25", "time": "09:30"}' "$BASE/appointments/$ID"

# cancelar com motivo
curl -X PATCH ... -d '{"status": "cancelled", "cancellation_reason": "paciente pediu"}' "$BASE/appointments/$ID"
```

Status válidos: `scheduled`, `confirmed`, `completed`, `cancelled`, `no_show`.

## DELETE /appointments/:id

Atalho de cancelamento (**soft delete** — o registro permanece no histórico).
Motivo opcional: `?reason=...`. Cancelar algo já cancelado devolve 200 (idempotente).

## GET /patients

`?phone=...` (busca exata, qualquer formatação) ou `?q=nome` (parcial).

## POST /patients

`full_name` + `phone` obrigatórios; opcionais: `email`, `birth_date`, `cpf`,
`insurance_company_id`, `main_professional_id`, `notes`, `source`.
Telefone já cadastrado devolve o paciente existente com `created: false`.

---

## Escopos

Tokens gerados pela interface recebem: `availability:read`, `appointments:read`,
`appointments:write`, `patients:read`, `patients:write`.

## Auditoria

Toda mutação via API grava em `audit_logs` (`appointment.created`,
`appointment.updated`, `appointment.cancelled`, `patient.created`).
