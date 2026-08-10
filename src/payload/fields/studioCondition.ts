import type { Field } from "payload";

/**
 * Serializable field visibility rules for the custom admin. Payload's own
 * `admin.condition` is a function and cannot cross the RSC → client boundary,
 * so every conditional field also carries one of these under
 * `admin.custom.studioCondition`.
 */
export type StudioCondition =
  | { kind: "siblingEq"; field: string; value: unknown }
  | { kind: "siblingNeq"; field: string; value: unknown }
  | { kind: "siblingTruthy"; field: string }
  | { kind: "rootTruthy"; field: string }
  | { kind: "and"; conditions: StudioCondition[] }
  | { kind: "or"; conditions: StudioCondition[] };

type ConditionFn = NonNullable<NonNullable<Field["admin"]>["condition"]>;

/** Attaches a Payload `admin.condition` plus the matching studio descriptor. */
export function withStudioCondition<T extends Field>(
  field: T,
  studio: StudioCondition,
  condition: ConditionFn,
): T {
  const admin = (field.admin ?? {}) as Record<string, unknown>;
  const custom =
    admin.custom && typeof admin.custom === "object"
      ? (admin.custom as Record<string, unknown>)
      : {};

  return {
    ...field,
    admin: {
      ...admin,
      condition,
      custom: {
        ...custom,
        studioCondition: studio,
      },
    },
  } as T;
}

/** Evaluate a studio condition against the sibling object and document root. */
export function matchStudioCondition(
  condition: StudioCondition | undefined,
  siblingData: Record<string, unknown>,
  rootData: Record<string, unknown>,
): boolean {
  if (!condition) return true;

  switch (condition.kind) {
    case "siblingEq":
      return siblingData[condition.field] === condition.value;
    case "siblingNeq":
      return siblingData[condition.field] !== condition.value;
    case "siblingTruthy":
      return Boolean(siblingData[condition.field]);
    case "rootTruthy":
      return Boolean(rootData[condition.field]);
    case "and":
      return condition.conditions.every((entry) =>
        matchStudioCondition(entry, siblingData, rootData),
      );
    case "or":
      return condition.conditions.some((entry) =>
        matchStudioCondition(entry, siblingData, rootData),
      );
  }
}
