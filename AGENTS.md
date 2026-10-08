# classicOS development

classicOS is custom iPod firmware based on Rockbox. The current build targets
and has been tested on iPod Video (5G).

## Source layout

- `shell/`: MicroTS UI, model, icons.
- `host/`: native boot, input, settings, playback/library services, renderer.
- `host/rust/`: standalone Rust firmware host.
- `runtime/`: PocketJS engine, compiler, and framework.
- `system/`: Rockbox source, with internal paths preserved.
- `scripts/`: build, simulator, and deployment commands.
- `tests/`: model and renderer checks.
- `out/`: ignored build output and simulator disk.

The build creates file links under `system/apps/classicos/`. Edit their
maintained sources in `host/`. The runtime's `hosts/rockbox/` is a separate
plugin host; firmware builds use `host/rust/`.

## Commands

Run from the repository root:

```sh
bun install --frozen-lockfile
bun run build:sim
bun run build:ipod
bun run test
bun run sim
bun run deploy /Volumes/<iPod>
```

The simulator disk is `out/sim/simdisk/`. The firmware image is
`out/ipod/rockbox.ipod`. `PJS_HUD=1` enables profiling; `PJS_APP=<name>`
selects an example from `runtime/apps/`.

## Compiler and rendering constraints

- UI state lives in `shell/app.ts`, paired with `shell/app.tsx`.
- Child components receive state and callbacks through props; side modules are pure.
- Use one default-exported component per `.tsx` file and explicit `.tsx` imports.
- `Show` requires a boolean. Required props avoid optional-value compiler errors.
- Compiled `await` expressions must be standalone statements or local initializers.
- Images use literal sources and power-of-two square textures. Native-size icons avoid resampling.
- Fully transparent fills omit drawing operations. Changing operation counts can trigger full repaint; focus styling uses color changes on existing geometry.
- Model timers use ticks and `after(ms)`; poll counts are not elapsed time.
- The native UI runs on its own thread with a 96 KiB stack. Playback and filesystem operations run there, not on the boot stack.

## Validation and contributions

- Run checks relevant to the change. Use the simulator for UI changes and the iPod build for native integration; simulator success does not establish hardware performance.
- Keep temporary screenshots, recordings, logs, traces, benchmarks, and build receipts under ignored `out/validation/<task>/<run>/` or outside Git.
- Track media only when a maintained test consumes it or it is an intentional product/documentation asset. README images live under `docs/images/`.
- Before staging, inspect the file list for generated output and private notes. Preserve needed originals outside Git and repair links when removing artifacts.
- Use Conventional Commits for commit and PR titles. Describe the resulting behavior, reproducible validation commands, target device, and measured limits in the PR description.
- Documentation explains mechanisms and concrete constraints. Keep personal commentary, tool personas, and research notes out of public source and commit messages.
- Preserve existing third-party license and copyright notices. New classicOS code uses GPL-2.0-or-later; PocketJS-derived code retains its original license.

If present, read `AGENTS.local.md` for local profiling and debugging notes.
