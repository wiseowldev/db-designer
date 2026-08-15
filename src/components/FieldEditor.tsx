import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PopoverContent } from '@/components/ui/popover'
import type { Field } from '@/types/schema'

type FieldPatch = Partial<Omit<Field, 'id'>>

export function FieldEditor({
  field,
  onChange,
  onRemove,
}: {
  field: Field
  onChange: (patch: FieldPatch) => void
  onRemove: () => void
}) {
  const [name, setName] = useState(field.name)
  const [type, setType] = useState(field.type)

  return (
    <PopoverContent className="w-64 space-y-3" align="start">
      <div className="space-y-1">
        <Label htmlFor="field-name">Name</Label>
        <Input
          id="field-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && onChange({ name: name.trim() })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="field-type">Type</Label>
        <Input
          id="field-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          onBlur={() => type.trim() && onChange({ type: type.trim() })}
        />
      </div>
      <div className="space-y-2">
        {(
          [
            ['pk', 'Primary key'],
            ['increment', 'Auto increment'],
            ['unique', 'Unique'],
            ['notNull', 'Not null'],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <Checkbox
              id={`field-${key}`}
              checked={!!field[key]}
              onCheckedChange={(checked) => onChange({ [key]: checked === true })}
            />
            <Label htmlFor={`field-${key}`} className="font-normal">
              {label}
            </Label>
          </div>
        ))}
      </div>
      <Button
        variant="destructive"
        size="sm"
        className="w-full"
        onClick={onRemove}
      >
        <Trash2 className="size-3.5" />
        Remove field
      </Button>
    </PopoverContent>
  )
}
