# Agent Memory And Goal Management Design

## Goal

Make Agent detail management complete enough for human users and AI Agents:

- Human users can manually delete memories.
- Human users can delete goals.
- Human users and AI Agents can update goals.
- Goals have real detail with ordered execution steps and progress.
- The create-memory form clearly separates memory category from importance level.

## Scope

This design covers the existing Agent detail workflows in `lobster-front` and the matching `lobster-back` login and AI-token APIs.

In scope:

- Manual memory deletion from the Agent detail memory list/detail.
- Goal update and delete APIs for login users.
- Goal update support through Agent Token sync.
- Goal step data in goal request/response payloads.
- Goal detail UI that displays and edits ordered steps.
- Progress derived from goal steps instead of fixed status percentages.
- Copy/UI label fixes for the memory creation form.
- Tests for backend service/controller behavior and frontend transformation/rendering behavior where existing test style supports it.

Out of scope:

- A separate goal-step table.
- Drag-and-drop step reordering.
- Collaborative conflict resolution beyond the existing sync revision/confirmation pattern.
- Historical immutable progress audit logs.

## Recommended Approach

Use the existing `agent_goal.ext_json` column to store structured step data for this phase. The schema already describes `ext_json` as the place for execution plans and context, so this avoids a database migration while still exposing a typed contract at the API boundary.

Add typed DTO/VO fields for steps so callers do not need to understand the raw JSON storage format. Backend services serialize and parse `ext_json`; frontend code treats steps as normal `AgentGoalStep[]`.

## Goal Step Contract

Each goal may include `steps`:

```json
[
  {
    "id": "step-uuid-or-stable-id",
    "title": "Collect current requirements",
    "description": "Read the latest user request and existing implementation.",
    "status": "completed",
    "sortOrder": 10,
    "updatedAt": "2026-06-25T10:00:00"
  }
]
```

Allowed status values:

- `pending`
- `running`
- `completed`
- `failed`

Backend normalization:

- Missing `steps` becomes an empty list.
- Missing step `id` is generated.
- Blank step titles are rejected for explicit create/update requests.
- Missing step status defaults to `pending`.
- Missing `sortOrder` is assigned by list order.
- `updatedAt` is refreshed for changed or newly created steps.

`agent_goal.ext_json` stores:

```json
{
  "steps": []
}
```

Unknown existing fields in `ext_json` should be preserved when updating steps.

## Backend API

Login user API:

- Existing: `POST /api/agents/{id}/memories`
- Existing backend, new frontend usage: `DELETE /api/agents/{id}/memories/{memoryId}`
- Existing: `POST /api/agents/{id}/goals`
- New: `PUT /api/agents/{id}/goals/{goalId}`
- New: `DELETE /api/agents/{id}/goals/{goalId}`

AI Agent API:

- Existing: `POST /api/ai/agents/{id}/sync`
- Extend `goals[]` in register/sync requests with optional `id` and `steps`.
- When a goal has an accessible `id`, sync updates that goal instead of always creating a new one.
- When `id` is absent, keep existing create behavior unless a conservative duplicate match already exists in current service logic.
- Require `goalWrite` for goal creation or update through Agent Token.

The update request supports:

- `title`
- `description`
- `goalStatus`
- `priority`
- `dueTime`
- `steps`

Delete is soft delete:

- Set `delete_time`.
- Decrement `agent.goal_count` without going below zero.
- Create a pending `config_changed` event for bound Agents.

Goal update also creates a pending `config_changed` event for bound Agents.

## Frontend UX

Memory list/detail:

- Add a delete icon button on memory cards or in memory detail.
- Confirm before deleting.
- On success, refresh memories and the Agent profile count.
- If the deleted memory is open, return to the memory list.

Memory creation:

- Label the memory type select as `记忆分类`.
- Label the numeric input as `重要等级`.
- Keep request fields unchanged: `memoryType` and `importance`.

Goal list:

- Show progress from steps:
  - If there are steps, progress is `completed steps / total steps`.
  - If there are no steps, fall back to status-based progress for legacy goals.
- Show current running step when available.

Goal detail:

- Display title, status, due time, priority, description, and step timeline/checklist.
- Allow editing goal fields.
- Allow adding, editing, deleting, and changing status of steps.
- Allow deleting the goal with confirmation.
- Save uses the new `PUT /api/agents/{id}/goals/{goalId}` endpoint.

The first version can use existing modal/panel patterns instead of a new page route.

## Data Flow

1. Agent detail loads goals through `GET /api/agents/{id}/goals`.
2. Backend maps `agent_goal.ext_json.steps` into `AgentGoalVO.steps`.
3. Frontend renders step-derived progress and detail.
4. Human edits goal or steps.
5. Frontend sends `PUT /api/agents/{id}/goals/{goalId}` with the whole normalized step list.
6. Backend validates, preserves unrelated `ext_json` fields, updates `agent_goal`, and emits a config event.
7. AI Agent later reads `GET /api/ai/agents/{id}/config` and receives the same steps.
8. AI Agent can submit updated `goals[]` through sync, including step status changes.

## Error Handling

- Missing Agent or resource returns the existing `BusinessException` style 404.
- Cross-owner access remains forbidden by current Agent ownership checks.
- Invalid blank titles return validation errors.
- Invalid step status returns 400.
- Frontend shows inline modal errors for save/delete failures and leaves local state unchanged.

## Testing And Verification

Backend tests:

- Login user can delete a memory through existing service behavior.
- Login user can update a goal and receives steps in `AgentGoalVO`.
- Login user can soft-delete a goal and count/config events update.
- Agent Token sync with `goalWrite` can update an existing goal and its steps.
- Agent Token sync without `goalWrite` cannot write goals.
- Existing create/list behavior remains compatible with goals that have no steps.

Frontend tests:

- Step progress helper returns completed-step progress and legacy fallback.
- Memory creation payload still sends `memoryType` and `importance`.
- Service functions call the expected memory delete, goal update, and goal delete endpoints.

Verification commands:

- Backend targeted Maven tests for Agent service/sync/controller coverage.
- Frontend targeted `npx tsx --test` tests for helpers/services where available.
- `npm run build`
- `mvn test` or the closest practical targeted Maven suite if full test runtime is too high.
