import { describe, expect, it } from "vitest";

import type { IR } from "../../src/ir/index";
import { routesFromIR } from "../../src/openapi-tools/ir";
import { match } from "../../src/openapi-tools/match";
import { specToPattern } from "../../src/openapi-tools/route";

const routes = (paths: Record<string, string>) =>
  routesFromIR({
    paths: Object.fromEntries(
      Object.entries(paths).map(([spec, operationId]) => [
        spec,
        { get: { operationId } },
      ]),
    ),
  } as unknown as IR.Model);

const get = (r: ReturnType<typeof routes>, path: string) =>
  match(r, new Request(`http://api.test${path}`));

describe("match", () => {
  it("keeps param names that are not identifiers", () => {
    const r = routes({
      "/pets/{pet-id}": "getPet",
      "/files/{file.name}": "getFile",
    });
    expect(get(r, "/pets/123")?.params).toEqual({ "pet-id": "123" });
    expect(get(r, "/files/a.txt")?.params).toEqual({ "file.name": "a.txt" });
  });

  it("treats `:` after a param as literal text", () => {
    const r = routes({ "/v1/{name}:cancel": "cancel" });
    expect(get(r, "/v1/jobs1:cancel")?.params).toEqual({ name: "jobs1" });
    expect(get(r, "/v1/jobs1")).toBeNull();
  });

  it("treats URLPattern syntax in literal text as literal", () => {
    const r = routes({ "/a+b": "plus", "/a": "a", "/x(y)*?": "odd" });
    expect(get(r, "/a")?.operationId).toBe("a");
    expect(get(r, "/a+b")?.operationId).toBe("plus");
    expect(get(r, "/aab")).toBeNull();
    expect(get(r, "/x(y)*%3F")?.operationId).toBe("odd");
    expect(get(r, "/xy")).toBeNull();
  });

  it("prefers a literal segment over one mixing a param with literal text", () => {
    const r = routes({
      "/v1/{name}.json": "byName",
      "/v1/special.json": "special",
    });
    expect(get(r, "/v1/special.json")?.operationId).toBe("special");
    expect(get(r, "/v1/other.json")?.params).toEqual({ name: "other" });
  });

  it("prefers a segment with literal text over a bare param", () => {
    const r = routes({ "/v1/{name}": "get", "/v1/{name}:cancel": "cancel" });
    expect(get(r, "/v1/a:cancel")?.operationId).toBe("cancel");
    expect(get(r, "/v1/a")?.operationId).toBe("get");
  });
});

describe("specToPattern", () => {
  it("emits identifier group names and escaped literals", () => {
    expect(specToPattern("/pets/{pet-id}")).toBe("/pets/:pet_id");
    expect(specToPattern("/v1/{name}:cancel")).toBe("/v1/:name\\:cancel");
    expect(specToPattern("/{id}abc")).toBe("/:id\\abc");
    expect(specToPattern("/a+b/{0}")).toBe("/a\\+b/:_0");
  });
});
