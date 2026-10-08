# Contributing to classicOS

Bug fixes, documentation improvements, and hardware testing are welcome.
Read the [README](README.md) for setup and build instructions and
[AGENTS.md](AGENTS.md) for source layout and compiler constraints.

## Issues

Search existing issues before opening a new one. For bug reports, include:

- The commit or release you tested.
- Your iPod model, or whether you used the simulator.
- Reproduction steps, expected behavior, and what happened.
- Relevant logs or screenshots, attached to the issue.

For performance reports, describe the interaction that is slow and whether
you measured it on hardware. Simulator timing does not establish iPod
performance. Reports from other iPod models are welcome; the current build
has been tested on iPod Video (5G).

Discuss large features or architecture changes in an issue before starting
work, so maintainers can confirm the scope fits the project.

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Keep the change focused. Avoid unrelated formatting or refactoring.
3. Add or update tests when the change affects behavior.
4. Run the checks below and the build relevant to your change.
5. Open a pull request against `main` and link any related issue.

Use a Conventional Commits title, such as `fix: correct volume display` or
`feat(shell): add a settings page`. Explain the problem, the resulting
behavior, and how you verified it. Include commands, results, and the device
used. State any checks you could not run. Draft pull requests are welcome
for work in progress; mark them ready for review when the change is complete.

```sh
bun install --frozen-lockfile
bun run typecheck
bun run test
bun run build:sim
# For firmware or native integration changes:
bun run build:ipod
```

Keep generated builds, validation logs, temporary recordings, and private
notes out of Git. Attach useful evidence to the pull request. Commit media
only when it is a maintained test fixture or an intentional documentation or
product asset.

## AI and LLM tools

If you use AI or LLM tools, please do not submit their output as a contribution
on its own. Maintainers have access to these tools too. Generated summaries,
speculative diagnoses, and repeated explanations of existing information do
not add useful evidence and take time to review.

AI-assisted contributions must meet the same standards as any other change.
Before submitting, personally review the complete contribution, verify
factual claims against the source, and test the result. Understand the code
you submit and be able to answer review questions and make revisions.
Submit a reproducible bug, a measured finding, or a working change that you
can explain and maintain. You are responsible for the contribution,
regardless of the tools used to produce it.

If AI assisted with the contribution, briefly describe its role in the issue
or pull request and what you reviewed and tested yourself.

### Human review is required

AI assistance is allowed, but a person must review and submit every issue
and pull request. Do not configure bots or autonomous agents to open issues
or pull requests without your review. Maintainers review contributions
before merging; an AI review does not replace that review.

### Automated and low-effort submissions

Fully automated submissions, unverified generated reports, and bulk
AI-generated pull requests are not welcome. Maintainers may close these
without further discussion. Repeated submissions or attempts to flood the
project with generated issues or changes may result in a contribution ban.

## Licensing

New classicOS code is licensed under GPL-2.0-or-later. PocketJS-derived code
retains its MIT license, and other third-party code retains its existing
terms. Preserve license and copyright notices. Only contribute code and
assets you have the right to redistribute under the applicable license.
