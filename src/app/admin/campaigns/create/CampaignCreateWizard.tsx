'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  createCampaign,
  type CreateCampaignInput,
  type StewardInstance,
} from '@/actions/campaign-crud'
import {
  QuestTemplateSelector,
  type SelectedTemplate,
} from '@/components/campaign/QuestTemplateSelector'
import { QuestTemplateCustomizeForm } from '@/components/campaign/QuestTemplateCustomizeForm'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WizardStep = 'name' | 'description' | 'instance' | 'quests' | 'customize' | 'review' | 'done'

const STEP_ORDER: WizardStep[] = ['name', 'description', 'instance', 'quests', 'customize', 'review']

const STEP_LABELS: Record<WizardStep, string> = {
  name: 'Name',
  description: 'Description',
  instance: 'Instance',
  quests: 'Quests',
  customize: 'Customize',
  review: 'Confirm',
  done: 'Done',
}

const ALLYSHIP_DOMAINS = [
  { value: 'GATHERING_RESOURCES', label: 'Gathering Resources' },
  { value: 'DIRECT_ACTION', label: 'Direct Action' },
  { value: 'RAISE_AWARENESS', label: 'Raise Awareness' },
  { value: 'SKILLFUL_ORGANIZING', label: 'Skillful Organizing' },
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: WizardStep }) {
  const currentIdx = STEP_ORDER.indexOf(current)

  return (
    <div className="flex items-center gap-1 mb-8">
      {STEP_ORDER.map((s, idx) => {
        const isActive = idx === currentIdx
        const isComplete = idx < currentIdx
        return (
          <div key={s} className="flex items-center gap-1">
            {idx > 0 && (
              <div
                className={`w-8 h-px ${
                  isComplete ? 'bg-purple-600' : 'bg-zinc-800'
                }`}
              />
            )}
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-purple-900/60 border border-purple-500 text-purple-100'
                  : isComplete
                    ? 'bg-purple-800/40 border border-purple-700/50 text-purple-300'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-600'
              }`}
            >
              {isComplete ? '✓' : idx + 1}
            </div>
            <span
              className={`text-xs hidden sm:inline ${
                isActive
                  ? 'text-purple-200 font-medium'
                  : isComplete
                    ? 'text-purple-400/70'
                    : 'text-zinc-600'
              }`}
            >
              {STEP_LABELS[s]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function WizardCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-purple-800/50 bg-zinc-950/80 p-6 space-y-6 max-w-2xl">
      {children}
    </div>
  )
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-white tracking-tight">{children}</h2>
  )
}

function StepDescription({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-zinc-400 leading-relaxed">{children}</p>
  )
}

function NavButtons({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  isPending = false,
}: {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
  isPending?: boolean
}) {
  return (
    <div className="flex flex-col gap-2 pt-2">
      <button
        type="button"
        disabled={nextDisabled || isPending}
        onClick={onNext}
        className="text-left px-4 py-3 rounded-xl border border-purple-800/50 bg-zinc-900/50 text-zinc-200 text-sm hover:border-purple-500 hover:bg-purple-950/20 transition-colors disabled:opacity-50 font-medium"
      >
        {nextLabel} →
      </button>
      {onBack && (
        <button
          type="button"
          disabled={isPending}
          onClick={onBack}
          className="text-left px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950/50 text-zinc-500 text-sm hover:text-zinc-300 disabled:opacity-50"
        >
          ← Back
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Input styling (matches project conventions)
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-600/50 transition-colors placeholder:text-zinc-600'

const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`

// ---------------------------------------------------------------------------
// Main Wizard
// ---------------------------------------------------------------------------

export function CampaignCreateWizard({
  instances,
}: {
  instances: StewardInstance[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // --- Draft state ---
  const [step, setStep] = useState<WizardStep>('name')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [allyshipDomain, setAllyshipDomain] = useState('')
  const [instanceId, setInstanceId] = useState(
    instances.length === 1 ? instances[0].id : '',
  )
  const [questTemplates, setQuestTemplates] = useState<SelectedTemplate[]>([])
  const [error, setError] = useState<string | null>(null)
  const [createdSlug, setCreatedSlug] = useState<string | null>(null)

  // Auto-generate slug from name unless manually edited
  const effectiveSlug = useMemo(
    () => (slugManuallyEdited ? slug : slugify(name)),
    [name, slug, slugManuallyEdited],
  )

  const selectedInstance = instances.find((i) => i.id === instanceId)

  // --- Step navigation ---
  function goNext() {
    setError(null)
    const idx = STEP_ORDER.indexOf(step)
    if (idx < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[idx + 1])
    }
  }
  function goBack() {
    setError(null)
    const idx = STEP_ORDER.indexOf(step)
    if (idx > 0) {
      setStep(STEP_ORDER[idx - 1])
    }
  }

  // --- Validation per step ---
  function validateName(): boolean {
    if (!name.trim()) {
      setError('Campaign name is required')
      return false
    }
    if (!effectiveSlug) {
      setError('Please provide a valid slug')
      return false
    }
    return true
  }

  function validateInstance(): boolean {
    if (!instanceId) {
      setError('Please select an instance')
      return false
    }
    return true
  }

  // --- Submit ---
  function handleCreate() {
    setError(null)
    startTransition(async () => {
      // Build quest template config from selected templates
      const questTemplateConfig = questTemplates.map((sel) => ({
        templateKey: sel.template.key,
        templateName: sel.template.name,
        settings: {
          ...(sel.template.defaultSettings as Record<string, unknown>),
          ...sel.settingsOverrides,
        },
        copy: {
          ...(sel.template.copyTemplate as Record<string, unknown>),
          ...sel.copyOverrides,
        },
      }))

      const input: CreateCampaignInput = {
        instanceId,
        name: name.trim(),
        slug: effectiveSlug,
        description: description.trim() || undefined,
        allyshipDomain: allyshipDomain || undefined,
        questTemplateConfig: questTemplateConfig.length > 0 ? questTemplateConfig : undefined,
      }
      const result = await createCampaign(input)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setCreatedSlug(result.slug)
      setStep('done')
      router.refresh()
    })
  }

  // =========================================================================
  // DONE state
  // =========================================================================
  if (step === 'done') {
    return (
      <WizardCard>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-900/40 border border-emerald-700/50 flex items-center justify-center text-emerald-300 text-lg">
            ✓
          </div>
          <div>
            <StepTitle>Campaign Created</StepTitle>
            <p className="text-sm text-zinc-400 mt-1">
              <strong className="text-zinc-200">{name}</strong> has been created
              in <strong className="text-zinc-200">draft</strong> status.
            </p>
          </div>
        </div>
        <p className="text-sm text-zinc-500">
          An admin must approve this campaign before it goes live. You can now
          configure the campaign theme and quest templates.
        </p>
        <div className="flex flex-wrap gap-4 text-sm pt-2">
          {createdSlug && (
            <>
              <Link
                href={`/admin/campaign/${encodeURIComponent(createdSlug)}/theme`}
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                Customize theme →
              </Link>
              <Link
                href={`/admin/campaign/${encodeURIComponent(createdSlug)}/author`}
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                Configure campaign →
              </Link>
            </>
          )}
          <Link
            href="/admin/campaigns/create"
            onClick={(e) => {
              e.preventDefault()
              setStep('name')
              setName('')
              setSlug('')
              setSlugManuallyEdited(false)
              setDescription('')
              setAllyshipDomain('')
              setInstanceId(instances.length === 1 ? instances[0].id : '')
              setQuestTemplates([])
              setError(null)
              setCreatedSlug(null)
            }}
            className="text-zinc-500 hover:text-zinc-300"
          >
            Create another
          </Link>
          <Link
            href="/admin/campaigns/review"
            className="text-zinc-500 hover:text-zinc-300"
          >
            Review queue
          </Link>
        </div>
      </WizardCard>
    )
  }

  // =========================================================================
  // STEP RENDERING
  // =========================================================================
  return (
    <WizardCard>
      <p className="text-[10px] uppercase tracking-widest text-purple-400/80">
        Campaign Creation · Step {STEP_ORDER.indexOf(step) + 1} of{' '}
        {STEP_ORDER.length}
      </p>

      <StepIndicator current={step} />

      {/* ----- Step: NAME ----- */}
      {step === 'name' && (
        <>
          <StepTitle>Name your campaign</StepTitle>
          <StepDescription>
            Choose a memorable name for your campaign. A URL-safe slug will be
            auto-generated, or you can customize it.
          </StepDescription>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
                Campaign Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
                placeholder="e.g. Summer Solidarity Drive"
                className={INPUT_CLASS}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
                Slug
              </label>
              <input
                type="text"
                value={effectiveSlug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setSlugManuallyEdited(true)
                  setError(null)
                }}
                placeholder="summer-solidarity-drive"
                className={INPUT_CLASS}
              />
              <p className="text-xs text-zinc-600 mt-1">
                Used in URLs: /campaign/{effectiveSlug || '...'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
                Allyship Domain{' '}
                <span className="text-zinc-600 font-normal">(optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ALLYSHIP_DOMAINS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() =>
                      setAllyshipDomain(
                        allyshipDomain === d.value ? '' : d.value,
                      )
                    }
                    className={`px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                      allyshipDomain === d.value
                        ? 'border-purple-600/60 bg-purple-950/30 text-purple-200'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <NavButtons
            onNext={() => validateName() && goNext()}
            nextDisabled={!name.trim()}
            isPending={isPending}
          />
        </>
      )}

      {/* ----- Step: DESCRIPTION ----- */}
      {step === 'description' && (
        <>
          <StepTitle>Describe your campaign</StepTitle>
          <StepDescription>
            A brief description helps participants understand the campaign
            purpose. You can edit this later.
          </StepDescription>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
              Description{' '}
              <span className="text-zinc-600 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What is this campaign about? Who is it for?"
              className={TEXTAREA_CLASS}
            />
            <p className="text-xs text-zinc-600 mt-1 tabular-nums">
              {description.length} characters
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <NavButtons
            onBack={goBack}
            onNext={goNext}
            isPending={isPending}
          />
        </>
      )}

      {/* ----- Step: INSTANCE SELECTION ----- */}
      {step === 'instance' && (
        <>
          <StepTitle>Select an instance</StepTitle>
          <StepDescription>
            Every campaign belongs to an instance. Choose which instance will
            host this campaign.
          </StepDescription>

          {instances.length === 0 ? (
            <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4 text-sm text-amber-300">
              No instances available. You need steward or owner access on at
              least one instance to create a campaign.
            </div>
          ) : (
            <div className="space-y-2">
              {instances.map((inst) => (
                <button
                  key={inst.id}
                  type="button"
                  onClick={() => {
                    setInstanceId(inst.id)
                    setError(null)
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    instanceId === inst.id
                      ? 'border-purple-600/60 bg-purple-950/30 text-purple-100'
                      : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  <div className="font-medium text-sm">{inst.name}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    /{inst.slug} · {inst.campaignCount} campaign
                    {inst.campaignCount !== 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <NavButtons
            onBack={goBack}
            onNext={() => validateInstance() && goNext()}
            nextDisabled={!instanceId}
            isPending={isPending}
          />
        </>
      )}

      {/* ----- Step: QUESTS (template selection) ----- */}
      {step === 'quests' && (
        <>
          <StepTitle>Add quest templates</StepTitle>
          <StepDescription>
            Choose quest templates for your campaign. Browse by category, preview
            details, and select the quests your players will encounter. You can
            customize the copy and settings in the next step.
          </StepDescription>

          <QuestTemplateSelector
            selectedTemplates={questTemplates}
            onTemplatesChange={setQuestTemplates}
            maxTemplates={10}
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <NavButtons
            onBack={goBack}
            onNext={goNext}
            nextLabel={
              questTemplates.length > 0
                ? `Customize ${questTemplates.length} quest${questTemplates.length !== 1 ? 's' : ''}`
                : 'Skip quests for now'
            }
            isPending={isPending}
          />
        </>
      )}

      {/* ----- Step: CUSTOMIZE (quest copy/settings) ----- */}
      {step === 'customize' && (
        <>
          <StepTitle>Customize your quests</StepTitle>
          <StepDescription>
            Fine-tune the copy, settings, and ordering of your selected quest
            templates. Expand each quest to edit its title, description, and
            reward settings. You can always adjust these later.
          </StepDescription>

          {questTemplates.length > 0 ? (
            <QuestTemplateCustomizeForm
              selectedTemplates={questTemplates}
              onTemplatesChange={setQuestTemplates}
              campaignName={name}
            />
          ) : (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 text-center space-y-2">
              <p className="text-sm text-zinc-400">
                No quest templates selected. You can add quests later from the
                campaign author page.
              </p>
              <button
                type="button"
                onClick={goBack}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                Go back to add quests
              </button>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <NavButtons
            onBack={goBack}
            onNext={goNext}
            isPending={isPending}
          />
        </>
      )}

      {/* ----- Step: REVIEW ----- */}
      {step === 'review' && (
        <>
          <StepTitle>Review & create</StepTitle>
          <StepDescription>
            Confirm your campaign details. It will be created in{' '}
            <strong className="text-zinc-200">draft</strong> status and require
            admin approval before going live.
          </StepDescription>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4 space-y-3">
            <div>
              <span className="text-xs uppercase tracking-widest text-zinc-500">
                Name
              </span>
              <p className="text-sm text-zinc-200 font-medium">{name}</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-zinc-500">
                Slug
              </span>
              <p className="text-sm text-zinc-400 font-mono">
                {effectiveSlug}
              </p>
            </div>
            {description && (
              <div>
                <span className="text-xs uppercase tracking-widest text-zinc-500">
                  Description
                </span>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                  {description}
                </p>
              </div>
            )}
            {allyshipDomain && (
              <div>
                <span className="text-xs uppercase tracking-widest text-zinc-500">
                  Allyship Domain
                </span>
                <p className="text-sm text-zinc-300">
                  {ALLYSHIP_DOMAINS.find((d) => d.value === allyshipDomain)
                    ?.label ?? allyshipDomain}
                </p>
              </div>
            )}
            <div>
              <span className="text-xs uppercase tracking-widest text-zinc-500">
                Instance
              </span>
              <p className="text-sm text-zinc-200">
                {selectedInstance?.name ?? 'Unknown'}
                <span className="text-zinc-500 ml-2">
                  /{selectedInstance?.slug}
                </span>
              </p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-zinc-500">
                Quests
              </span>
              {questTemplates.length > 0 ? (
                <div className="space-y-1 mt-1">
                  {questTemplates.map((sel, idx) => (
                    <p
                      key={`${sel.template.key}-${idx}`}
                      className="text-sm text-zinc-300"
                    >
                      <span className="text-zinc-500 mr-1.5 tabular-nums">
                        {idx + 1}.
                      </span>
                      {sel.template.name}
                      {Object.keys(sel.copyOverrides).length > 0 && (
                        <span className="text-purple-400/70 text-xs ml-1">
                          (customized)
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 italic">
                  No quests selected (can add later)
                </p>
              )}
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-zinc-500">
                Status
              </span>
              <p className="text-sm">
                <span className="inline-block px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs font-medium">
                  DRAFT
                </span>
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleCreate}
              className="text-left px-4 py-3 rounded-xl border border-purple-700/60 bg-purple-950/30 text-purple-100 text-sm hover:border-purple-500 hover:bg-purple-900/30 transition-colors disabled:opacity-50 font-medium"
            >
              {isPending ? 'Creating...' : 'Create campaign →'}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={goBack}
              className="text-left px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950/50 text-zinc-500 text-sm hover:text-zinc-300 disabled:opacity-50"
            >
              ← Back
            </button>
          </div>
        </>
      )}
    </WizardCard>
  )
}
