import type { Field } from "payload";

type ConditionFn = NonNullable<NonNullable<Field["admin"]>["condition"]>;

/** Attach a Payload `admin.condition` without clobbering other admin options. */
export function withAdminCondition<T extends Field>(
  field: T,
  condition: ConditionFn,
): T {
  return {
    ...field,
    admin: {
      ...(field.admin ?? {}),
      condition,
    },
  } as T;
}
