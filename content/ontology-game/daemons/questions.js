// The questions to ask each daemon, Wendell's own (project thread of 14 October 2026: "Updating ontology for the
// daemons. In the game master agents and in the games itself. Questions to ask each daemon/concerns for each daemon").
// Copied from wendell-britt/six-faces-council council/daemons/questions.yaml, where the sets live; change them there
// and copy them here. `words` is his exact wording; `ask` is the plain form a player reads.
//
// Every set shares one skeleton (`slot`): object (what it works on), boss (who it works for), method (how its work
// serves that boss) and stakes (what happens if it is not there). A question with `byBoss` asks a different follow-up
// for each boss the player names. The Protector's boss is the body's survival and the Player has none.
// Used by the Big Mind chambers (bigmind.js) and, from the perceptual shadow on, by the shadow spirit's questions.
(function (root) {
  var DAEMON_QUESTIONS = {
  "bosses": [
    "protector",
    "self",
    "controller",
    "player"
  ],
  "daemons": {
    "protector": [
      {
        "id": "what",
        "slot": "object",
        "ask": "Who or what are you protecting: the self, something, or someone?",
        "words": "who/what are you protecting? (The self/something/someone)"
      },
      {
        "id": "survive",
        "slot": "method",
        "ask": "How does protecting it keep the body alive?",
        "words": "how is protecting going to ensure your physical survival?"
      },
      {
        "id": "vulnerable",
        "slot": "vulnerable_to",
        "ask": "What is it vulnerable to? Which feeling, which element?",
        "words": "What is the thing you’re protecting vulnerable to? (Elemental energy/feeling)",
        "answersFrom": "elements"
      },
      {
        "id": "afraid",
        "slot": "stakes",
        "ask": "What are you afraid will happen if you don't protect it?",
        "words": "what are you afraid of will happen if you don’t protect it?"
      }
    ],
    "controller": [
      {
        "id": "what",
        "slot": "object",
        "ask": "What, or who, are you controlling?",
        "words": "what/who are you controlling?"
      },
      {
        "id": "boss",
        "slot": "boss",
        "ask": "Who do you work for: the Protector, the self, control itself, or the vulnerable child?",
        "words": "Who do you work for? (The protector? The self, the controller, the vulnerable child)"
      },
      {
        "id": "how",
        "slot": "method",
        "ask": "How are you doing the work of who you work for?",
        "words": "how are you doing the work of who you are working for?",
        "byBoss": {
          "protector": "How are you protecting the physical body by controlling?",
          "self": "What standards are you setting for the self?",
          "controller": "What standards are you setting about control itself?"
        }
      },
      {
        "id": "violated",
        "slot": "violated",
        "ask": "What happens if your standards are violated?",
        "words": "what happens if your standards are violated?"
      },
      {
        "id": "gone",
        "slot": "stakes",
        "ask": "What happens when you're not there?",
        "words": "What happens when you’re not there?"
      }
    ],
    "skeptic": [
      {
        "id": "what",
        "slot": "object",
        "ask": "What, or who, do you doubt?",
        "words": "what/who do you doubt?"
      },
      {
        "id": "boss",
        "slot": "boss",
        "ask": "Who do you work for?",
        "words": "Who do you work for?"
      },
      {
        "id": "how",
        "slot": "method",
        "ask": "How does doubt serve who you work for?",
        "words": "How does doubt serve who you work for?"
      },
      {
        "id": "gone",
        "slot": "stakes",
        "ask": "What happens when you're not there?",
        "words": "What happens when you’re not there?"
      }
    ],
    "fixer": [
      {
        "id": "what",
        "slot": "object",
        "ask": "What, or who, do you fix?",
        "words": "what/who do you fix?"
      },
      {
        "id": "boss",
        "slot": "boss",
        "ask": "Who do you work for?",
        "words": "Who do you work for?"
      },
      {
        "id": "how",
        "slot": "method",
        "ask": "How does fixing, repairing or holding in place, serve who you work for?",
        "words": "How does fixing (repairing or holding in place) serve who you work for?"
      },
      {
        "id": "gone",
        "slot": "stakes",
        "ask": "What would happen if you weren't there?",
        "words": "What would happen if you’re not there?"
      }
    ],
    "emotional-body": [
      {
        "id": "what",
        "slot": "object",
        "ask": "What do you feel?",
        "words": "what do you feel?"
      },
      {
        "id": "boss",
        "slot": "boss",
        "ask": "Who do you work for?",
        "words": "Who do you work for?"
      },
      {
        "id": "gone",
        "slot": "stakes",
        "ask": "What happens if you're not there?",
        "words": "What happens if you’re not there?"
      },
      {
        "id": "good-job",
        "slot": "measure",
        "ask": "How do you know you've done a good job?",
        "words": "How does do you know you’ve done a good job?"
      }
    ],
    "victim": [
      {
        "id": "what",
        "slot": "object",
        "ask": "What sympathetic stories do you tell?",
        "words": "what sympathetic stories do you tell?"
      },
      {
        "id": "boss",
        "slot": "boss",
        "ask": "Who do you work for?",
        "words": "Who do you work for?"
      },
      {
        "id": "advocate",
        "slot": "advocates_for",
        "ask": "Who do you advocate for?",
        "words": "Who do you advocate for?"
      },
      {
        "id": "payoff",
        "slot": "payoff",
        "ask": "What shadow sympathy does your advocacy get you?",
        "words": "What shadow sympathy does your advocacy get you?"
      },
      {
        "id": "gone",
        "slot": "stakes",
        "ask": "What happens if you're not there?",
        "words": "What happens if you’re not there?"
      }
    ],
    "damaged-self": [
      {
        "id": "what",
        "slot": "object",
        "ask": "What kind of damage do you take?",
        "words": "What kind of damage do you take?"
      },
      {
        "id": "from",
        "slot": "source",
        "ask": "From what, or from whom?",
        "words": "From what/who?"
      },
      {
        "id": "boss",
        "slot": "boss",
        "ask": "Who do you work for?",
        "words": "Who do you work for?"
      },
      {
        "id": "how",
        "slot": "method",
        "ask": "How does your job change depending on who you work for?",
        "words": "How does your job change depending on who you work for?"
      },
      {
        "id": "gone",
        "slot": "stakes",
        "ask": "What would happen if you weren't there?",
        "words": "What would happen if you weren’t there?"
      }
    ],
    "player": [
      {
        "id": "learning",
        "slot": "object",
        "ask": "What are you learning?",
        "words": "what are you learning?"
      },
      {
        "id": "growing",
        "slot": "growth",
        "ask": "How are you growing?",
        "words": "How are you growing?"
      },
      {
        "id": "feeling",
        "slot": "growth",
        "ask": "What are you feeling?",
        "words": "What are you feeling?"
      },
      {
        "id": "exploring",
        "slot": "growth",
        "ask": "What are you exploring?",
        "words": "What are you exploring?"
      },
      {
        "id": "in-the-way",
        "slot": "blocked_by",
        "ask": "How do the other daemons get in your way?",
        "words": "How does the other daemons get in your way?"
      },
      {
        "id": "gone",
        "slot": "stakes",
        "ask": "What would happen if you weren't there?",
        "words": "What would happen if you weren’t there?"
      }
    ]
  }
};
  if (typeof module !== "undefined" && module.exports) module.exports = DAEMON_QUESTIONS;
  if (root) root.__oagDaemonQuestions = DAEMON_QUESTIONS;
})(typeof window !== "undefined" ? window : null);
