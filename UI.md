# Modus — UI elements plan

Primary UI is the **Modus operator dashboard**. Shop + magazine live in separate repos (agent/MCP backends), not in this frontend.

## App shell (shared)

| Element | Why |
| --- | --- |
| Login / session gate | Operator auth |
| Side nav + page titles | Module navigation |
| Global pending-approvals badge | Escalation urgency |
| Toasts / banners | Allow/deny/rate-limit feedback |
| Empty / error / loading states | First-run + outages |
| Status pills | allow / deny / caution / rate-limited / MCP health |

## Screens → elements (by feature)

### 1. Overview / usage

Calls chart, top agents/tools, error rate, **per-agent** clear/caution split (demo: Purchasing + Support), budget remaining bars, drill-down links into audit.

### 2. Approval queue (demo-critical)

Pending table (tool, agent, specialist, probs, age/TTL), detail drawer (args redacted, matched rules, model choice), actions **Allow / Deny / Allow-with-TTL**, live refresh.

### 3. Roles & grants

Role list + create/edit, tool/server grant matrix (checkboxes or tree), agent→role assignment, **effective permissions** preview.

### 4. Rule packs

Pack list/versions, rule editor (tool/args/risk → allow\|deny\|needs_ai), **dry-run** panel on sample call, promote/publish.

### 5. Agents & auth

Agent list (demo: **Purchasing** + **Support** — each use case is an agent instance), API key create/reveal/revoke, rate-limit overrides.

### 6. MCP registry

Remote vs hosted tabs, connect wizard (URL + secrets), health + last sync, tool catalog browser, reconnect / rotate secret.

### 7. Audit explorer

Filterable event table, event detail (decision chain: RBAC → rules → specialist → human), redacted args JSON, export.

### 8. Rate limits / budgets

Quota form (per agent/tool/org), remaining vs cap, 429 recent hits list.

### 9. Specialists (ops, light)

Which model is live + version, latency/error health, optional threshold display (edit can stay config/API for MVP).

### 10. Agent flow simulator

Agent + role picker, scenario list (happy / deny / caution / rate-limit), step timeline, “open in audit” link.

## Out of scope (separate repos)

Shop and office magazine UIs are hosted elsewhere. Support can stay agent-only for MVP (tickets via MCP).

## MVP cut (hackathon)

Ship first: **shell → approval queue → audit → usage → roles → MCP registry → simulator**.

Defer polish: full rule-pack editor UX, specialist ops page, rate-limit UI (seed via config).

## Related Linear work

Already covered by Design/UI issues: ENG-5–12 (shell/brand), ENG-14–20 (modules).

Gaps vs this plan (add tasks if needed): **Agents & API keys**, **rate limits**.
