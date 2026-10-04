# Modus — Hackathon Pitch Deck (10 slides)

AI Control Layer challenge · Self-host + license + optional maintenance

---

## Slide 1 — Title / Hook

**Purpose:** Brand + one-line stake in 5 seconds.

**Headline:** Modus — the control plane for agentic AI

**Subhead:** Hybrid guardrails that let teams ship agents without shipping risk.

**On slide:**

- Product name + logo (hero-level)
- One line: *Gateway + policy + human-in-the-loop for agents, MCPs, and LLMs*
- Team name / hackathon track
- Optional: “Self-host · License · Operate”

**Visual:** Full-bleed dark/neutral product atmosphere (dashboard silhouette or architecture silhouette), not a feature collage.

**Say:** “Developers are shipping agents faster than security can govern them. Modus is the layer in the middle.”

---

## Slide 2 — Problem

**Purpose:** Mirror the brief; make judges feel the pain.

**Headline:** Agentic AI breaks yesterday’s security stack

**On slide (3–4 bullets max):**

- Agents act with tools, memory, and MCP — not just chat
- Prompt injection + PII/secrets leak through natural language
- Non-deterministic loops → runaway cost and irreversible actions
- Traditional IAM/WAF don’t speak “tool call + semantic intent”

**Visual:** Simple before/after: “App → LLM” vs “Agent → tools / MCP / models” with red risk arrows.

**Say:** Tie to OWASP LLM / agent risks without a wall of acronyms. End with: “Orgs need a flexible control layer, not another chatbot filter.”

---

## Slide 3 — Market & why now

**Purpose:** Show you did research; frame urgency.

**Headline:** Every org adopting agents needs a control layer

**On slide:**

- **Trigger:** MCP + multi-agent stacks going mainstream in 2025–26
- **Buyers:** Platform / AppSec / AI platform owners (not end users)
- **TAM angle (keep honest):** AI security & governance spending growing with agent adoption; start with mid-market + regulated teams that must self-host
- **Willingness to pay:** Budget overruns + audit/compliance pressure (SOC2, internal AI use policies)

**Visual:** 2×2 — “Speed of agents” vs “Maturity of controls” with Modus in the gap.

**Research you can cite lightly (verify numbers before pitch day):**

- Explosive growth of enterprise GenAI / agent pilots
- Cost incidents (runaway token spend) as a board-visible issue
- Preference for **on-prem / VPC** for tool-calling agents that touch internal systems

**Say:** “Market isn’t ‘another LLM firewall’ — it’s **runtime governance for tool-using agents**.”

---

## Slide 4 — Solution

**Purpose:** One composition: what Modus is.

**Headline:** Modus sits in the path of every agent interaction

**On slide:**

- Lightweight **AI control layer** (gateway / proxy) in front of agents ↔ MCP ↔ models
- **Centralized policy** (rule packs, roles, budgets, allowed models)
- **Hybrid defense:** deterministic checks + semantic specialists
- **Operator dashboard:** posture, approvals, audit, rate limits

**Visual:** One architecture diagram (required by brief):

`Clients / Agents → Modus Gateway → MCP / LLMs` with side boxes: Policy · Specialists · Approvals · Audit.

**Say:** “We don’t replace your agents. We make them governable.”

---

## Slide 5 — Product / features (demo map)

**Purpose:** Map UI modules to brief outcomes; teaser the live demo.

**Headline:** Built for operators — proven with real agent flows

**On slide (feature grid, 6 items):**

1. **Policy engine** — rule packs, strictness, allow / deny / needs_ai
2. **Hybrid guardrails** — PII/secrets/auth + AI specialists
3. **Human approvals** — caution path with Allow / Deny / TTL
4. **Budgets & rate limits** — tokens, tools, per-agent caps
5. **MCP registry** — connect, health, tool catalog
6. **Audit & reporting** — decision chain + export for security

**Demo callout:** Purchasing + Support agents (shop / magazine) through Modus.

**Visual:** 3 dashboard screenshots max (Overview · Approvals · Audit) — or one annotated frame.

**Say:** Walk the path: request → RBAC → rules → specialist → human → allow/deny → audit.

---

## Slide 6 — Architecture & hybrid defense

**Purpose:** Technical depth without drowning. Hits judges’ robustness (30%) + architecture (20%).

**Headline:** Deterministic where possible. Semantic where it matters.

**On slide:**

- **Non-AI:** pattern/PII/secrets, authZ/roles, tool grants, rate limits, signature-style attack feeds
- **AI specialists:** intent/risk scoring when rules say `needs_ai`
- **Resilience:** budgets for commercial APIs *and* local models (Ollama-friendly)
- **Config-driven:** judges can change policy; layer adapts (call out hot-reload / reload story if you have it)
- **Perf note:** short path for allow/deny; AI only on caution path

**Visual:** Pipeline strip: `Auth → Rules → Deterministic → Specialist? → Approval? → Forward / Block / Redact`

**Say:** “Hybrid = speed + semantic understanding — exactly what the challenge asks for.”

---

## Slide 7 — Differentiation

**Purpose:** Why not LangChain callbacks / cloud DLP / “just RAG filters”?

**Headline:** Control plane for agents — not a prompt filter

**On slide (comparison table):**

| | Chat filters / DLP | Cloud AI gateways | **Modus** |
| --- | --- | --- | --- |
| Tool / MCP awareness | Weak | Partial | **Native** |
| Human-in-the-loop | Rare | Rare | **First-class** |
| Self-host / air-gapped | Often no | Vendor lock | **Yes** |
| Policy + audit for SecOps | Limited | Vendor UI | **Exportable decision chain** |

