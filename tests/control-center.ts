// Run: bun apps/classicos/tests/control-center.ts
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { analyzeModel } from "../../../pocketjs/microts/compiler/aot-model-frontend.ts";
import { ModelInterpreter } from "../../../pocketjs/microts/compiler/model-interp.ts";

const program = analyzeModel(resolve(import.meta.dir, "../shell/app.ts"));
const model = new ModelInterpreter(program, {
  services: { "@pocketjs/framework/rockbox/system/model": {} },
});
model.write("screen", "now");
model.write("title", "A title long enough to scroll");
model.call("marqueeTick");
model.write("marqueeWidth", 300);
model.frame({ clock: 2100 });
model.call("marqueeTick");
const offset = model.state().marqueeOffset;
assert.ok(offset > 0);
model.call("openControlCenter");
model.call("marqueeTick");
assert.equal(model.state().marqueeOffset, offset, "hidden marquee must stop");
assert.equal(model.state().ccIndex, 0);
model.call("ccWheel", [15000]);
model.call("ccSelect");
assert.equal(model.state().shuffle, true);
model.call("ccWheel", [15000]);
for (const expected of [1, 2, 0]) {
  model.call("ccSelect");
  assert.equal(model.state().repeat, expected);
}
model.call("back");
assert.equal(model.state().ccOpen, false);
assert.equal(model.state().screen, "now", "Menu must return to the same screen");
model.call("marqueeTick");
assert.ok(model.state().marqueeOffset > offset);
model.call("openControlCenter");
model.call("ccSelect");
assert.equal(model.state().ccOpen, false);
assert.equal(model.state().volumeMode, true);
assert.equal(model.state().volumeShown, true);
model.call("back");
model.call("openControlCenter");
model.call("ccWheel", [45000]);
model.call("ccSelect");
assert.equal(model.state().powerOffWanted, true, "one Select must request shutdown");
let frame = model.frame({ dispatch: [{ fn: "poll" }] });
let shutdownRequested = false;
for (let i = 0; i < 16 && !shutdownRequested; i++) {
  const requests = frame.trace.filter(e => e.kind === "request");
  shutdownRequested = requests.some(e => e.call === "powerOff");
  if (!shutdownRequested) frame = model.frame({
    clock: 2100 + i * 33,
    deliveries: requests.map(e => ({ request: e.request, value: { kind: "unavailable" } })),
  });
}
assert.ok(shutdownRequested,
  "shutdown must reach the host service without a confirmation");
console.log("Control Center model checks passed");
