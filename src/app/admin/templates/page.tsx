import { listTemplates } from '@/lib/template-library'
import { AdminPageHeader } from '@/app/admin/components/AdminPageHeader'
import Link from 'next/link'
import { GenerateTemplateButton } from './GenerateTemplateButton'
import { getActiveInstance } from '@/actions/instance'

/**
 * @page /admin/templates
 * @entity QUEST
 * @description Template library - generate draft Adventures from reusable templates with campaign context
 * @permissions admin
 * @relationships GENERATES (Adventure from template)
 * @dimensions WHO:admin, WHAT:QUEST, WHERE:campaignRef, PERSONAL_THROUGHPUT:grow-up
 * @example /admin/templates
 * @agentDiscoverable false
 */
export default async function TemplatesAdminPage() {
  const [templates, instance] = await Promise.all([
    listTemplates(),
    getActiveInstance(),
  ])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Template Library"
        description="Generate draft Adventures from reusable templates. Edit and promote to Active when ready."
        action={
          <Link
            href="/admin/adventures"
            className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
          >
            ← Adventures
          </Link>
        }
      />

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {templates.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            No templates found. Run <code className="font-mono text-sm">npm run seed:adventure-templates</code> to seed.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {templates.map((t) => (
              <div
                key={t.id}
                className="p-6 flex items-start justify-between gap-4"
              >
                <div>
                  <h3 className="font-medium text-zinc-200">{t.name}</h3>
                  <p className="text-sm text-zinc-500 mt-1">{t.description ?? t.key}</p>
                  <p className="text-xs text-zinc-600 mt-1 font-mono">{t.key}</p>
                </div>
                <GenerateTemplateButton
                  templateId={t.id}
                  templateName={t.name}
                  defaultCampaignRef={instance?.campaignRef}
                  primaryCampaignDomain={instance?.primaryCampaignDomain}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
