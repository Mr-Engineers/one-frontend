import { useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useSquashReveal } from '@/components/squash-reveal'

/** URL-synced squash list/detail (Yovo admin pattern). */
export function useListDetailSquash<T extends { id: string }>({
  listPath,
  paramKey,
  rows,
  detailPath,
}: {
  listPath: string
  paramKey: string
  rows: T[]
  detailPath: (id: string) => string
}) {
  const navigate = useNavigate()
  const params = useParams()
  const selectedId = params[paramKey]
  const squash = useSquashReveal<T>()

  const openRow = useCallback(
    (row: T) => {
      squash.open(row)
      if (selectedId !== row.id) {
        navigate(detailPath(row.id))
      }
    },
    [detailPath, navigate, selectedId, squash],
  )

  const closeRow = useCallback(() => {
    squash.requestClose()
    if (selectedId) {
      navigate(listPath)
    }
  }, [listPath, navigate, selectedId, squash])

  useEffect(() => {
    if (!selectedId) {
      if (squash.overlay && squash.overlay.phase !== 'anim_out') {
        squash.requestClose()
      }
      return
    }
    if (squash.overlay?.payload.id === selectedId) return
    const fromList = rows.find((row) => row.id === selectedId)
    if (fromList) {
      squash.open(fromList)
    }
  }, [rows, selectedId, squash])

  useEffect(() => {
    if (!squash.overlay) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRow()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeRow, squash.overlay])

  return { squash, openRow, closeRow, selectedId }
}
