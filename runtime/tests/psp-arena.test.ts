import { allocatorCases } from "./helpers/psp-allocator-harness.ts";

allocatorCases("permanent", [
  "exact_large_request",
  "failed_requests_preserve_tail",
  "alignment_and_recycling_do_not_overlap",
  "exact_fit_then_exhaustion",
  "free_list_is_not_permanent_tail",
  "kernel_reservation_failure",
]);
