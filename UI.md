# Modus — UI elements plan

Primary UI is the **Modus operator dashboard**. Shop + magazine live in separate repos (agent/MCP backends), not in this frontend.

## Information architecture

**Side nav stays small.** Configure posture on the agent; catalogs are deep-links only.

| Layer | In nav? | Screens | Job |
| --- | --- | --- | --- |
| **Monitor** | Yes | Overview, Approvals, Audit, Webhooks | Runtime queues + usage + outbound notify |
| **Agent hub** | Yes | Agents (Overview · Access · Rules · Limits · Keys) | Primary control surface |
| **MCP** | Yes | Org-wide MCP catalog | Connect once; agents add from this list |
| **Deep-link catalogs** | No | Roles, Specialists | Opened from Agent Access / Rules |

Runtime path ownership:

```
API key → Agent
  → MCP attached?     (reachability — per agent)
  → Role grants tool? (RBAC — template bound to agent)
  → Rate limit OK?    (per-agent caps)
  → Rule pack
  → Specialist / human
```

Effective posture on an agent = **role grants ∩ attached MCP tools**, plus applicable quotas.

Roles are **templates**, not a second place to wire MCP. Attach MCP on the agent; edit grants on the template when needed via “Edit grants” from Access.

## App shell (shared)

| Element | Why |
| --- | --- |
| Login / session gate | Operator auth |
| Side nav | Overview · Approvals · Audit · Webhooks · Agents · MCP (+ Settings in footer) |
| Global pending-approvals badge | Escalation urgency |
| Toasts / banners | Allow/deny/rate-limit feedback |
| Empty / error / loading states | First-run + outages |
| Status pills | allow / deny / caution / rate-limited / MCP health |

## Screens → elements (by feature)

### 1. Overview / usage

Calls chart, top agents/tools, error rate, **per-agent** clear/caution split (demo: Purchasing + Support), budget remaining bars, drill-down links into audit.

### 2. Approval queue (demo-critical)

Pending table (tool, agent, specialist, probs, age/TTL), detail drawer (args redacted, matched rules, model choice), actions **Allow / Deny / Allow-with-TTL**, live refresh.

### 3. Agents (hub)

Agent list (demo: **Purchasing** + **Support**). Detail tabs:

1. **Overview** — glance metrics + jumps to Access / Rules / Limits
2. **Access** — MCP list (Add from org catalog) · Grants · Result
3. **Rules** — this agent’s packs (cards → workspace editor) + specialist
4. **Limits** — per-agent call caps only (window · cap · burst)
5. **Keys** — API key create/reveal/revoke

### 4. Role templates (deep-link)

Deny-by-default grant matrix. Assignees derived from `Agent.roleId`. Opened from Agent → Access → Edit grants.

### 5. MCP (org catalog)

Org-wide server list. Agents pick from it via Access → Add; “New MCP…” creates a catalog entry and adds it to the agent.

### 6. Specialists

Deep-linked from Agent → Rules. Runs when a pack returns `needs_ai`.

### 7. Audit explorer

Filterable event table, event detail (decision chain: RBAC → rules → specialist → human), redacted args JSON, export.

### 8. Webhooks

Outbound HTTPS endpoints subscribed to runtime / incident events (approvals escalated, denies, MCP down, rate limits, specialist circuit open, agent revoked). List + detail (events toggle, delivery log), add endpoint overlay. Delivery is future-backed; UI defines subscriptions now.

### 9. Agent flow simulator

Deep-link / stub: agent + role picker, scenarios, timeline, open in audit.

## Out of scope (separate repos)

Shop and office magazine UIs are hosted elsewhere. Support can stay agent-only for MVP (tickets via MCP).

## MVP cut (hackathon)

Ship first: **shell → agent hub → approval queue → audit → usage**.

Catalogs are secondary editors reached from the agent, not peer nav modules.
