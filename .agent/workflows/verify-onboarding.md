---
description: Manual verification steps for the onboarding flow and identity synchronization.
---

Follow these steps to ensure the onboarding narrative and quest persistence are functioning correctly.

### 1. Account Selection & Access
- Use the dev persona switcher to log in as **Admin (God Mode)**.
- Navigate to `/admin` and verify the GM Suite sidebar is accessible.
- Switch to **Verify Test** for the player flow.

### 2. Welcome Quest (The Dossier)
- Go to `/conclave/onboarding`.
- Traverse the "Welcome to the Conclave" story.
- **Verify**: On the passage titled **"The Job"** (which mentions the smudged ink and codename), the name input fields should appear **immediately**. 
- **Verify**: You no longer have to click "Onward" to see the inputs; they are integrated into the dossier invitation scene.
- **Success Check**: Enter a name and click **Submit & Continue**. Verify the "✨ Quest Completed!" message appears and you can click **Move to Next Step**.

### 3. Identity Matching
- Proceed to **Declare Your Nation**.
- **Important**: Even if the account already has a nation/archetype, you should **still see the full narrative** (The perimeter drone challenge).
- Reach the "Identity Match" passage and confirm your nation/archetype.

### 4. Persistence & Sticky Flow
- Try to navigate manually to `/` (Dashboard) while in the middle of a story.
- **Verify**: The site should automatically redirect you back to the active narrative step.
- Complete the entire orientation thread and verify you can finally access the full dashboard.

// turbo-all
