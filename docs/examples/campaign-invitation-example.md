# Campaign Invitation Example

## Example: Bruised Banana Residency Campaign

### Invitations

| Target | Invited Role | Status | RACI |
|--------|--------------|--------|------|
| Carolyn & Jim | Stewards | Accepted | Accountable |
| Amanda | Event Architect | Sent | Informed |
| JJ | Producer | Accepted | Consulted |
| AJ | Origin Witness | Sent | Informed |
| Valkyrie | Cultural Catalyst | Sent | Informed |

---

## Example Invitation Object

```json
{
  "id": "inv-001",
  "instanceId": "inst-bruised-banana",
  "targetActorId": "player-carolyn",
  "invitedRole": "Stewards",
  "acceptedRole": "accountable",
  "invitationType": "guiding_coalition",
  "messageText": "Carolyn & Jim — We'd love you to join as stewards for the Bruised Banana Residency. Your oversight would help ensure the campaign stays aligned with community values.",
  "status": "accepted",
  "createdByActorId": "player-wendell",
  "createdAt": "2024-03-01T00:00:00Z",
  "respondedAt": "2024-03-05T00:00:00Z",
  "sentAt": "2024-03-01T12:00:00Z"
}
```

---

## Example RACI State

**Initial (before acceptance)**:
```
Responsible: Wendell
Accountable: —
Consulted: —
Informed: Carolyn & Jim, Amanda, JJ, AJ, Valkyrie
```

**After acceptances**:
```
Responsible: Wendell
Accountable: Carolyn & Jim
Consulted: Amanda
Informed: AJ, Valkyrie
```

---

## Example Playbook Invitations Section

```
## Invitations

Carolyn & Jim — Stewards
Status: Accepted
Role: Accountable

Amanda — Event Architect
Status: Sent
RACI: Informed

JJ — Producer
Status: Accepted
Role: Consulted
```

---

## Example Export (Email Format)

```
Subject: Invitation to join Bruised Banana Residency Campaign

Hi Carolyn & Jim,

We'd love you to join as stewards for the Bruised Banana Residency. Your oversight would help ensure the campaign stays aligned with community values.

To accept: [link]

— Wendell
```
