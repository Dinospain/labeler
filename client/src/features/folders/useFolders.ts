import { useCallback, useEffect, useState } from 'react'
import { foldersApi } from '../../api/folders'
import { errorMessage } from '../../api/client'
import type { Folder } from '../../types'

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    foldersApi.list()
      .then((items) => { if (alive) setFolders(items) })
      .catch((e) => { if (alive) setError(errorMessage(e, 'Не удалось загрузить папки')) })
    return () => { alive = false }
  }, [])

  const create = useCallback(async (name: string) => {
    const f = await foldersApi.create(name)
    setFolders((prev) => [...prev, f])
    return f
  }, [])

  const remove = useCallback(async (id: number) => {
    await foldersApi.remove(id)
    setFolders((prev) => prev.filter((f) => f.id !== id))
  }, [])

  return { folders, error, create, remove }
}