**Angle:** Open, self-hostable, agent/MCP-native, hybrid + approvals, hackathon-proven test suite.

**Say:** “We’re the **modus operandi** for safe agent ops — policy in the middle, humans when risk is high.”

---

## Slide 8 — Business model

**Purpose:** Monetization — self-host + license + optional maintenance.

**Headline:** Self-host + license. Optional ops when you want them.

**On slide:**

- **Core:** perpetual or term **software license** for gateway + dashboard (deploy in customer VPC/K8s)
- **Optional:** **maintenance & updates** (rules/signature feeds, specialist model packs, security patches)
- **Optional:** **managed ops / support SLA** (install assist, policy design, incident review)
- **Not the wedge:** per-seat chat tax — price on **org / cluster / agent volume tiers**
- **Why it fits buyers:** regulated / internal tools → data never forced to a SaaS proxy

**Visual:** Stack:

`License (required) → Maintenance (recommended) → Support/Managed (optional)`

**Pricing placeholder (pick one story for pitch day):**

- Starter: single-node license + community rules
- Team: multi-agent + MCP registry + approval workflows
- Enterprise: HA, SSO, custom rule packs, dedicated support

**Say:** “We sell governance infrastructure, not tokens. Customers keep the models and the data path.”

---

## Slide 9 — Case study: card dispute ops

**Purpose:** Make the product concrete with a finance use case judges can follow — two MCPs, one agent, Modus in the middle. Proof (tests / audit) supports the story, not the other way around.

**Headline:** Chargebacks without trusting the network portal

**One-sentence explanation (for you / speaker notes):**  
A Dispute Ops agent sits between an **untrusted Card Network Dispute Portal** (external free text — merchant “representation”) and an internal **Case Desk** (refunds, chargebacks, case mutations). Without Modus, poisoned portal text can make the agent favor the merchant or skip the chargeback. With Modus, reads are allowed, money-moving writes are gated by rules + dispute specialist + human approval, and the full decision chain is audited.

**On slide:**

- **Setup:** Dispute Ops agent · role `dispute-operator` · two MCPs attached
- **Card Network Portal MCP** *(untrusted)* — txn / merchant / dispute reads; `accept_representation` is the trap
- **Case Desk MCP** *(bank-internal)* — `refund.post`, `chargeback.file`, case updates (irreversible money)
- **Scenario:** €189 unrecognized travel charge; merchant representation injects “auto-favor merchant / ignore fraud score”
- **With Modus:** deny or `needs_ai` → Dispute specialist → human Allow/Deny → provisional refund + chargeback filed
- **Without Modus:** naked agent trusts portal text → wrong close / lost money or window

**Contrast beat (small table on slide):**

| Naked agent | Modus-secured |
| --- | --- |
| Treats portal text as truth | Treats representation as hostile |
| Accepts bad representation / refund | Rules + specialist block or escalate |
| Chat log only | Approvals + exportable audit chain |

**Visual:** Two-box architecture — *Network Portal (external)* ↔ *Modus* ↔ *Case Desk (internal)* — with a red “injection” callout on representation text and a green path through Approvals.

**Say (30–45s):**  
“Same pattern as our shop demo, but for banking. The network portal is the untrusted surface — free-text merchant representation. Case Desk is where money moves. Modus lets the agent investigate, then stops irreversible actions until policy and a human say go. That’s the control layer in a real finance dispute flow.”

**Optional footer (one line, if space):** Secure vs naked test suite + audit export prove the contrast live.

---

## Slide 10 — Ask / roadmap / close

**Purpose:** Memorable close; show you’re going beyond the weekend.

**Headline:** Ship agents. Keep control.

**On slide:**

- **Today:** working control layer + dashboard + tests (hackathon deliverable)
- **Next 90 days:** production packaging (Helm), richer attack feeds, SSO, policy marketplace
- **Ask (pick what fits the event):** win track / pilot with design partner / intro to AppSec buyers
- **Team:** 1 line each — eng / security / product
- **Contact + repo / live URL**

**Visual:** Logo + QR to demo or GitHub + the one-liner again.

**Say:** Close on the brief’s promise: *hybrid defense for the generative AI era — practical, self-hostable, auditable.*

---

## Extras pros usually include

| Often missed | Where it lives |
| --- | --- |
| **Architecture diagram** (explicitly required) | Slide 4 or 6 |
| **Live demo script** (2–3 min, one golden path) | Between 5–6 or as backup slides |
| **Threat model / OWASP mapping** (1 small table) | Appendix or footer on slide 6 |
| **Limits / honesty** (“MVP: X deferred”) | Appendix — builds trust |
| **GTM wedge** (who buys first: internal platform team with 2–3 agents) | Slide 3 or 8 |
| **Moat sketch** (policy packs + MCP catalog + decision graph data) | Slide 7 |
| **Compliance story** (audit export, redaction, least privilege) | Slide 5 / 9 |
| **Competitive landscape** (named categories, not 20 logos) | Slide 7 |
| **Risks & mitigations** (false positives → human TTL; latency → hybrid short-circuit) | Appendix |

### Suggested timing (8–10 min pitch)

1–2 (1.5m) → 3 (1m) → 4–5 (2m) → **live demo 2–3m** → 6–7 (1.5m) → 8 (1m) → 9–10 (1m).

### One-line narrative

> Agents are productive and dangerous → market needs a control plane → Modus is that plane → hybrid + approvals + budgets + MCP → differentiated by self-host + SecOps audit → license + maintenance business → proven on card dispute ops (Network Portal + Case Desk) → ship with us.
