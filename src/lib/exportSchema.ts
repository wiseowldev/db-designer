import { schemaToDbml } from '@/dbml/print'
import { saveDbmlToFile } from '@/dbml/file'
import { useSchemaStore } from '@/store/schemaStore'

export function exportCurrentSchema() {
  const dbmlText = schemaToDbml(useSchemaStore.getState().schema)
  return saveDbmlToFile(dbmlText)
}
