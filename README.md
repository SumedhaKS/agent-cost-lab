# Agent Cost Lab — Integral Solutions Assignment

A working demonstration of token-cost optimization, debugging methodology, and a deployed CI/CD pipeline, built around a simulated e-commerce support agent (an agent that checks orders, searches a policy knowledge base, and resolves refund requests via tool calls).

---

## Part 1 — Token / Cost Optimization

### Scenario

A single step of a multi-turn support agent — system prompt, 6 tool declarations, and conversation history that includes a prior tool call's result — was measured for token cost using Gemini's `countTokens` endpoint (free, no generation cost, ideal for before/after comparisons like this).

### Optimization 1 — Remove duplicated context

The initial version sent the full refund/shipping policy document twice: once as a standalone context block, and again inside the conversation history (as the result of an earlier `search_policy_kb` tool call). Removing the standalone block is a pure deduplication — the model loses no information it didn't already have via history.

**Quality tradeoff: none.** This is a free win, not a tradeoff — worth calling out explicitly because it's a different *kind* of fix than Optimization 2 below.

### Optimization 2 — Dynamic retrieval instead of dumping the full document

The `search_policy_kb` tool originally returned the entire policy document regardless of query. This was replaced with real semantic retrieval: the policy doc is split into 4 sections, each embedded via Gemini's `gemini-embedding-001` model (with `taskType: RETRIEVAL_DOCUMENT`), the incoming query is embedded separately (`taskType: RETRIEVAL_QUERY`), and cosine similarity picks the single most relevant section instead of returning everything.

**Quality tradeoff: real.** A too-narrow retrieval risks missing a relevant clause if a query is ambiguous or spans two sections. Mitigated here by using semantic embeddings rather than hardcoded keyword matching, which generalizes better to varied phrasing. At larger scale, the next step would be retrieving the top-2 candidates with a similarity threshold rather than a hard top-1 cutoff, and adding a reranking pass — not implemented here since a 4-section, ~360-token document doesn't justify that additional machinery; it would be over-engineering for this corpus size.

### Results

| Stage | Total tokens | Change |
|---|---|---|
| Original (duplicated policy, full doc in history) | 1350 | — |
| After Optimization 1 (dedup) | 991 | −27% |
| After Optimization 2 (dynamic retrieval) | 661 | **−51% total** |

Reproduce with: `bun run demo` (prints all three stages from a single run, using live token counts, not hardcoded numbers).

---

## Part 2 — Debugging

Rather than a hypothetical, this section walks through a real bug hit while building Part 1 — it maps directly to the brief's "silently succeeds with wrong data" failure mode.

### The bug

Early token counts looked implausibly low (474 tokens for a prompt with a system prompt, 6 tool schemas, a policy document, and multi-turn history — clearly too small). No error was thrown; the code ran and returned a number.

### Debugging process

1. **Formed a hypothesis before trusting the number.** 474 tokens didn't match a rough mental estimate of what six tool schemas plus a few hundred words of policy text plus conversation history should cost — that mismatch was the trigger to investigate rather than move on.
2. **Instrumented before theorizing.** Rather than guessing, added a per-component breakdown — counting the system prompt, policy text, history, and tools separately instead of as one combined blob.
3. **Isolated the layer.** The breakdown immediately made the problem visible: `toolsTokens` and `historyTokens` were both far smaller than expected, while `sysTokens` (a plain string) was normal — pointing at how non-string values were being handled specifically, not a general problem.
4. **Root cause.** The original code interpolated arrays of objects directly into a template literal (`` `${fakeHistory}` ``). JavaScript's implicit `.toString()` on an array of objects does not produce readable JSON — it silently produces `[object Object]` repeated per element, a short, low-token string that looks like normal output but discards almost all the actual content.
5. **Fix.** Explicit `JSON.stringify()` before interpolation. Token count corrected from 474 → 1357 for the same content — a 3x jump that confirmed the original number had been silently wrong, not just imprecise.

### Why this matters beyond this one bug

This class of failure — code that runs cleanly, returns a plausible-looking result, and never throws — is the hardest of the three failure modes in the brief precisely because nothing announces it. The fix wasn't "add a try/catch," it was **structural**: per-component instrumentation makes an unexpectedly small or unexpectedly duplicated value visible after the fact, where a single opaque total would have hidden it indefinitely.

