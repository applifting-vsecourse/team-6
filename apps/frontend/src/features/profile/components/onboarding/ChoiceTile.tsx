import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroupItem } from "@/components/ui/radio-group"

import { tileCheckboxClass, tileClass, tileRadioClass } from "@/features/profile/lib/optionStyles"

type ChoiceTileProps =
  | {
      kind: "check"
      label: string
      isChecked: boolean
      onCheckedChange: (isChecked: boolean) => void
    }
  /** Inside a `RadioGroup`, which owns the value. */
  | { kind: "radio"; label: string; value: string }

/** One answer of a list, as a soft tile: a checkbox for "as many as you like", a radio for "pick one". */
export function ChoiceTile(props: ChoiceTileProps) {
  return (
    <label className={tileClass}>
      {props.kind === "check" ? (
        <Checkbox
          className={tileCheckboxClass}
          checked={props.isChecked}
          onCheckedChange={(value) => props.onCheckedChange(value === true)}
        />
      ) : (
        <RadioGroupItem
          className={tileRadioClass}
          value={props.value}
        />
      )}
      {props.label}
    </label>
  )
}
