# Campaign Playbook System v0

Living strategy document per campaign (Instance). Synthesizes BARs, quests, events into human-readable narrative.

## Specs

- [Campaign Playbook System](../../../docs/architecture/campaign-playbook-system.md)
- [Campaign Playbook API](../../../docs/architecture/campaign-playbook-api.md)

## Implementation Status

- [x] CampaignPlaybook model (Prisma)
- [x] Types (Playbook, UpdatePlaybookInput, CampaignDeck, etc.)
- [x] Server Actions: getPlaybook, updatePlaybook, generatePlaybook, exportPlaybook, exportPlaybookSnippet, getCampaignDeck
- [x] Artifact collection + synthesis (Phase 3)
- [ ] UI integration (campaign page, admin)

## Usage

```ts
import {
  getPlaybook,
  updatePlaybook,
  generatePlaybook,
  exportPlaybook,
  exportPlaybookSnippet,
  getCampaignDeck,
} from '@/actions/playbook'

const result = await getPlaybook(instanceId)
const deck = await getCampaignDeck(instanceId)
const md = await exportPlaybook({ instanceId, format: 'markdown' })
```

## Note

Model is `CampaignPlaybook` (not `Playbook`) to avoid conflict with the existing Playbook model (archetype/player playbook).
