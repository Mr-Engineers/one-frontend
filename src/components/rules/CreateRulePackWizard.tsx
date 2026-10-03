import { useEffect, useState } from 'react'
import { RiArrowLeftLine } from '@remixicon/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { AGENT_IDS, createPackId, mockAgents, type RulePack } from '@/mocks'

export function CreateRulePackWizard({
  open,
  existingNames,
  onClose,
  onCreated,
  lockedAgentId,
}: {
  open: boolean
  existingNames: string[]
  onClose: () => void
  onCreated: (pack: RulePack) => void
  /** When set, agent is fixed (e.g. creating from an agent hub). */
  lockedAgentId?: string
}) {
  const [name, setName] = useState('')
  const [agentId, setAgentId] = useState<string>(
    lockedAgentId ?? AGENT_IDS.purchasing,
  )
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!open) {
      setName('')
      setAgentId(lockedAgentId ?? AGENT_IDS.purchasing)
      setDescription('')
    }
  }, [lockedAgentId, open])

  if (!open) return null

  const slug = name.trim().toLowerCase().replace(/\s+/g, '_')
  const duplicate = existingNames.includes(slug)
  const canCreate = slug.length > 0 && !duplicate

  const resolvedAgentId = lockedAgentId ?? agentId

  function create() {
    if (!canCreate) return
    const now = new Date().toISOString()
    onCreated({
      id: createPackId(slug),
      name: slug,
      agentId: resolvedAgentId,
      description:
        description.trim() ||
        'Draft pack — add rules and publish when ready.',
      activeVersion: 'v1',
      updatedAt: now,
      versions: [
        {
          version: 'v1',
          status: 'draft',
          rules: [],
          updatedAt: now,
        },
      ],
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
            <p className="text-sm font-medium">New rule pack</p>
            <p className="text-muted-foreground font-mono text-[11px]">
              name · agent
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
            htmlFor="new-pack-name"
            className="text-muted-foreground font-mono text-[11px]"
          >
            name
          </Label>
          <Input
            id="new-pack-name"
            value={name}
            placeholder="purchasing_eu"
            autoFocus
            onChange={(e) => setName(e.target.value)}
          />
          {slug ? (
            <p className="text-muted-foreground font-mono text-[11px]">
              pack:{slug}/v1
              {duplicate ? ' · name already exists' : null}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="new-pack-agent"
            className="text-muted-foreground font-mono text-[11px]"
          >
            agent
          </Label>
          {lockedAgentId ? (
            <p className="text-[13px]">
              {mockAgents.find((a) => a.id === lockedAgentId)?.name ??
                lockedAgentId}
            </p>
          ) : (
            <Select
              id="new-pack-agent"
              value={agentId}
              onValueChange={setAgentId}
              options={mockAgents.map((agent) => ({
                value: agent.id,
                label: agent.name,
              }))}
            />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="new-pack-desc"
            className="text-muted-foreground font-mono text-[11px]"
          >
            description
          </Label>
          <Input
            id="new-pack-desc"
            value={description}
            placeholder="Location + amount gates for shop checkout"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canCreate}>
            Create pack
          </Button>
        </div>
      </form>
    </div>
  )
}
