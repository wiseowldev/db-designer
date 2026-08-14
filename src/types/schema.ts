export type Field = {
  id: string
  name: string
  type: string
  pk?: boolean
  unique?: boolean
  notNull?: boolean
  default?: string
  note?: string
}

export type Table = {
  id: string
  name: string
  note?: string
  position: { x: number; y: number }
  fields: Field[]
}

export type RefRelation = '1-1' | '1-n' | 'n-1' | 'n-n'

export type Ref = {
  id: string
  fromTableId: string
  fromFieldId: string
  toTableId: string
  toFieldId: string
  relation: RefRelation
}

export type Schema = {
  tables: Table[]
  refs: Ref[]
}

export const emptySchema: Schema = {
  tables: [],
  refs: [],
}
