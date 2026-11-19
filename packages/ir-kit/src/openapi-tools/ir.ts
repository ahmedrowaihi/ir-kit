import type { IR } from "../ir/index.js";

import { type Route, specToPattern } from "./route.js";

const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;

/** Extract `Route[]` from a parsed IR — for runtime-loaded specs without codegen. */
export function routesFromIR(ir: IR.Model): Route[] {
  const out: Route[] = [];
  for (const [spec, pathItem] of Object.entries(ir.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (!op) continue;
      out.push({
        spec,
        pattern: specToPattern(spec),
        method,
        operationId: op.operationId,
      });
    }
  }
  return out;
}
