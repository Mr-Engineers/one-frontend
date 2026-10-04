import { useEffect, useState } from 'react'
import { RiArrowLeftLine } from '@remixicon/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

type QuotaWindow = '1m' | '1h' | '1d'

export type QuotaWizardInput = {
  name: string
  window: QuotaWindow
  cap: number
  burst: number
}

const WINDOW_OPTIONS: QuotaWindow[] = ['1m', '1h', '1d']

const WINDOW_LABELS: Record<QuotaWindow, string> = {
  '1m': 'Every minute',
  '1h': 'Every hour',
  '1d': 'Every day',
}

export function CreateQuotaWizard({
  open,
  onClose,
  onCreated,
  agentName,
}: {
  open: boolean
  onClose: () => void
  onCreated: (input: QuotaWizardInput) => void | Promise<void>
  agentName: string
}) {
  const [name, setName] = useState('')
  const [window, setWindow] = useState<QuotaWindow>('1h')
  const [cap, setCap] = useState('100')
  const [burst, setBurst] = useState('10')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setName('')
      setWindow('1h')
      setCap('100')
      setBurst('10')
      setSubmitting(false)
      setError(null)
    }
  }, [open])

  if (!open) return null

  const capNum = Number(cap)
  const burstNum = Number(burst)
  const capValid = Number.isFinite(capNum) && capNum > 0
  const burstValid = Number.isFinite(burstNum) && burstNum >= 0
  const canCreate =
    name.trim().length > 0 && capValid && burstValid && !submitting

  async function create() {
    if (!canCreate) return
    setSubmitting(true)
    setError(null)
    try {
      await onCreated({
        name: name.trim(),
        window,
        cap: Math.floor(capNum),
        burst: Math.floor(burstNum),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-card absolute inset-0 z-20 flex flex-col overflow-hidden">
      <header className="border-border flex h-12 shrink-0 items-center justify-between gap-3 border-b px-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Back"
            onClick={onClose}
            disabled={submitting}
          >
            <RiArrowLeftLine className="size-4" />
          </Button>
          <div>
            <p className="text-sm font-medium">New rate limit</p>
            <p className="text-muted-foreground font-mono text-[11px]">
              {agentName} · window · cap
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
      </header>

      <form
        className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 overflow-y-auto px-4 py-8 sm:px-6 sm:py-10"
        onSubmit={(e) => {
          e.preventDefault()
          void create()
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="new-quota-name"
            className="text-muted-foreground font-mono text-[11px]"
          >
            name
          </Label>
          <Input
            id="new-quota-name"
            value={name}
            placeholder="Hourly cap"
            autoFocus
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="new-quota-window"
              className="text-muted-foreground font-mono text-[11px]"
            >
              window
            </Label>
            <Select
              id="new-quota-window"
              value={window}
              onValueChange={(next) => setWindow(next as QuotaWindow)}
              options={WINDOW_OPTIONS.map((w) => ({
                value: w,
                label: WINDOW_LABELS[w],
              }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="new-quota-cap"
              className="text-muted-foreground font-mono text-[11px]"
            >
              cap
            </Label>
            <Input
              id="new-quota-cap"
              type="number"
              min={1}
              step={1}
              value={cap}
              aria-invalid={!capValid}
              onChange={(e) => setCap(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label
              htmlFor="new-quota-burst"
              className="text-muted-foreground font-mono text-[11px]"
            >
              burst
            </Label>
            <Input
              id="new-quota-burst"
              type="number"
              min={0}
              step={1}
              value={burst}
              aria-invalid={!burstValid}
              onChange={(e) => setBurst(e.target.value)}
            />
            <p className="text-muted-foreground text-[11px]">
              Short headroom above the steady cap. Calls over the limit are
              blocked.
            </p>
          </div>
        </div>

        {error ? <p className="text-destructive text-xs">{error}</p> : null}

        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!canCreate}>
            {submitting ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}
