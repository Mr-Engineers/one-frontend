import { useEffect, useState } from 'react'
import { RiArrowLeftLine } from '@remixicon/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  createQuotaId,
  findAgent,
  type QuotaWindow,
  type RateLimitQuota,
} from '@/mocks'

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
  agentId,
}: {
  open: boolean
  onClose: () => void
  onCreated: (quota: RateLimitQuota) => void
  agentId: string
}) {
  const agent = findAgent(agentId)
  const [name, setName] = useState('')
  const [window, setWindow] = useState<QuotaWindow>('1h')
  const [cap, setCap] = useState('100')
  const [burst, setBurst] = useState('10')

  useEffect(() => {
    if (!open) {
      setName('')
      setWindow('1h')
      setCap('100')
      setBurst('10')
    }
  }, [open])

  if (!open) return null

  const capNum = Number(cap)
  const burstNum = Number(burst)
  const capValid = Number.isFinite(capNum) && capNum > 0
  const burstValid = Number.isFinite(burstNum) && burstNum >= 0
  const canCreate = name.trim().length > 0 && capValid && burstValid

  function create() {
    if (!canCreate) return
    const now = new Date().toISOString()
    onCreated({
      id: createQuotaId(agentId, window),
      name: name.trim(),
      agentId,
      agentName: agent?.name ?? agentId,
      window,
      cap: Math.floor(capNum),
      used: 0,
      unit: 'calls',
      enabled: true,
      burst: Math.floor(burstNum),
      updatedAt: now,
    })
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
          >
            <RiArrowLeftLine className="size-4" />
          </Button>
          <div>
            <p className="text-sm font-medium">New rate limit</p>
            <p className="text-muted-foreground font-mono text-[11px]">
              {agent?.name ?? agentId} · window · cap
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </header>

      <form
        className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 overflow-y-auto px-6 py-10"
        onSubmit={(e) => {
          e.preventDefault()
          create()
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

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canCreate}>
            Create
          </Button>
        </div>
      </form>
    </div>
  )
}
