# Player's Handbook - Table of Contents

This directory contains all canonical narrative content for the Construct Conclave story game.

## Directory Structure

```
docs/handbook/
├── README.md                    # This file
├── world/                       # World-building and setting
│   ├── story_context.md         # Core world overview
│   ├── robot_oscars.md          # Event details
│   └── construct_technology.md  # How constructs work
├── nations/                     # The 5 nations
│   ├── argyra.md                # Metal nation
│   ├── pyrakanth.md             # Fire nation
│   ├── virelune.md              # Wood nation
│   ├── meridia.md               # Earth nation
│   └── lamenth.md               # Water nation
├── playbooks/                   # The 8 I Ching playbooks
│   ├── heaven.md
│   ├── earth.md
│   ├── thunder.md
│   ├── wind.md
│   ├── water.md
│   ├── fire.md
│   ├── mountain.md
│   └── lake.md
└── onboarding/                  # Guided mode story nodes
    ├── intro_nodes.md
    ├── nation_discovery.md
    └── playbook_discovery.md
```

## Usage

### For Development
- Reference these files when writing quests, dialogue, or UI text
- Keep story consistency by checking nation/playbook descriptions
- Update when new canonical information is established

### For Player Handbook PDF
- All content in this directory will be compiled into the final handbook
- Markdown format allows easy conversion to PDF
- Images and diagrams can be added to each section

## Content Guidelines

1. **Voice**: Comedic heist (Ocean's 11) + Hitchhiker's Guide wit
2. **Tone**: Playful, ironic, inviting
3. **Accessibility**: Welcoming to newcomers, rich for experienced players
4. **Consistency**: All content should align with `world/story_context.md`

## Maintenance

- Update nation/playbook files when database content changes
- Keep onboarding nodes in sync with actual story flow
- Version control ensures we can track canonical story evolution
