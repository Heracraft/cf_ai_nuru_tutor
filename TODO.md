# TODO

Known gaps, deliberately left. Each one was a decision, not an oversight.

## Chat request amplification

Every click of the run button calls `Playground.onRun`, which sends `Code:\n...\n\nOutput:\n...` as a new chat turn. That resends the whole message history plus the ~2.5k-token Nuru spec. A student debugging through ten runs makes ten requests, each larger than the last.

Options, cheapest first:

- Auto-send only when output matches `targetOutput`, or behind an explicit "check my work" button.
- Stop resending the full spec on follow-up turns; the model already has it from turn one.

On `gpt-5-mini` the spec resend is a fraction of a cent per turn, so this is a tidiness problem before it is a cost problem.

## Zero-downtime deploys

`docker-compose.yml` holds the app and Postgres together, so pushing a new image restarts both and costs a few seconds of downtime.

The fix is to split them into separate Coolify resources, so a new app container can be built and health-checked before the old one is killed, while Postgres stays up throughout. Worth doing when someone other than you is using the app during a deploy.

## SSE assumes a single instance

`lib/generation/events.ts` uses a module-level `EventEmitter`. Generation runs in the same process as the SSE route, so this works, and a reconnect replays from Postgres, so a dropped connection heals.

Running two replicas breaks it: a client can subscribe on the process that is not running its job. It would still see replayed state on connect but no live events, so the plan would appear only on refresh. Postgres `LISTEN/NOTIFY` is the fix, and it needs a dedicated connection outside the pool.

This lands at the same moment as zero-downtime deploys, since both arrive with more than one app container.

## Orphaned generation jobs

Generation runs in-process via `after()`. If the container restarts mid-run, the job row stays on `running` and nobody retries it.

The dashboard covers this from the client side: a job that has not reported for two minutes shows a retry button. What is missing is a server-side reaper that marks such jobs `error` on boot, so the state is correct even if nobody opens the page. `pg-boss` would bring retries and dead-lettering using the existing Postgres, if this ever needs to be robust rather than merely recoverable.

## No authentication

A user id is generated at onboarding, stored in `localStorage`, and passed in the query string. Anyone with an id can open that learner's plan, and clearing browser storage loses access to it.

Acceptable for a self-hosted instance with a handful of known users. Anything public needs real accounts.

## Progress is never recorded

`lessons.completed` exists in the schema and is never written. Nothing marks a lesson finished, so the dashboard's completed state is decoration.

Needs a definition of "done" first: reading the body, passing the exercise, or explicitly clicking through.

## Only the lesson body persists

`lessons.content` stores the generated lesson. The conversation after it is not saved, so reopening a lesson shows a stable body but a blank chat, and the tutor does not remember what the student already got wrong.

Persisting the full thread raises questions worth answering before building it: what happens when a thread outgrows the context window, and whether a student can reset one.

## Lesson plan quality

Plans are generated per learner against the language spec with hard constraints on ordering, wording, and vocabulary. Quality is decent but not pinned: the model still picks which five concepts to teach.

A fixed syllabus derived from the spec, with the model personalising only framing and pacing, would make quality reproducible and shrink the prompt. Rejected for now to keep plans genuinely adaptive.