### Other real issues hit during this build (secondary examples, same underlying discipline)

- **Silent batching failure:** `gemini-embedding-2` was passed a 4-element array expecting 4 embeddings back, but returned only 1, with no error. Diagnosed the same way — logged the array lengths at each stage rather than assuming, which showed the collapse immediately. Root cause: wrong model — the batch-embedding contract only holds for `gemini-embedding-001`, not `-2`. Switching model fixed it.
- **Schema-corrupting bug:** A tool description field was accidentally interpolated with a function reference (`` `${searchPolicyKB}` ``) instead of calling it, which embedded the function's entire source code into the schema description sent to the model. Caught by an unexpected jump in token counts after an unrelated change — same "does this number make sense" instinct as the primary bug.

### What a real production version would add

Structured logging with a request/trace ID per pipeline run, per-step latency and token counts persisted (not just console-logged), and output validation (e.g. schema checks on tool results) so wrong-shaped data raises a flag instead of silently propagating downstream.

---

## Part 3 — CI/CD and Deployment

### Pipeline

`.github/workflows/ci.yml` — two jobs:
- **`test`**: runs on every push and pull request targeting `main`. Installs dependencies with Bun (`bun install --frozen-lockfile`, Bun's equivalent of `npm ci` — installs exactly what's locked, fails rather than silently drifting), then runs lint and the test suite.
- **`deploy`**: gated with `needs: test`, and further restricted to only fire on an actual push to `main` (`github.ref == 'refs/heads/main' && github.event_name == 'push'`) — so it never runs on a PR, only on a real merge, and never runs unless tests already passed.

Deployment target is Render, chosen deliberately over Render's built-in auto-deploy-on-push: auto-deploy was turned off in Render's settings so that deployment is driven entirely by the CI pipeline rather than happening independently of test results. The deploy step triggers Render via its **Deploy Hook** — a POST request to a unique URL that starts a new deploy from the latest commit.

### Secrets handling

The Render Deploy Hook URL is stored as a GitHub Actions repository secret (`RENDER_DEPLOY_HOOK`), never committed to source. `.env` (containing the local `GEMINI_API_KEY`) is git-ignored and never touches the repository.

At larger scale — deploying to a cloud provider directly rather than a PaaS — the next step up from a static secret would be OIDC-based short-lived credentials, so no long-lived key sits in GitHub's secret store at all; GitHub issues a token scoped to that specific job run instead.

### Rollback plan — first 5 minutes

1. **Confirm the deploy is actually the cause** before touching anything — check whether errors/behavior changes align with the deploy timestamp rather than assuming.
2. **Roll back first, root-cause after.** Render's Events page has a one-click Rollback on any previous successful deploy. It reuses that deploy's existing build artifact rather than rebuilding from scratch, so it's fast, and it automatically disables auto-deploy afterward as a safeguard against a stray push undoing the rollback while the incident is still being investigated.
3. **Caveat worth knowing even though it doesn't apply to this project:** a code rollback does not undo a database migration. If this service had a database, the previous version's code would need to be confirmed compatible with the *current* schema before rolling back — otherwise the rollback can break things worse than the original deploy did.

---

## What I'd do differently at real production scale

- Two-stage retrieval (broad vector search → rerank) instead of single-pass cosine similarity, once the knowledge base is too large to fit in a handful of chunks
- Hybrid search (keyword + embedding) to catch exact-term queries that pure semantic similarity can miss
- Structured, persisted tracing per agent step instead of console logs, so debugging doesn't depend on having thought to add a log line in advance
- Eval-driven tuning of retrieval parameters (chunk size, top-k) against a real test query set, rather than manual spot-checks

---

## Setup

```bash
bun install
cp .env.example .env   # add GEMINI_API_KEY

bun run demo    # Part 1 — prints before/after token counts
bun run test    # Part 2 support — unit tests (cosineSimilarity)
bun run lint    # Part 3 — lint check
bun run build   # compiles TypeScript to dist/
bun run start   # runs the deployed server (health check at /health)
```