# Transformation Move Registry — Example Entries

Sample registry entries for Observe, Feel, and Experiment. These conform to the schema in [transformation-move-registry.md](../architecture/transformation-move-registry.md).

---

## Observe

```json
{
  "move_id": "observe",
  "move_name": "Observe",
  "move_category": "awareness",
  "wcgs_stage": "wake_up",
  "description": "Increase awareness of a pattern without judgment.",
  "purpose": "Surface implicit narrative so it can be examined.",
  "prompt_templates": [
    {
      "template_id": "observe_basic_01",
      "template_text": "What story are you telling yourself about {object}?",
      "template_type": "reflection"
    },
    {
      "template_id": "observe_basic_02",
      "template_text": "When you notice {state} around {object}, what pattern do you see?",
      "template_type": "reflection"
    },
    {
      "template_id": "observe_basic_03",
      "template_text": "What would {actor} observe if {actor} stepped back from this?",
      "template_type": "reflection"
    }
  ],
  "target_effect": "pattern_visibility",
  "typical_output_type": "reflection",
  "compatible_lock_types": ["identity_lock", "emotional_lock", "possibility_lock"],
  "compatible_emotion_channels": ["fear", "anger", "sadness", "neutrality", "joy"],
  "compatible_nations": [],
  "compatible_archetypes": [],
  "bar_integration": {
    "creates_bar": false,
    "optional_tracking_bar": true,
    "bar_timing": "pre_action",
    "bar_prompt_template": "Note what you're observing about {object}."
  },
  "quest_usage": {
    "quest_stage": "reflection",
    "is_required_for_full_arc": false,
    "can_stand_alone": true,
    "suggested_follow_up_moves": ["name", "externalize"]
  },
  "safety_notes": ["Low intensity. Safe for all contexts."]
}
```

---

## Feel

```json
{
  "move_id": "feel",
  "move_name": "Feel",
  "move_category": "emotional_processing",
  "wcgs_stage": "clean_up",
  "description": "Connect insight to embodied emotional awareness.",
  "purpose": "Ground cognitive work in somatic experience.",
  "prompt_templates": [
    {
      "template_id": "feel_basic_01",
      "template_text": "Where in your body do you feel {state} when you think about {object}?",
      "template_type": "somatic"
    },
    {
      "template_id": "feel_basic_02",
      "template_text": "What does {state} feel like in this moment—not the story, the sensation?",
      "template_type": "somatic"
    },
    {
      "template_id": "feel_channel_01",
      "template_text": "If {emotion_channel} had a shape or temperature, what would it be right now?",
      "template_type": "somatic"
    }
  ],
  "target_effect": "embodied_awareness",
  "typical_output_type": "somatic",
  "compatible_lock_types": ["emotional_lock", "identity_lock"],
  "compatible_emotion_channels": ["fear", "anger", "sadness", "neutrality", "joy"],
  "compatible_nations": [],
  "compatible_archetypes": [],
  "bar_integration": {
    "creates_bar": false,
    "optional_tracking_bar": false
  },
  "quest_usage": {
    "quest_stage": "cleanup",
    "is_required_for_full_arc": false,
    "can_stand_alone": false,
    "suggested_follow_up_moves": ["externalize", "reframe"]
  },
  "safety_notes": [
    "May surface intense emotion. Ensure player has choice to pause or skip.",
    "Works best after Observe or Name."
  ]
}
```

---

## Experiment

```json
{
  "move_id": "experiment",
  "move_name": "Experiment",
  "move_category": "behavioral_experiment",
  "wcgs_stage": "show_up",
  "description": "Create a small behavioral test.",
  "purpose": "Translate insight into real-world action.",
  "prompt_templates": [
    {
      "template_id": "experiment_basic_01",
      "template_text": "What is one small action where {object} is allowed?",
      "template_type": "action"
    },
    {
      "template_id": "experiment_basic_02",
      "template_text": "What could {actor} try in the next 72 hours that would test this?",
      "template_type": "action"
    },
    {
      "template_id": "experiment_basic_03",
      "template_text": "What's the smallest experiment you could run with {object}?",
      "template_type": "action"
    }
  ],
  "target_effect": "behavioral_activation",
  "typical_output_type": "action",
  "compatible_lock_types": ["action_lock", "possibility_lock", "identity_lock"],
  "compatible_emotion_channels": ["fear", "anger", "sadness", "neutrality", "joy"],
  "compatible_nations": [],
  "compatible_archetypes": [],
  "bar_integration": {
    "creates_bar": true,
    "bar_timing": "post_action",
    "bar_type": "insight",
    "bar_prompt_template": "What did you learn from trying {object}?"
  },
  "quest_usage": {
    "quest_stage": "action",
    "is_required_for_full_arc": false,
    "can_stand_alone": false,
    "suggested_follow_up_moves": ["integrate"]
  },
  "safety_notes": [
    "Action should be executable within 72 hours.",
    "Must reduce avoidance, not reinforce it."
  ]
}
```
