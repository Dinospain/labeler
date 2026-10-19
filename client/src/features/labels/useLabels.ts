import { useCallback, useEffect, useState } from 'react'
import { labelsApi } from '../../api/labels'
import { errorMessage } from '../../api/client'
import type { Label, LabelPayload } from '../../types'

export function useLabels() {
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    labelsApi.list()
      .then((items) => { if (alive) setLabels(items) })
      .catch((e) => { if (alive) setError(errorMessage(e, 'Не удалось загрузить этикетки')) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const create = useCallback(async (payload: LabelPayload) => {
    const created = await labelsApi.create(payload)
    setLabels((prev) => [created, ...prev])
    return created
  }, [])

  const update = useCallback(async (id: number, payload: LabelPayload) => {
    const updated = await labelsApi.update(id, payload)
    setLabels((prev) => prev.map((l) => (l.id === id ? updated : l)))
    return updated
  }, [])

  const remove = useCallback(async (id: number) => {
    await labelsApi.remove(id)
    setLabels((prev) => prev.filter((l) => l.id !== id))
  }, [])

  // после удаления папки сервер обнуляет folderId у её этикеток (ON DELETE SET NULL)
  const detachFolder = useCallback((folderId: number) => {
    setLabels((prev) => prev.map((l) => (l.folderId === folderId ? { ...l, folderId: null } : l)))
  }, [])

  return { labels, loading, error, create, update, remove, detachFolder }
}
