        const React = window.React;
        const { useState } = React;

        // SITE BUILD (masteringallyship.com/ontology-game, 6 October 2026). The same
        // source still runs as the claude.ai artifact: window.__ontologySite is set only
        // by site-shim.js, which the site page loads before this script, so every
        // site-only branch below is inert in the artifact. Choices, not rulings:
        // the debug toggle and the claude.ai walkthrough links are hidden on the site
        // (a client lands here from a link Wendell sends), and ?debug=1 brings the
        // toggle back.
        const ON_SITE = typeof window !== "undefined" && !!window.__ontologySite;
        const SITE_PARAMS = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
        const SHOW_DEBUG = !ON_SITE || SITE_PARAMS.get("debug") === "1";
        // /ontology-game/wave (or ?practice=wave) makes W.A.V.E. the opening practice at
        // every body scan for the whole session, so a link can send a client straight
        // into practising WAVE inside the game instead of waiting on a one-in-six roll.
        // The path is checked as well as the query because the site serves /wave by
        // rewrite, and a rewrite never changes the URL the page itself sees.
        const LINKED_PRACTICE_ID = (SITE_PARAMS.get("practice") === "wave"
            || (typeof window !== "undefined" && /\/ontology-game\/wave\/?$/.test(window.location.pathname)))
            ? "wave" : null;

        // STEMS DATA
        const stems = {
            anger: {
                magenta: {
                    dissatisfied: "The presence I need is being cut off, and I can't reach who I love.",
                    neutral: "I feel the rupture clearly now, and I'm staying in the field instead of fleeing it.",
                    satisfied: "Presence blazes back open between us, and I move toward it, not against it."
                },
                red: {
                    dissatisfied: "I have power, and this obstacle is daring me not to use it.",
                    neutral: "I'm standing in the choice \u2014 fight this or let it be \u2014 and I haven't picked yet.",
                    satisfied: "I chose to move, and my force is doing exactly what I asked of it."
                },
                amber: {
                    dissatisfied: "This breaks a code I have sworn to uphold, and letting it stand makes me complicit.",
                    neutral: "I can see the violation plainly, and I haven't yet decided whether to enforce the old law or question it.",
                    satisfied: "The right order is restored, or I've rightly broken with the law that no longer deserves my loyalty."
                },
                orange: {
                    dissatisfied: "Something here doesn't add up, and my anger is the alarm going off before my mind catches up.",
                    neutral: "I'm tracing the gap in my model instead of arguing with the obstacle.",
                    satisfied: "I see the mechanism now, and the heat cools into a plan that actually works."
                },
                green: {
                    dissatisfied: "A voice that needs to be heard is being talked over, and my anger is the only language it has left.",
                    neutral: "I'm holding the silenced voice as real, even while the room keeps talking past it.",
                    satisfied: "The voice is in the room now, and the whole conversation is better for it."
                },
                teal: {
                    dissatisfied: "Something in the larger pattern is trying to move, and I'm the wall it's pushing against.",
                    neutral: "I can feel several levels of this at once, and I'm not collapsing it to just one story yet.",
                    satisfied: "I see how I fit into the larger unfolding, and I move with it instead of bracing against it."
                }
            },
            sadness: {
                magenta: {
                    dissatisfied: "Someone I'm bonded to has gone far away, and I feel the gap where their presence used to be.",
                    neutral: "I'm letting myself feel exactly how far away they are, without rushing to close it.",
                    satisfied: "The presence comes back into reach, and I'm with what I love again."
                },
                red: {
                    dissatisfied: "Something has cracked in how powerful I thought I was, and the loss is proving it.",
                    neutral: "I'm letting the crack show instead of covering it with a show of strength.",
                    satisfied: "I rebuild what's true about my power from what actually held, not from the image that broke."
                },
                amber: {
                    dissatisfied: "I'm falling out of step with the people and traditions I belong to, and I don't know how to get back in line.",
                    neutral: "I'm looking honestly at where I've drifted from the collective, without rushing to fix it.",
                    satisfied: "I've found my right relation to the group again, or I've knowingly chosen to stand apart from it."
                },
                orange: {
                    dissatisfied: "I don't actually know what I value here, and my life doesn't line up with any framework I can name.",
                    neutral: "I'm sitting with not knowing yet, instead of forcing an answer.",
                    satisfied: "My values come into focus, and what I do finally matches what I actually care about."
                },
                green: {
                    dissatisfied: "I care about this, and I can't tell if anyone else sees it the way I do.",
                    neutral: "I'm listening for how everyone else holds this, without needing my version to win.",
                    satisfied: "I feel seen in what I care about, and I can see how everyone else holds it too."
                },
                teal: {
                    dissatisfied: "I'm holding something precious, and I can't yet see how losing it serves anything at all.",
                    neutral: "I'm staying with the not-yet-seeing, instead of forcing the loss to mean something before it's ready.",
                    satisfied: "I see how this loss is teaching the whole system something it needed to learn."
                }
            },
            joy: {
                magenta: {
                    dissatisfied: "The aliveness between us has gone flat, and I can't find my way back to the mutual charge.",
                    neutral: "I'm noticing the dullness honestly, without performing brightness I don't feel.",
                    satisfied: "Aliveness floods back between us, and the boundary between me and what I love goes thin."
                },
                red: {
                    dissatisfied: "My own force feels dampened, like I'm not allowed to take up the room I actually need.",
                    neutral: "I'm letting the dampened feeling be real, without forcing myself back up.",
                    satisfied: "My force is live and animated again, and I feel my own capacity moving."
                },
                amber: {
                    dissatisfied: "Being this alive feels like it breaks a rule I'm supposed to keep, so I keep the lid on.",
                    neutral: "I'm looking at the rule itself, not just obeying it out of habit.",
                    satisfied: "I'm fully alive, and the order I answer to holds anyway \u2014 it was never actually against me."
                },
                orange: {
                    dissatisfied: "I can't feel alive because I don't understand what's blocking it, and the not-knowing is its own wall.",
                    neutral: "I'm tracing what's actually in the way, instead of pushing for aliveness I can't yet explain.",
                    satisfied: "I understand what lets me be fully alive, and now I know how to get back here on purpose."
                },
                green: {
                    dissatisfied: "Only part of me is welcome in this circle, and the rest of me waits outside the door.",
                    neutral: "I'm noticing exactly which parts are welcome and which aren't, without shrinking to fit.",
                    satisfied: "All of me is in the room now, seen and wanted, not just tolerated."
                },
                teal: {
                    dissatisfied: "Something in the larger pattern is dimming my aliveness on purpose, and I can feel it happening.",
                    neutral: "I'm tracking the pattern that's dimming me, instead of just pushing harder against it.",
                    satisfied: "I see exactly how my aliveness serves the larger pattern, and it stops feeling like a cost."
                }
            },
            fear: {
                magenta: {
                    dissatisfied: "I reached for connection and the field went cold, like presence itself just ruptured.",
                    neutral: "I'm staying with the cold instead of either fleeing it or forcing warmth back.",
                    satisfied: "The rupture holds without breaking me, and wonder opens up where the threat was."
                },
                red: {
                    dissatisfied: "I've hit something my force can't move, and underneath the anger is just being afraid.",
                    neutral: "I'm letting the powerlessness be real instead of converting it straight back into anger.",
                    satisfied: "I have the power to hold this boundary, even without needing to force anything through it."
                },
                amber: {
                    dissatisfied: "No one is holding this together, and I can feel the whole structure about to come apart.",
                    neutral: "I'm looking straight at the possibility of collapse instead of gripping the order tighter.",
                    satisfied: "The sacred boundary holds, and I'm not the only one holding it up."
                },
                orange: {
                    dissatisfied: "My model has a hole in the middle that no amount of precision can fill, and that terrifies me.",
                    neutral: "I'm letting the incompleteness stand instead of mapping harder to outrun it.",
                    satisfied: "I understand the limits of my own method, and that understanding is itself the ground I needed."
                },
                green: {
                    dissatisfied: "One voice is about to drown out the others, and the aliveness of this whole circle is at risk.",
                    neutral: "I'm watching where the imbalance is forming, without yet naming who's at fault.",
                    satisfied: "All the wisdom in the room is present and weighted rightly, and nothing had to be silenced to get there."
                },
                teal: {
                    dissatisfied: "The parts of this that refuse to integrate are terrifying me, like the system itself might be wrong.",
                    neutral: "I'm sitting with the parts that won't resolve, instead of forcing them into my picture of coherence.",
                    satisfied: "I see that what refuses to integrate was already whole, and my need to integrate it was the only thing missing."
                }
            },
            neutrality: {
                magenta: {
                    dissatisfied: "I'm alone in this and I can't feel the hum of belonging that's supposed to be under everything.",
                    neutral: "I'm resting here without either forcing connection or believing I'm cut off from it.",
                    satisfied: "I'm separate and held at the same time, and the ground has presence again."
                },
                red: {
                    dissatisfied: "Nothing I do seems to matter right now, and my power feels like it's gone quiet for no reason.",
                    neutral: "I'm letting my power rest without deciding it's disappeared.",
                    satisfied: "My force is still mine, held in reserve, ready for the next real thing without needing to prove it now."
                },
                amber: {
                    dissatisfied: "There's no structure holding this steady, and I don't know what I'm supposed to be keeping intact.",
                    neutral: "I'm asking what's actually still true across time, instead of assuming nothing is.",
                    satisfied: "I'm the ballast holding what's true, and I can trust that the order will carry what needs carrying."
                },
                orange: {
                    dissatisfied: "Nothing makes sense from here, and the ground isn't giving me any meaning to work with.",
                    neutral: "I'm watching without needing the meaning to resolve yet.",
                    satisfied: "I'm the mirror the system uses to see itself, and the detached view is its own kind of peace."
                },
                green: {
                    dissatisfied: "No voices are in the room right now, and the field feels empty instead of open.",
                    neutral: "I'm holding the empty space as a container, not a failure.",
                    satisfied: "I'm holding plural truths at once without collapsing any of them, and that container itself is alive."
                },
                teal: {
                    dissatisfied: "The system isn't learning anything right now, and I can't feel any pattern moving through this stillness.",
                    neutral: "I'm resting inside the not-yet-learning instead of forcing a lesson out of it.",
                    satisfied: "I see how the whole system is learning through exactly this, and the stillness turns out to be part of it."
                }
            }
        };

        // LEVEL 2 — "hold three stems at once." Distinct from Level 1's single canned
        // stem per (channel, face, state): here each cell holds THREE stems, each a
        // genuinely different facet of that face's belief at that state (not three
        // rewordings of the same sentence). The player doesn't pick a winner — they
        // notice which of the three are also true right now and hold as many as land.
        // Per the Multiplicity Correction (Sept 23, 2026), this is the ALTITUDE
        // dimension of multiplicity (multiple beliefs alive within one face-channel),
        // distinct from the CHANNEL dimension the Phase-multiplicity-check screens
        // already handle (multiple channels within one charge).
        //
        // Content status (Sept 25, 2026): ALL FIVE CHANNELS now fully written (270
        // stems, 5 channels x 6 faces x 3 states x 3 stems) — Anger and Sadness written
        // Sept 23, Joy/Fear/Neutrality added Sept 25 following the same confirmed
        // pattern: each cell's first stem is the exact Level-1 canonical stem for that
        // face/state, the other two are genuinely different facets of that same moment
        // (typically a deeper layer under the raw fact, then a stance/function facet
        // naming what the feeling has been doing or protecting) — not rewordings, not
        // alternate scenarios, not sequential try/discard attempts. Go Deeper still only
        // offers itself in Phase 6 when real content exists for the current face/state
        // (see hasLevel2Content), which is now unconditionally true everywhere.
        //
        // Block check (Sept 25, 2026): the old bare click-to-select toggle is replaced by
        // a per-stem clean/caught check (hold the stem with the intention to state what's
        // true right now, notice ease vs. friction) — see the "Block Check Mechanic —
        // Corrected Against Existing Code" section of the ontology-alchemy-game memory
        // file for the full confirmed spec. Any number 0-3 can come out clean; all clean
        // ones get added to heldBeliefs exactly as the old toggle's selections did.
        const stemsLevel2 = {
            anger: {
                magenta: {
                    dissatisfied: [
                        "The presence I need is being cut off, and I can't reach who I love.",
                        "Underneath the fury is a plain fact: I am reaching, and nothing is reaching back.",
                        "I refuse to accept that this gap is permanent, and the anger is what keeps me pushing against it."
                    ],
                    neutral: [
                        "I feel the rupture clearly now, and I'm staying in the field instead of fleeing it.",
                        "I'm not smoothing this over yet — the distance between us is real, and I'm letting it be real.",
                        "This anger has been guarding the door to how much I actually miss them."
                    ],
                    satisfied: [
                        "Presence blazes back open between us, and I move toward it, not against it.",
                        "I can feel them again, and the anger settles because the thing it was fighting for came back.",
                        "I know now: my anger was never against them, it was for the connection the whole time."
                    ]
                },
                red: {
                    dissatisfied: [
                        "I have power, and this obstacle is daring me not to use it.",
                        "I haven't decided yet whether to fight this, and the not-deciding is its own kind of rage.",
                        "Somewhere in me I already know force alone won't move this, and I'm furious that it's true."
                    ],
                    neutral: [
                        "I'm standing in the choice — fight this or let it be — and I haven't picked yet.",
                        "I can feel my own strength clearly right now, separate from whether I use it here.",
                        "I'm noticing which parts of this fight are actually mine to have."
                    ],
                    satisfied: [
                        "I chose to move, and my force is doing exactly what I asked of it.",
                        "My power is back in my own hands, whichever way I decided to use it.",
                        "I didn't have to prove anything — the choice itself was the strength."
                    ]
                },
                amber: {
                    dissatisfied: [
                        "This breaks a code I have sworn to uphold, and letting it stand makes me complicit.",
                        "Somebody has to hold the line here, and right now that somebody is me.",
                        "Part of this anger is aimed at a rule I'm not even sure I still believe in."
                    ],
                    neutral: [
                        "I can see the violation plainly, and I haven't yet decided whether to enforce the old law or question it.",
                        "I'm looking at what this code actually protects, not just at the fact that it was broken.",
                        "Holding the line and questioning the line can both be true right now."
                    ],
                    satisfied: [
                        "The right order is restored, or I've rightly broken with the law that no longer deserves my loyalty.",
                        "I know which code I'm actually defending now, and I stand behind it clean.",
                        "Whatever I decided, I'm no longer complicit — I did something instead of just carrying the weight."
                    ]
                },
                orange: {
                    dissatisfied: [
                        "Something here doesn't add up, and my anger is the alarm going off before my mind catches up.",
                        "There's a gap in my model and I can feel its exact shape even though I can't name it yet.",
                        "I'm angry at not knowing, more than I'm angry at whatever caused this."
                    ],
                    neutral: [
                        "I'm tracing the gap in my model instead of arguing with the obstacle.",
                        "I can feel the heat cooling the moment I stop demanding an answer and start actually looking.",
                        "Not knowing yet is different from never knowing, and I'm letting that difference matter."
                    ],
                    satisfied: [
                        "I see the mechanism now, and the heat cools into a plan that actually works.",
                        "The alarm did its job — it got me looking, and now I actually understand what happened.",
                        "My model finally matches what's real, and the anger has nothing left to signal."
                    ]
                },
                green: {
                    dissatisfied: [
                        "A voice that needs to be heard is being talked over, and my anger is the only language it has left.",
                        "I'm not just angry for myself — I'm angry on behalf of something true that nobody in the room will say.",
                        "This anger is the last resort of a perspective that's run out of gentler ways to ask to be seen."
                    ],
                    neutral: [
                        "I'm holding the silenced voice as real, even while the room keeps talking past it.",
                        "I don't need everyone to agree with this perspective yet — I just need to stop abandoning it myself.",
                        "I can feel how many other voices are also waiting their turn, not just this one."
                    ],
                    satisfied: [
                        "The voice is in the room now, and the whole conversation is better for it.",
                        "It got heard, and the anger doesn't have to keep shouting for it anymore.",
                        "I can see how the whole conversation needed exactly this perspective to actually be complete."
                    ]
                },
                teal: {
                    dissatisfied: [
                        "Something in the larger pattern is trying to move, and I'm the wall it's pushing against.",
                        "This anger isn't really about one thing — it's several levels of the same imbalance showing up at once.",
                        "I can feel the system trying to correct itself through me, whether I cooperate or not."
                    ],
                    neutral: [
                        "I can feel several levels of this at once, and I'm not collapsing it to just one story yet.",
                        "Red wants to fight it, Green wants it heard, Amber wants it corrected — and none of them is wrong.",
                        "I'm letting the pattern show me its own shape instead of forcing my read onto it."
                    ],
                    satisfied: [
                        "I see how I fit into the larger unfolding, and I move with it instead of bracing against it.",
                        "The system found its own balance, and I can feel every level of this settle at once, not just one.",
                        "I didn't have to choose which face of this anger was 'real' — they were all part of the same correction."
                    ]
                }
            },
            sadness: {
                magenta: {
                    dissatisfied: [
                        "Someone I'm bonded to has gone far away, and I feel the gap where their presence used to be.",
                        "I keep reaching toward where they used to be, and each time my hand closes on nothing.",
                        "The distance isn't just theirs — some part of me helped put it there, and that's the part that aches most."
                    ],
                    neutral: [
                        "I'm letting myself feel exactly how far away they are, without rushing to close it.",
                        "I can name the shape of the gap now — how wide it is, what's still living on the other side of it.",
                        "Not fixing it yet doesn't mean abandoning it — I'm staying in the field, just without grabbing."
                    ],
                    satisfied: [
                        "The presence comes back into reach, and I'm with what I love again.",
                        "The gap didn't have to close all at once — it closed the moment I stopped needing it to.",
                        "I can feel them even in the ordinary, unremarkable moments now, not just when I go looking."
                    ]
                },
                red: {
                    dissatisfied: [
                        "Something has cracked in how powerful I thought I was, and the loss is proving it.",
                        "I keep trying to flex the muscle that isn't there anymore, and the absence is its own kind of pain.",
                        "Underneath the crack is a harder question: was the strength ever really mine, or just something I was borrowing?"
                    ],
                    neutral: [
                        "I'm letting the crack show instead of covering it with a show of strength.",
                        "I'm taking stock of what actually still works, instead of pretending the whole structure held.",
                        "Not performing strength right now isn't weakness — it's just honesty about where I am."
                    ],
                    satisfied: [
                        "I rebuild what's true about my power from what actually held, not from the image that broke.",
                        "What's left is smaller than the myth was, and it's mine in a way the myth never was.",
                        "I don't need the old image back — I know exactly what I can actually move now, and that's enough."
                    ]
                },
                amber: {
                    dissatisfied: [
                        "I'm falling out of step with the people and traditions I belong to, and I don't know how to get back in line.",
                        "Every ritual I used to know by heart now feels like it belongs to someone else's life.",
                        "Part of me is grieving the belonging, and part of me is quietly relieved to be out of step — and I can't tell which part is louder."
                    ],
                    neutral: [
                        "I'm looking honestly at where I've drifted from the collective, without rushing to fix it.",
                        "I'm tracing exactly where the drift started, instead of just feeling generally lost.",
                        "Staying out of step for now doesn't mean staying out forever — I just don't know the answer yet."
                    ],
                    satisfied: [
                        "I've found my right relation to the group again, or I've knowingly chosen to stand apart from it.",
                        "Either way, it's a choice now, not a drift — and that's the difference that actually matters.",
                        "I can hold the tradition with respect even in the ways I've grown past it."
                    ]
                },
                orange: {
                    dissatisfied: [
                        "I don't actually know what I value here, and my life doesn't line up with any framework I can name.",
                        "I keep reaching for a model that would explain this, and coming up with nothing that fits.",
                        "The mismatch between what I do and what I'd say I believe is the actual source of the ache, not any one event."
                    ],
                    neutral: [
                        "I'm sitting with not knowing yet, instead of forcing an answer.",
                        "I'm collecting the pieces of what I actually value, even before they add up to a framework.",
                        "Not having the answer today is different from never getting one — I'm letting that difference hold me."
                    ],
                    satisfied: [
                        "My values come into focus, and what I do finally matches what I actually care about.",
                        "The framework isn't perfect, but it's mine, and it's built from what actually held up under pressure.",
                        "I can explain now, to myself at least, why I do what I do — and the explanation is true, not convenient."
                    ]
                },
                green: {
                    dissatisfied: [
                        "I care about this, and I can't tell if anyone else sees it the way I do.",
                        "I keep looking for a flicker of recognition in other people's faces, and mostly finding my own reflection back.",
                        "Maybe no one else needs to see it exactly the way I do — but I still need to know I'm not the only one who sees it at all."
                    ],
                    neutral: [
                        "I'm listening for how everyone else holds this, without needing my version to win.",
                        "I'm noticing how many different, legitimate ways there are to care about the same thing.",
                        "Not being mirrored perfectly doesn't mean I'm alone in this — it might just mean the room is more varied than I expected."
                    ],
                    satisfied: [
                        "I feel seen in what I care about, and I can see how everyone else holds it too.",
                        "My version didn't have to win for me to feel met — it just had to be heard alongside the others.",
                        "The whole picture is richer with everyone's version in it than mine ever was alone."
                    ]
                },
                teal: {
                    dissatisfied: [
                        "I'm holding something precious, and I can't yet see how losing it serves anything at all.",
                        "The loss feels senseless from here, and that senselessness is its own weight on top of the loss itself.",
                        "I want the larger pattern to justify this to me right now, and it's staying silent, which makes the grief feel unwitnessed."
                    ],
                    neutral: [
                        "I'm staying with the not-yet-seeing, instead of forcing the loss to mean something before it's ready.",
                        "I'm resisting the urge to manufacture a lesson just so the grief has somewhere to go.",
                        "Meaning might come later, or it might come in a shape I can't predict from here — I'm leaving room for either."
                    ],
                    satisfied: [
                        "I see how this loss is teaching the whole system something it needed to learn.",
                        "The precious thing is gone, and what it opened up in me is not — both of those are true at once.",
                        "I can hold this as a real loss AND as part of something larger learning through me, without either one canceling the other out."
                    ]
                }
            },
            joy: {
                magenta: {
                    dissatisfied: [
                        "The aliveness between us has gone flat, and I can't find my way back to the mutual charge.",
                        "Underneath the flatness is a plain fact: I'm still reaching for them, even though nothing is sparking back.",
                        "Part of me went quiet on purpose, to protect against how much it would hurt if the charge never returned."
                    ],
                    neutral: [
                        "I'm noticing the dullness honestly, without performing brightness I don't feel.",
                        "I haven't given up on the charge coming back — I'm just refusing to fake it in the meantime.",
                        "This flatness has been guarding me from performing a joy I don't actually have yet."
                    ],
                    satisfied: [
                        "Aliveness floods back between us, and the boundary between me and what I love goes thin.",
                        "I can feel them again, and the flatness lifts because the thing it was waiting for actually came back.",
                        "I know now: the dullness was never really about them — it was me bracing before I let myself feel this much."
                    ]
                },
                red: {
                    dissatisfied: [
                        "My own force feels dampened, like I'm not allowed to take up the room I actually need.",
                        "Underneath the dampening is a plain fact: I'm holding myself smaller than I actually am right now.",
                        "Some part of me dampened my own force on purpose, to avoid whatever happens when I take up full room."
                    ],
                    neutral: [
                        "I'm letting the dampened feeling be real, without forcing myself back up.",
                        "I haven't decided the room isn't mine — I'm just not grabbing for it before I'm ready.",
                        "This dampening has been protecting me from a size of my own force I haven't tested yet."
                    ],
                    satisfied: [
                        "My force is live and animated again, and I feel my own capacity moving.",
                        "I can feel my own size again, and the dampening lifts because I finally let it move.",
                        "I know now: the dampening was never about not having force — it was about not yet trusting I could hold it."
                    ]
                },
                amber: {
                    dissatisfied: [
                        "Being this alive feels like it breaks a rule I'm supposed to keep, so I keep the lid on.",
                        "Underneath the lid is a plain fact: some part of me still believes aliveness this size isn't allowed.",
                        "Keeping the lid on has been protecting my place in the order, at the cost of my own aliveness."
                    ],
                    neutral: [
                        "I'm looking at the rule itself, not just obeying it out of habit.",
                        "I haven't broken with the rule yet — I'm just finally asking what it was actually protecting.",
                        "This lid has been guarding my belonging more than it's been guarding anything real."
                    ],
                    satisfied: [
                        "I'm fully alive, and the order I answer to holds anyway — it was never actually against me.",
                        "I can feel the order still holding, and the lid comes off because it turns out I never needed it.",
                        "I know now: the rule was never against my aliveness — my fear of breaking it was."
                    ]
                },
                orange: {
                    dissatisfied: [
                        "I can't feel alive because I don't understand what's blocking it, and the not-knowing is its own wall.",
                        "Underneath the confusion is a plain fact: there's a specific mechanism here I haven't found yet.",
                        "Not understanding has been its own kind of protection — I can't be disappointed by a cause I haven't named."
                    ],
                    neutral: [
                        "I'm tracing what's actually in the way, instead of pushing for aliveness I can't yet explain.",
                        "I haven't found the mechanism yet — I'm just done pretending the not-knowing isn't there.",
                        "This confusion has been guarding me from a cause I might not like once I actually see it."
                    ],
                    satisfied: [
                        "I understand what lets me be fully alive, and now I know how to get back here on purpose.",
                        "I can see the mechanism now, and the wall comes down because the not-knowing is finally gone.",
                        "I know now: the block was never aliveness itself — it was just an unmapped cause I couldn't yet see."
                    ]
                },
                green: {
                    dissatisfied: [
                        "Only part of me is welcome in this circle, and the rest of me waits outside the door.",
                        "Underneath the exclusion is a plain fact: I already know exactly which parts of me got left outside.",
                        "Keeping part of myself outside has been protecting the parts that did get let in from also being rejected."
                    ],
                    neutral: [
                        "I'm noticing exactly which parts are welcome and which aren't, without shrinking to fit.",
                        "I haven't brought the excluded part back in yet — I'm just refusing to pretend it isn't there.",
                        "This exclusion has been guarding me from finding out the whole circle can't actually hold all of me."
                    ],
                    satisfied: [
                        "All of me is in the room now, seen and wanted, not just tolerated.",
                        "I can feel every part of me welcome at once, and the waiting-outside ends because there's nothing left excluded.",
                        "I know now: the circle was never too small — I was the one deciding which parts of me got to try."
                    ]
                },
                teal: {
                    dissatisfied: [
                        "Something in the larger pattern is dimming my aliveness on purpose, and I can feel it happening.",
                        "Underneath the dimming is a plain fact: several levels of this system are all pulling my aliveness down at once.",
                        "This dimming has been protecting the larger pattern from an aliveness it isn't ready to hold yet."
                    ],
                    neutral: [
                        "I'm tracking the pattern that's dimming me, instead of just pushing harder against it.",
                        "I haven't stopped the dimming yet — I'm just done mistaking it for something wrong with me personally.",
                        "This dimming has been guarding the system's own pace, whether or not that pace actually serves me."
                    ],
                    satisfied: [
                        "I see exactly how my aliveness serves the larger pattern, and it stops feeling like a cost.",
                        "I can feel every level of the system settle around this at once, and the dimming lifts because it's no longer needed.",
                        "I know now: the dimming was never against me — it was the system pacing itself until it was ready for this much aliveness."
                    ]
                }
            },
            fear: {
                magenta: {
                    dissatisfied: [
                        "I reached for connection and the field went cold, like presence itself just ruptured.",
                        "Underneath the cold is a plain fact: I'm still reaching, even though nothing is answering back yet.",
                        "This cold has been protecting me from finding out whether the rupture is actually permanent."
                    ],
                    neutral: [
                        "I'm staying with the cold instead of either fleeing it or forcing warmth back.",
                        "I haven't decided the field is closed for good — I'm just not warming it by force.",
                        "This cold has been guarding me from a wonder I can't feel yet because I'm still bracing."
                    ],
                    satisfied: [
                        "The rupture holds without breaking me, and wonder opens up where the threat was.",
                        "I can feel the field again, and the cold lifts because I finally stopped needing it to prove something first.",
                        "I know now: the cold was never the end of presence — it was presence waiting for me to stop fleeing it."
                    ]
                },
                red: {
                    dissatisfied: [
                        "I've hit something my force can't move, and underneath the anger is just being afraid.",
                        "Underneath the fear is a plain fact: my strength has a real edge, and I just found it.",
                        "The anger has been protecting me from feeling how afraid I actually am underneath it."
                    ],
                    neutral: [
                        "I'm letting the powerlessness be real instead of converting it straight back into anger.",
                        "I haven't given up on my own strength — I'm just not forcing it past its actual edge.",
                        "This powerlessness has been guarding me from a boundary I needed to find honestly, not by force."
                    ],
                    satisfied: [
                        "I have the power to hold this boundary, even without needing to force anything through it.",
                        "I can feel my own edge clearly now, and the fear lifts because I don't need to push past it anymore.",
                        "I know now: the fear was never about weakness — it was about finally respecting where my force actually ends."
                    ]
                },
                amber: {
                    dissatisfied: [
                        "No one is holding this together, and I can feel the whole structure about to come apart.",
                        "Underneath the panic is a plain fact: I've been carrying more of this structure alone than I realized.",
                        "This fear of collapse has been protecting me from finding out I can't hold everything up by myself."
                    ],
                    neutral: [
                        "I'm looking straight at the possibility of collapse instead of gripping the order tighter.",
                        "I haven't decided it's actually falling apart — I'm just done gripping it out of pure fear.",
                        "This gripping has been guarding the structure more out of my own fear than out of what it actually needs."
                    ],
                    satisfied: [
                        "The sacred boundary holds, and I'm not the only one holding it up.",
                        "I can feel other hands on this structure now, and the fear lifts because I'm not carrying it alone.",
                        "I know now: the fear was never that the structure was weak — it was that I forgot I wasn't the only one holding it."
                    ]
                },
                orange: {
                    dissatisfied: [
                        "My model has a hole in the middle that no amount of precision can fill, and that terrifies me.",
                        "Underneath the terror is a plain fact: some part of reality genuinely won't fit into any model I build.",
                        "This terror has been protecting my need to have a complete answer, more than it's protecting me."
                    ],
                    neutral: [
                        "I'm letting the incompleteness stand instead of mapping harder to outrun it.",
                        "I haven't filled the hole — I'm just done pretending more precision will ever fill it.",
                        "This terror has been guarding an old belief that understanding has to be complete to be trustworthy."
                    ],
                    satisfied: [
                        "I understand the limits of my own method, and that understanding is itself the ground I needed.",
                        "I can feel the hole stop threatening me, and the terror lifts because I stopped needing it filled.",
                        "I know now: the terror was never about the hole — it was about believing an incomplete model couldn't hold me."
                    ]
                },
                green: {
                    dissatisfied: [
                        "One voice is about to drown out the others, and the aliveness of this whole circle is at risk.",
                        "Underneath the alarm is a plain fact: I already know exactly which voices are about to go quiet.",
                        "This fear has been protecting the circle's balance, even before I consciously noticed it tipping."
                    ],
                    neutral: [
                        "I'm watching where the imbalance is forming, without yet naming who's at fault.",
                        "I haven't stepped in yet — I'm just staying close enough to the imbalance to actually see its shape.",
                        "This watching has been guarding every voice's turn, not just the ones already loud enough to be heard."
                    ],
                    satisfied: [
                        "All the wisdom in the room is present and weighted rightly, and nothing had to be silenced to get there.",
                        "I can feel every voice holding its own weight now, and the alarm lifts because nothing is actually drowning.",
                        "I know now: the fear was never that one voice was too loud — it was that the others hadn't found their weight yet."
                    ]
                },
                teal: {
                    dissatisfied: [
                        "The parts of this that refuse to integrate are terrifying me, like the system itself might be wrong.",
                        "Underneath the terror is a plain fact: some of this genuinely isn't ready to resolve into one picture yet.",
                        "This terror has been protecting my need for the whole system to already make sense, more than protecting the system itself."
                    ],
                    neutral: [
                        "I'm sitting with the parts that won't resolve, instead of forcing them into my picture of coherence.",
                        "I haven't decided the system is broken — I'm just done demanding it cohere before it's ready to.",
                        "This terror has been guarding an old belief that unintegrated parts mean something has failed."
                    ],
                    satisfied: [
                        "I see that what refuses to integrate was already whole, and my need to integrate it was the only thing missing.",
                        "I can feel every unresolved part settle into its own wholeness, and the terror lifts because nothing needed fixing.",
                        "I know now: the terror was never that the system was wrong — it was that I mistook not-yet-integrated for broken."
                    ]
                }
            },
            neutrality: {
                magenta: {
                    dissatisfied: [
                        "I'm alone in this and I can't feel the hum of belonging that's supposed to be under everything.",
                        "Underneath the aloneness is a plain fact: the hum hasn't disappeared, I've just lost contact with it for now.",
                        "This aloneness has been protecting me from leaning on a belonging I'm not yet sure will hold my weight."
                    ],
                    neutral: [
                        "I'm resting here without either forcing connection or believing I'm cut off from it.",
                        "I haven't found the hum again — I'm just not deciding it's gone for good either.",
                        "This resting has been guarding me from grabbing at belonging before it's actually ready to hold me."
                    ],
                    satisfied: [
                        "I'm separate and held at the same time, and the ground has presence again.",
                        "I can feel the hum return underneath me, and the aloneness lifts because I stopped needing to chase it.",
                        "I know now: the aloneness was never proof the ground was gone — it was just me not yet resting into it."
                    ]
                },
                red: {
                    dissatisfied: [
                        "Nothing I do seems to matter right now, and my power feels like it's gone quiet for no reason.",
                        "Underneath the quiet is a plain fact: my power is resting, not gone — there's a real difference.",
                        "This quiet has been protecting my force from being spent on something that wasn't actually ready for it."
                    ],
                    neutral: [
                        "I'm letting my power rest without deciding it's disappeared.",
                        "I haven't found the next real thing yet — I'm just not spending force just to prove I still have it.",
                        "This resting has been guarding my power for whatever actually deserves it next."
                    ],
                    satisfied: [
                        "My force is still mine, held in reserve, ready for the next real thing without needing to prove it now.",
                        "I can feel my power still intact underneath the quiet, and the doubt lifts because nothing was ever missing.",
                        "I know now: the quiet was never my power disappearing — it was my power simply not being needed yet."
                    ]
                },
                amber: {
                    dissatisfied: [
                        "There's no structure holding this steady, and I don't know what I'm supposed to be keeping intact.",
                        "Underneath the disorientation is a plain fact: something is still true here, even without a visible structure holding it.",
                        "This disorientation has been protecting me from committing to hold up a structure before I know it's real."
                    ],
                    neutral: [
                        "I'm asking what's actually still true across time, instead of assuming nothing is.",
                        "I haven't found the structure yet — I'm just done assuming its absence means nothing is stable.",
                        "This asking has been guarding my loyalty for whatever turns out to actually deserve it."
                    ],
                    satisfied: [
                        "I'm the ballast holding what's true, and I can trust that the order will carry what needs carrying.",
                        "I can feel what's actually stable underneath everything, and the disorientation lifts because the ground was always there.",
                        "I know now: the missing structure was never really missing — I just hadn't found where I was already the ballast."
                    ]
                },
                orange: {
                    dissatisfied: [
                        "Nothing makes sense from here, and the ground isn't giving me any meaning to work with.",
                        "Underneath the blankness is a plain fact: meaning hasn't arrived yet, and that's different from meaning not existing.",
                        "This blankness has been protecting me from forcing a meaning onto something that isn't ready to mean anything yet."
                    ],
                    neutral: [
                        "I'm watching without needing the meaning to resolve yet.",
                        "I haven't found the meaning yet — I'm just done demanding the ground hand it over on schedule.",
                        "This watching has been guarding the actual meaning from being replaced by one I forced too early."
                    ],
                    satisfied: [
                        "I'm the mirror the system uses to see itself, and the detached view is its own kind of peace.",
                        "I can feel the meaning settle on its own timing, and the blankness lifts because I stopped forcing it.",
                        "I know now: the blankness was never absence of meaning — it was meaning waiting for me to stop reaching for it."
                    ]
                },
                green: {
                    dissatisfied: [
                        "No voices are in the room right now, and the field feels empty instead of open.",
                        "Underneath the emptiness is a plain fact: the room is quiet, not closed — there's a real difference.",
                        "This emptiness has been protecting the room's openness from being filled before the right voices actually arrive."
                    ],
                    neutral: [
                        "I'm holding the empty space as a container, not a failure.",
                        "I haven't filled the room yet — I'm just done treating the quiet as proof nothing will ever come.",
                        "This holding has been guarding room for voices that haven't found their way in yet."
                    ],
                    satisfied: [
                        "I'm holding plural truths at once without collapsing any of them, and that container itself is alive.",
                        "I can feel the room fill on its own, and the emptiness lifts because it was never actually closed.",
                        "I know now: the emptiness was never a failure of the room — it was the room staying open long enough to actually be ready."
                    ]
                },
                teal: {
                    dissatisfied: [
                        "The system isn't learning anything right now, and I can't feel any pattern moving through this stillness.",
                        "Underneath the stillness is a plain fact: not-learning is still a state the system is in, not an absence of one.",
                        "This stillness has been protecting the system from a lesson it isn't ready to metabolize yet."
                    ],
                    neutral: [
                        "I'm resting inside the not-yet-learning instead of forcing a lesson out of it.",
                        "I haven't found the pattern yet — I'm just done treating the stillness as proof nothing is happening.",
                        "This resting has been guarding whatever lesson is actually forming underneath, before I could name it too soon."
                    ],
                    satisfied: [
                        "I see how the whole system is learning through exactly this, and the stillness turns out to be part of it.",
                        "I can feel the pattern moving through the stillness itself, and the confusion lifts because the lesson was already underway.",
                        "I know now: the stillness was never the absence of learning — it was the shape the learning was taking before I could see it."
                    ]
                }
            }
        };

        const channels = [
            { name: "Anger", element: "Fire", color: "fire" },
            { name: "Sadness", element: "Water", color: "water" },
            { name: "Joy", element: "Wood", color: "wood" },
            { name: "Fear", element: "Metal", color: "metal" },
            { name: "Neutrality", element: "Earth", color: "earth" }
        ];

        const faces = [
            { name: "Magenta", description: "Knows through presence and relational field" },
            { name: "Red", description: "Knows through power, force, capacity" },
            { name: "Amber", description: "Knows through order, law, tradition, duty" },
            { name: "Orange", description: "Knows through understanding, clarity, coherence" },
            { name: "Green", description: "Knows through perspectives, voices, integration" },
            { name: "Teal", description: "Knows through systems, how everything learns" }
        ];

        const precisionQuestions = {
            magenta: "Where is the presence you're reaching for?",
            red: "What power are you trying to move or assert?",
            amber: "What rule or tradition is this about?",
            orange: "What understanding or clarity are you looking for?",
            green: "What perspectives or voices are involved?",
            teal: "How is the system trying to learn through this?"
        };

        const shengCycle = {
            "Joy": "Anger",
            "Anger": "Neutrality",
            "Neutrality": "Fear",
            "Fear": "Sadness",
            "Sadness": "Joy"
        };

        const keCycle = {
            "Joy": "Neutrality",
            "Anger": "Fear",
            "Neutrality": "Sadness",
            "Fear": "Joy",
            "Sadness": "Anger"
        };

        // OPENING PRACTICES — a d6 table of somatic-opening rituals rolled fresh every
        // time the game needs a body-scan (Phase 1, and again at each Flow Forward /
        // Tempering hop). Every practice, however different its ritual, resolves to the
        // SAME underlying contract — a location string and a texture value from the
        // fixed set (constriction/numbness/tension/strength/other) — so nothing
        // downstream (stems, routing, tests) needs to know or care which practice ran.
        // Each practice's blurb comes in two variants (6-Faces design review, Sept 26
        // 2026, on WAVE's flow-locate mismatch): "first" for Phase 1's genuine
        // unknown -- something is here, we don't yet know what -- and "continuation"
        // for phase-flow-locate, where the player already knows exactly what charge
        // they're checking for (the one that just resolved in the previous channel).
        // Applied to all six practices, not just WAVE, since all six get reused at
        // flow-locate the same way. The steps/mechanics of every practice are
        // unchanged; only this framing line differs.
        const openingPractices = [
            { id: "breaths", name: "Simple Breaths", kind: "breaths",
              blurb: {
                  first: "Three slow breaths, then notice where the block sits.",
                  continuation: "Three slow breaths, then notice: is the thing you've been working showing up here too?"
              } },
            { id: "happy-apple", name: "Happy Apple", kind: "happy-apple",
              blurb: {
                  first: "Name something you want. Feel the wanting fully. Set it down in an imagined bag.",
                  continuation: "Name something you want, unrelated to the charge you've been working. Feel the wanting fully, then set it down — hands empty now, is that charge still here?"
              } },
            { id: "wave", name: "W.A.V.E.", kind: "wave",
              blurb: {
                  first: "Each step takes one breath. Welcome it. Acknowledge it, Allow it, Accept it and Appreciate it, as far up as you can honestly go. Validate your body's right to feel it. Exhale: let it stay if it serves you, or release it and see what's left. If something gets in the way of a step, you can work that first and come back.",
                  continuation: "Each step takes one breath. Welcome it back, if it's here. Acknowledge it, Allow it, Accept it and Appreciate it, as far up as you can honestly go. Validate your body's right to still feel this. Exhale: let it stay if it's still here, or release it and see what's left.",
                  block: "Each step takes one breath, and this time you breathe with whatever got in the way. Welcome it, climb as far as you honestly can, validate it, and exhale. If something blocks this too, you can work that first."
              } },
            { id: "grounding", name: "5-4-3-2-1 Grounding", kind: "grounding",
              blurb: {
                  first: "Name what your senses find right now, then see where attention has landed.",
                  continuation: "Name what your senses find right now, then check whether attention has landed back on the charge you've been working."
              } },
            { id: "pendulation", name: "Pendulation", kind: "pendulation",
              blurb: {
                  first: "Find the activation, then find a place that feels more okay. Feel the difference.",
                  continuation: "Find the activation — the same one as before, if it's here — then find a place that feels more okay. Feel the difference."
              } },
            { id: "weather", name: "Body Weather Report", kind: "weather",
              blurb: {
                  first: "If your body had a weather report right now, what would it say?",
                  continuation: "If your body had a weather report on the charge you've been working, right now, what would it say?"
              } }
        ];

        // Mode A persistence (Cross-Session Persistence Spec, Sept 24 2026 — Wendell:
        // "build Mode A now"). This is the ONLY place the game talks to platform storage,
        // and every call through it is guarded: window.claude only exists when this page
        // is served as a real claude.ai artifact view with db+user granted (per claude.d.ts,
        // a chat-embedded copy or a locally-saved file never gets a window.claude.use at
        // all — indistinguishable from "not granted" by design). Every existing Playwright
        // regression test loads the plain HTML over a local server, so window.claude is
        // undefined there by construction — this whole layer must no-op silently in that
        // case, and the felt-sense loop must be byte-identical either way. Resolved once
        // per page load (memoized), not once per call.
        let persistencePromise = null;
        const getPersistence = () => {
            if (persistencePromise) return persistencePromise;
            persistencePromise = (async () => {
                if (typeof window === "undefined" || !window.claude || typeof window.claude.use !== "function") return null;
                try {
                    const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
                    if (!db || !user) return null;
                    const uid = await user.id();
                    if (!uid) return null;
                    // Path grammar (db capability): data/users/<uid>/profile is 4 segments,
                    // even, a DOCUMENT — the natural anchor for this viewer's rollup summary.
                    // Individual cycles live in a subcollection off that document
                    // (.../profile/cycles, 5 segments, odd — a collection), each cycle its
                    // own doc six segments down. Per the db capability's own privacy rule,
                    // this whole data/users/<uid>/ subtree is private to this viewer, even
                    // from the artifact's owner.
                    return { db, uid, profileRef: db.doc(`data/users/${uid}/profile`) };
                } catch (e) {
                    return null;
                }
            })();
            return persistencePromise;
        };

        // Mode B (opt-in coach visibility, Cross-Session Persistence Spec — Wendell,
        // Sept 24 2026: in-game toggle per cycle, explicit approval every cycle,
        // build a minimal coach view). A coach reading a shared summary is NOT the
        // artifact's viewer whose private data/users/<id>/ subtree this concerns —
        // they're reading a SHARED path (data/coach-shared/...), so this only ever
        // needs db, never user. Kept as its own memoized resolver rather than folded
        // into getPersistence() above, because a coach opening this view has no
        // reason to have (or want) their own uid resolved at all.
        let dbOnlyPromise = null;
        const getDb = () => {
            if (dbOnlyPromise) return dbOnlyPromise;
            dbOnlyPromise = (async () => {
                if (typeof window === "undefined" || !window.claude || typeof window.claude.use !== "function") return null;
                try {
                    return await window.claude.use("db");
                } catch (e) {
                    return null;
                }
            })();
            return dbOnlyPromise;
        };

        // Portable coach code (site build only). On the site, storage is the player's
        // own browser (site-shim.js), so a coach on another device cannot read
        // data/coach-shared/ the way the artifact's shared db allows. Instead the
        // player gets a code that carries the shared summary itself: the same
        // belief-free fields Mode B already writes (counts, archetype, and the ten most
        // recent cycles' date/channel/face/archetype). The coach pastes it into the same
        // coach view. Nothing is sent anywhere; the player decides where the code goes.
        const PORTABLE_CODE_PREFIX = "OAG1.";
        const encodePortableCoachCode = (summary, cycles) => {
            const payload = {
                s: {
                    totalCycles: summary.totalCycles || 0,
                    faceCounts: summary.faceCounts || {},
                    channelCounts: summary.channelCounts || {},
                },
                c: (cycles || []).slice(0, 10).map(c => [c.completedAt, c.channel, c.face, c.archetype]),
            };
            const bytes = new TextEncoder().encode(JSON.stringify(payload));
            let bin = "";
            bytes.forEach(b => { bin += String.fromCharCode(b); });
            return PORTABLE_CODE_PREFIX + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        };
        const decodePortableCoachCode = (code) => {
            if (!code || !code.startsWith(PORTABLE_CODE_PREFIX)) return null;
            try {
                const b64 = code.slice(PORTABLE_CODE_PREFIX.length).replace(/-/g, "+").replace(/_/g, "/");
                const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
                const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
                const payload = JSON.parse(new TextDecoder().decode(bytes));
                if (!payload || !payload.s) return null;
                return {
                    summary: payload.s,
                    cycles: (payload.c || []).map(([completedAt, channel, face, archetype]) => ({ completedAt, channel, face, archetype })),
                };
            } catch (e) {
                return null;
            }
        };

        // Archetype classifier — a deliberately simplified, faithful port of the
        // rule-based session-shape classifier from classify_archetypes.py (validated
        // against the 20-run random-walk study, Simulated Playtesting doc, Sept 23 2026).
        // Same priority-ordered rules, same category names and thresholds, first match
        // wins. One disclosed simplification: the original's "pace" used the random-walk
        // harness's own fine-grained action log, which doesn't exist in real play; here
        // it's approximated by a per-session move counter (see moveCountRef below), which
        // undercounts slightly against the harness's log. Good enough to separate a fast
        // session from a slow one; not claimed to reproduce the study's exact numbers.
        const classifyArchetype = (f) => {
            if (f.resolved === 0) return "The Ghost";
            if (f.deadEnds >= 2 && f.resolved <= 1) return "The Wanderer";
            if (f.divergentCharges >= 1) return "The Multiplier";
            if (f.goDeepers >= 2 && f.channelsTouched <= 2) return "The Excavator";
            if (f.defers >= 3) return "The Deferrer";
            if (f.pace <= 12 && f.resolved >= 2) return "The Quick Alchemist";
            if (f.channelsTouched >= 4) return "The Wide Net";
            return "The Steady Walker";
        };

        // The most-picked key of a counts map ({Amber: 3, Red: 1, ...} -> "Amber"), for
        // the "welcome back" reflection. Null on an empty/missing map.
        const topOf = (counts) => {
            if (!counts) return null;
            const entries = Object.entries(counts);
            if (entries.length === 0) return null;
            return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
        };

        // V2 UI Spec (Sept 26 2026) — the Wuxing Wheel and Open Threads Ledger's merge
        // logic, kept as pure, side-effect-free functions at module scope (same reason
        // classifyArchetype lives here rather than inside the component) so the exact
        // merge behavior is directly testable without touching real persistence. Both
        // take "prior" (whatever this viewer's saved profile already had, or
        // undefined/null for a first write) and this cycle's own resolvedThreads/
        // deferredThreads, and return the next value to persist — never mutating prior.
        //
        // channelsSatisfied is a monotonic set: once a channel has landed a `satisfied`
        // resolution, it stays lit forever, even if a later cycle never revisits it.
        const mergeChannelsSatisfied = (prior, resolvedThreadsThisCycle) => {
            const next = { ...(prior || {}) };
            (resolvedThreadsThisCycle || []).forEach((t) => {
                if (t.endState === "satisfied") next[t.channel] = true;
            });
            return next;
        };

        // openThreads is the honest Loss/Avoidance ledger: a (channel, face) pairing is
        // added when it's still sitting in deferredThreads at the moment a cycle
        // completes (named, never resumed), and removed only when that exact pairing
        // later lands a real `satisfied` resolution — never on a timer, never just for
        // being old. Keyed on "channel|face" since that's how a named thread's identity
        // already works everywhere else in this file (branch/recheck targets).
        const mergeOpenThreads = (prior, resolvedThreadsThisCycle, deferredThreadsThisCycle) => {
            const closedKeys = new Set(
                (resolvedThreadsThisCycle || [])
                    .filter((t) => t.endState === "satisfied")
                    .map((t) => `${t.channel}|${t.face}`)
            );
            const kept = (prior || []).filter((t) => !closedKeys.has(`${t.channel}|${t.face}`));
            const existingKeys = new Set(kept.map((t) => `${t.channel}|${t.face}`));
            const additions = (deferredThreadsThisCycle || [])
                .filter((t) => !existingKeys.has(`${t.channel}|${t.face}`))
                .map((t) => ({ channel: t.channel, face: t.face, createdAt: Date.now() }));
            return [...kept, ...additions];
        };

        // Exposed for tests only, same pattern as window.__forcePracticeId /
        // window.__gameState — lets the regression suite assert the merge logic
        // directly (add/remove/never-regress) instead of driving a full cycle through
        // real (mocked) persistence just to check arithmetic.
        if (typeof window !== "undefined") {
            window.__mergeChannelsSatisfied = mergeChannelsSatisfied;
            window.__mergeOpenThreads = mergeOpenThreads;
        }

        // Element hex values, reused from the .fire/.water/.wood/.metal/.earth CSS
        // classes above (those set `color`; the wheel needs the same values as JS
        // strings to color each node's dot and glow).
        const ELEMENT_HEX = { fire: "#ff6b6b", water: "#4ecdc4", wood: "#95e1d3", metal: "#b0bec5", earth: "#d4a574" };

        // The Wuxing Wheel (V2 UI Spec, Development & Accomplishment / Ownership):
        // one node per channel, dim until channelsSatisfied[channel] is true, then lit
        // permanently in that channel's own element color. `compact` is the smaller
        // Phase 6 placement; the entry-screen placement omits it.
        //
        // V2 UI Spec 2 (Epic Meaning) adds two optional props: `activeChannel` (the
        // channel the player just moved FROM) and `transitionKind` ("sheng" | "ke").
        // When both are set, the target node (shengCycle/keCycle[activeChannel] — the
        // SAME values that already drive phase-flow-locate's "flows into"/"restrains"
        // copy) gets highlighted and a one-line caption names the direction. Omit
        // either prop and the wheel renders exactly as it did before this addition.
        const WuxingWheel = ({ channelsSatisfied, compact, activeChannel, transitionKind }) => {
            const targetChannel = activeChannel && transitionKind === "sheng"
                ? shengCycle[activeChannel]
                : activeChannel && transitionKind === "ke"
                ? keCycle[activeChannel]
                : null;
            return (
                <div className={`wuxing-wheel-wrap${compact ? " compact" : ""}`}>
                    <div className={`wuxing-wheel${compact ? " compact" : ""}`}>
                        {channels.map((ch) => {
                            const lit = !!(channelsSatisfied && channelsSatisfied[ch.name]);
                            const hex = ELEMENT_HEX[ch.color];
                            const isActive = ch.name === activeChannel;
                            const isTarget = !!targetChannel && ch.name === targetChannel;
                            const nodeClass = `wuxing-node${lit ? " lit" : ""}${isActive ? " active" : ""}${isTarget ? ` target-${transitionKind}` : ""}`;
                            return (
                                <div key={ch.name} className={nodeClass} title={`${ch.name} (${ch.element})`}>
                                    <div className="wuxing-dot" style={lit ? { background: hex, color: hex } : undefined} />
                                    <small>{ch.name}</small>
                                </div>
                            );
                        })}
                    </div>
                    {targetChannel && (
                        <p className="wuxing-transition-note">
                            {activeChannel}{" "}
                            <span className={`wuxing-arrow wuxing-arrow--${transitionKind}`}>
                                {transitionKind === "sheng" ? "generates →" : "restrains ⊣"}
                            </span>{" "}
                            {targetChannel}
                        </p>
                    )}
                </div>
            );
        };

        // Texture Glyphs (V2 UI Spec 2, Empowerment & Feedback) — a real visual echo
        // of the `texture` the player already named (constriction/numbness/tension/
        // strength/other), instead of only a sentence. Pure and derived from state
        // that already exists (`texture`, `shifted`); no new game state, no
        // persistence change. `opened` is a plain boolean render prop — its CSS
        // keyframe plays automatically on mount, so passing opened={true} on a
        // freshly-mounted screen is enough to animate it, no timer needed here.
        const TEXTURE_GLYPH_SHAPES = {
            constriction: <path d="M24 8 C15 8, 9 15, 9 24 C9 32, 16 38, 24 38 C30 38, 34 34, 34 29 C34 25, 31 22, 27 22 C24 22, 22 24, 22 27" />,
            numbness: <circle cx="24" cy="24" r="13" />,
            tension: <path d="M8 30 L16 16 L22 28 L30 12 L40 24" />,
            strength: <polygon points="24,7 38,15 38,31 24,39 10,31 10,15" />,
            other: <rect x="10" y="10" width="28" height="28" rx="6" />
        };

        const TextureGlyph = ({ texture, opened, size }) => {
            const key = texture && TEXTURE_GLYPH_SHAPES[texture] ? texture : "other";
            return (
                <svg
                    className={`texture-glyph texture-glyph--${key}${opened ? " opened" : ""}`}
                    width={size || 48}
                    height={size || 48}
                    viewBox="0 0 48 48"
                    data-texture={key}
                    data-opened={opened ? "true" : "false"}
                >
                    {TEXTURE_GLYPH_SHAPES[key]}
                </svg>
            );
        };

        // W.A.V.E., breathed (council pass, 6 October 2026: bars-engine
        // content/ontology-game/6FACE_PASS1_2026-10-06.md). Wendell's note of that day:
        // "The practice is designed that one is supposed to breathe through all the
        // steps." Each step below is one guided breath (oag-wave-breath), the A is the
        // four-rung ladder he named (Acknowledge, Allow, Accept, Appreciate;
        // oag-wave-ladder), and every step can be blocked (oag-wave-blocks).
        //
        // Choice, labelled as one: the book defines WAVE as Welcome, Acknowledge,
        // Validate, Exhale (Mastering the Game of Allyship, Appendix C). The game uses his
        // four-rung A from the note above. The book is untouched (oag-book-untouched).
        const WAVE_STEPS = [
            { id: "welcome", label: "Welcome", button: "I've welcomed it",
              prompt: "Let whatever's here be here for a moment, without needing it to be different yet.",
              promptContinuation: "Let whatever's here be here for a moment, the same charge you've been working if it's still showing up, without needing it to be different yet.",
              promptBlock: "Let what's in the way be here for a moment, without needing it to move yet." },
            { id: "acknowledge", label: "Acknowledge", rung: true, button: "I acknowledge it",
              prompt: "Admit that it's here. You don't have to like it." },
            { id: "allow", label: "Allow", rung: true, button: "I allow it",
              prompt: "Let it take up as much of you as it's taking. You don't have to make it smaller." },
            { id: "accept", label: "Accept", rung: true, button: "I accept it",
              prompt: "Let it be here without fighting it." },
            { id: "appreciate", label: "Appreciate", rung: true, button: "I appreciate it",
              prompt: "Find what it's been trying to do for you." },
            { id: "validate", label: "Validate", button: "I validate that",
              prompt: "Your body has the right to feel this, whatever it is." },
            { id: "exhale", label: "Exhale",
              prompt: "Is this feeling in alignment with what you actually want right now?" },
        ];
        const WAVE_STEP_LABEL = WAVE_STEPS.reduce((acc, s) => ({ ...acc, [s.id]: s.label }), {});
        const nextWaveStep = (id) => {
            const i = WAVE_STEPS.findIndex(s => s.id === id);
            return i >= 0 && i < WAVE_STEPS.length - 1 ? WAVE_STEPS[i + 1].id : null;
        };

        // How big a block is (oag-block-size, council pass 2). The 1 to 10 scale and the
        // picture words are the council's placeholders, not a sourced instrument. The slider
        // starts unset and records a size only when the player moves it (the Challenger's
        // point: a default left in place would answer for the player).
        const SIZE_WORDS = ["a pebble", "a pebble", "a stone", "a stone", "a rock", "a rock", "a boulder", "a boulder", "a wall", "a wall"];
        const sizeWord = (n) => (n >= 1 && n <= 10 ? SIZE_WORDS[n - 1] : "");
        const SizeSlider = ({ value, onChange, dataKey }) => (
            <div className={`size-slider${value == null ? " size-slider--unset" : ""}`}>
                <input type="range" min="1" max="10" step="1" value={value == null ? 5 : value}
                       data-size-slider={dataKey}
                       aria-label="How big it is, from 1 to 10"
                       onChange={(e) => onChange(Number(e.target.value))}
                       onClick={(e) => onChange(Number(e.target.value))} />
                <div className="size-slider-ends"><span>1, small</span><span>10, it fills everything</span></div>
                <p className="size-slider-value" data-size-value={value == null ? "" : value}>
                    {value == null ? "Not set. Slide it if a size comes to you." : `${value}: about the size of ${sizeWord(value)}`}
                </p>
            </div>
        );

        // Plain words for a texture, used where the game names the trailhead back to the
        // player ("tightness in my throat").
        const TEXTURE_WORDS = { constriction: "tightness", numbness: "numbness", tension: "tension", strength: "strength", other: "something" };
        const describeCharge = (c) => {
            if (!c || !c.location) return c && c.channel ? c.channel : "";
            const what = `${TEXTURE_WORDS[c.texture] || "something"} in ${c.location}`;
            return c.channel ? `${what} (${c.channel})` : what;
        };

        // The faces for a newcomer (oag-faces-primer; the labels are open board question
        // oag-faces-names, built on its recommended option A). Display only: every key,
        // the demo, the coach code and the saved summary keep the colour names.
        const FACE_PLAIN = { Magenta: "Presence", Red: "Power", Amber: "Order", Orange: "Understanding", Green: "Perspectives", Teal: "Systems" };
        const faceLabel = (name) => (FACE_PLAIN[name] ? `${FACE_PLAIN[name]}, ${name}` : name);

        // One guided breath: four seconds in, six out. Both numbers are the council's
        // placeholders (oag-wave-breath), not a sourced figure. The step's continue button
        // shows when the exhale ends. window.__breathScale is a test-only speed-up, the
        // same pattern as window.__forcePracticeId; real play never sets it.
        const BREATH_IN_MS = 4000;
        const BREATH_OUT_MS = 6000;
        const BreathPacer = ({ children }) => {
            const scale = (typeof window !== "undefined" && window.__breathScale) || 1;
            const [stage, setStage] = useState("ready"); // "ready" | "in" | "out" | "done"
            React.useEffect(() => {
                const t0 = setTimeout(() => setStage("in"), 30);
                const t1 = setTimeout(() => setStage("out"), 30 + BREATH_IN_MS * scale);
                const t2 = setTimeout(() => setStage("done"), 30 + (BREATH_IN_MS + BREATH_OUT_MS) * scale);
                return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
            }, []);
            return (
                <div className="breath-pacer" data-breath={stage}>
                    <div className={`breath-circle breath-circle--${stage}`}
                         style={{ transitionDuration: `${(stage === "in" ? BREATH_IN_MS : BREATH_OUT_MS) * scale}ms` }} />
                    <p className="breath-label">{stage === "out" ? "Breathe out" : stage === "done" ? "One breath" : "Breathe in"}</p>
                    {stage === "done" && children}
                </div>
            );
        };

        // The route map (oag-map-output). Drawn from the route log the game keeps (see
        // logRoute in the component): one numbered stop per thread worked, solid arrows
        // for Flow Forward, dashed for Tempering, a barred stub for a dead end, a dotted
        // ring for a thread set aside, a double ring for Go Deeper, and a small loop for
        // each block worked inside W.A.V.E. The belief text is drawn here and in the
        // saved image only and never stored (oag-map-private).
        //
        // Layout choice: the five nodes sit on a pentagon in generating (sheng) order,
        // Joy at the top and clockwise, so every Flow Forward arrow runs around the rim
        // and every Tempering arrow crosses the middle, as in the usual wuxing drawing.
        const MAP_ORDER = ["Joy", "Anger", "Neutrality", "Fear", "Sadness"];
        const MAP_W = 340, MAP_H = 300, MAP_CX = 170, MAP_CY = 150, MAP_R = 104, NODE_R = 20;
        const STATE_WORDS = { dissatisfied: "still aching", neutral: "workable", satisfied: "resolved" };
        const mapNodePos = (name) => {
            const i = MAP_ORDER.indexOf(name);
            const a = (-90 + i * 72) * Math.PI / 180;
            return { x: MAP_CX + MAP_R * Math.cos(a), y: MAP_CY + MAP_R * Math.sin(a), ux: Math.cos(a), uy: Math.sin(a) };
        };
        const channelOf = (name) => channels.find(c => c.name === name);

        // Turns the route log into the ordered stops and moves the map and its list share.
        const summarizeRoute = (route) => {
            const stops = [];
            const moves = [];
            const deferred = new Set();
            const deeper = new Set();
            const blocks = [];
            route.forEach((e) => {
                if (e.kind === "stop") stops.push({ ...e });
                else if (e.kind === "move" || e.kind === "deadend") moves.push({ ...e, afterStop: stops.length });
                else if (e.kind === "defer") deferred.add(e.channel);
                else if (e.kind === "deeper") {
                    deeper.add(e.channel);
                    const last = [...stops].reverse().find(s => s.channel === e.channel);
                    if (last) last.deeper = true;
                }
                else if (e.kind === "block-open") blocks.push(e);
            });
            stops.forEach(s => deferred.delete(s.channel));
            return { stops, moves, deferred: [...deferred], deeper: [...deeper], blocks };
        };

        const wrapText = (text, max) => {
            const words = String(text || "").split(/\s+/).filter(Boolean);
            const lines = [];
            let line = "";
            words.forEach((w) => {
                if ((line + " " + w).trim().length > max) { if (line) lines.push(line); line = w; }
                else line = (line + " " + w).trim();
            });
            if (line) lines.push(line);
            return lines;
        };

        const RouteMap = ({ route, belief, svgRef, trailhead }) => {
            const { stops, moves, deferred, deeper, blocks } = summarizeRoute(route);
            const beliefLines = belief ? wrapText(`“${belief}”`, 46) : [];
            // Where the trip began (oag-trailhead), drawn under the belief. Like the belief,
            // it lives only on screen and in the saved image.
            const startLines = trailhead ? wrapText(describeCharge(trailhead) + (trailhead.words ? `, “${trailhead.words}”` : ""), 50) : [];
            const beliefH = beliefLines.length ? 24 + beliefLines.length * 17 : 0;
            const startY = MAP_H + beliefH + (startLines.length ? 8 : 0);
            const height = MAP_H + beliefH + (startLines.length ? 26 + startLines.length * 16 : 0);
            const answerWord = { shifted: "it has shifted", same: "it's the same", different: "something else is there now" };
            const pairCount = {};
            const edge = (m, idx) => {
                const a = mapNodePos(m.from);
                const b = mapNodePos(m.to);
                if (!a || !b || m.from === m.to) return null;
                const pairKey = `${m.from}>${m.to}`;
                const k = pairCount[pairKey] = (pairCount[pairKey] || 0) + 1;
                const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
                const ux = dx / len, uy = dy / len;
                const sx = a.x + ux * (NODE_R + 3), sy = a.y + uy * (NODE_R + 3);
                if (m.kind === "deadend") {
                    const ex = a.x + ux * (len * 0.42), ey = a.y + uy * (len * 0.42);
                    return (
                        <g key={`m${idx}`} data-map-move="deadend" data-from={m.from} data-to={m.to}>
                            <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#cfd8dc" strokeWidth="2" strokeDasharray={m.type === "ke" ? "5 4" : undefined} />
                            <line x1={ex - uy * 7} y1={ey + ux * 7} x2={ex + uy * 7} y2={ey - ux * 7} stroke="#cfd8dc" strokeWidth="2.5" />
                        </g>
                    );
                }
                const ex = b.x - ux * (NODE_R + 6), ey = b.y - uy * (NODE_R + 6);
                const bend = 14 * k;
                const qx = (sx + ex) / 2 - uy * bend, qy = (sy + ey) / 2 + ux * bend;
                return (
                    <path key={`m${idx}`} data-map-move={m.type} data-from={m.from} data-to={m.to}
                          d={`M${sx.toFixed(1)},${sy.toFixed(1)} Q${qx.toFixed(1)},${qy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`}
                          fill="none" stroke="#e8eef2" strokeWidth="2.2"
                          strokeDasharray={m.type === "ke" ? "6 5" : undefined} markerEnd="url(#oag-arrow)" />
                );
            };
            const badgeCount = {};
            return (
                <svg ref={svgRef} className="route-map" xmlns="http://www.w3.org/2000/svg"
                     viewBox={`0 0 ${MAP_W} ${height}`} width="100%" role="img"
                     aria-label="Map of the channels you moved through this cycle" data-map-stops={stops.map(s => s.channel).join(",")}>
                    <defs>
                        <marker id="oag-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                            <path d="M0,0 L10,5 L0,10 z" fill="#e8eef2" />
                        </marker>
                    </defs>
                    <rect x="0" y="0" width={MAP_W} height={height} rx="14" fill="#18203a" />
                    {MAP_ORDER.map((name) => {
                        const p = mapNodePos(name);
                        const ch = channelOf(name);
                        const hex = ELEMENT_HEX[ch.color];
                        const visited = stops.some(s => s.channel === name);
                        return (
                            <g key={name} data-map-node={name}>
                                {deeper.includes(name) && <circle cx={p.x} cy={p.y} r={NODE_R + 7} fill="none" stroke={hex} strokeWidth="1.5" data-map-deeper={name} />}
                                {deferred.includes(name) && <circle cx={p.x} cy={p.y} r={NODE_R + 5} fill="none" stroke={hex} strokeWidth="1.5" strokeDasharray="2 3" data-map-deferred={name} />}
                                <circle cx={p.x} cy={p.y} r={NODE_R} fill={visited ? hex : "none"} fillOpacity={visited ? 0.85 : 1} stroke={hex} strokeWidth="2" strokeOpacity={visited ? 1 : 0.45} />
                                <text x={p.x + p.ux * (NODE_R + 30)} y={p.y + p.uy * (NODE_R + 22) + 4} textAnchor="middle" fontSize="12" fontFamily="sans-serif" fill={visited ? "#ffffff" : "#8a93a6"}>{name}</text>
                            </g>
                        );
                    })}
                    {moves.map(edge)}
                    {stops.map((s, i) => {
                        const p = mapNodePos(s.channel);
                        const n = badgeCount[s.channel] = (badgeCount[s.channel] || 0) + 1;
                        const off = (n - 1) * 15;
                        return (
                            <g key={`s${i}`} data-map-stop={i + 1} data-channel={s.channel}>
                                <circle cx={p.x - 1 + off} cy={p.y} r="9" fill="#18203a" stroke={s.passive ? "#8a93a6" : "#ffffff"} strokeWidth="1.2" />
                                <text x={p.x - 1 + off} y={p.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="sans-serif" fill="#ffffff">{i + 1}</text>
                            </g>
                        );
                    })}
                    {blocks.map((b, i) => {
                        const p = b.channel ? mapNodePos(b.channel) : { x: MAP_CX, y: MAP_CY, ux: 0, uy: 1 };
                        const angle = Math.atan2(p.uy, p.ux) + (i % 3 - 1) * 0.5;
                        const d = b.channel ? NODE_R + 11 : 8 + i * 4;
                        const lx = p.x + Math.cos(angle) * d, ly = p.y + Math.sin(angle) * d;
                        return <circle key={`b${i}`} cx={lx} cy={ly} r={b.depth > 1 ? 4 : 6} fill="none" stroke="#ffd166" strokeWidth="1.6" data-map-block={b.step} />;
                    })}
                    {trailhead && trailhead.channel && mapNodePos(trailhead.channel) && (() => {
                        const p = mapNodePos(trailhead.channel);
                        const fx = p.x - NODE_R - 4, fy = p.y - NODE_R - 2;
                        return (
                            <g data-map-trailhead={trailhead.answer || "open"}>
                                <line x1={fx} y1={fy} x2={fx} y2={fy - 20} stroke="#ffffff" strokeWidth="1.5" />
                                <path d={`M${fx},${fy - 20} L${fx + 13},${fy - 15} L${fx},${fy - 10} z`} fill={trailhead.answer === "shifted" ? "#7bd88f" : "#ffffff"} />
                            </g>
                        );
                    })()}
                    {startLines.length > 0 && (
                        <g data-map-start>
                            <text x={MAP_CX} y={startY + 6} textAnchor="middle" fontSize="11" fontFamily="sans-serif" fill="#8a93a6">
                                {trailhead.answer ? `Where you started, and on the way back ${answerWord[trailhead.answer]}` : "Where you started"}
                            </text>
                            {startLines.map((l, i) => (
                                <text key={i} x={MAP_CX} y={startY + 23 + i * 16} textAnchor="middle" fontSize="12" fontFamily="sans-serif" fill="#e8eef2">{l}</text>
                            ))}
                        </g>
                    )}
                    {beliefLines.length > 0 && (
                        <g>
                            <text x={MAP_CX} y={MAP_H + 6} textAnchor="middle" fontSize="11" fontFamily="sans-serif" fill="#8a93a6">What you held</text>
                            {beliefLines.map((l, i) => (
                                <text key={i} x={MAP_CX} y={MAP_H + 24 + i * 17} textAnchor="middle" fontSize="13" fontStyle="italic" fontFamily="Georgia, serif" fill="#ffffff">{l}</text>
                            ))}
                        </g>
                    )}
                </svg>
            );
        };

        // The same route in words, under the map, so it reads without the legend.
        const RouteList = ({ route }) => {
            const { stops, moves, blocks } = summarizeRoute(route);
            const moveWord = { sheng: "Flowed forward to", ke: "Tempered toward" };
            // Blocks and appreciations in the player's words (oag-block-carry,
            // oag-appreciate-input), listed after the stops. On screen only, never stored.
            const returns = route.filter(e => e.kind === "block-return");
            const notes = route.filter(e => e.kind === "block-open" || e.kind === "appreciate").map((e) => {
                if (e.kind === "appreciate") return { kind: "appreciate", text: `You appreciated: “${e.text}”.` };
                const back = returns.find(r => r.openId === e.id) || {};
                const label = WAVE_STEP_LABEL[e.step] || e.step;
                const sizes = e.size != null && back.sizeAfter != null ? ` Its size went from ${e.size} to ${back.sizeAfter}.`
                    : e.size != null ? ` Its size was ${e.size}.` : back.sizeAfter != null ? ` Its size afterwards was ${back.sizeAfter}.` : "";
                return { kind: "block", text: `${label} was blocked${e.words ? ` by “${e.words}”` : ""}.${sizes}` };
            });
            return (
                <>
                <ol className="route-list" data-route-list>
                    {stops.map((s, i) => {
                        const after = moves.filter(m => m.afterStop === i + 1);
                        const blocksHere = blocks.filter(b => b.channel === s.channel);
                        return (
                            <li key={i} data-route-stop={s.channel}>
                                <strong>{s.channel}</strong> ({faceLabel(s.face)}): {s.passive ? "moved on its own" : STATE_WORDS[s.endState] || "worked"}.
                                {s.deeper && " You went deeper here."}
                                {blocksHere.length > 0 && ` ${blocksHere.length} block${blocksHere.length === 1 ? "" : "s"} worked inside W.A.V.E.`}
                                {after.map((m, j) => (
                                    <span key={j} className="route-move" data-route-move={m.kind === "deadend" ? "deadend" : m.type}>
                                        {" "}{m.kind === "deadend" ? `Looked for it in ${m.to}; nothing was there.` : `${moveWord[m.type]} ${m.to}.`}
                                    </span>
                                ))}
                            </li>
                        );
                    })}
                </ol>
                {notes.length > 0 && (
                    <ul className="route-notes" data-route-notes>
                        {notes.map((n, i) => <li key={i} data-route-note={n.kind}>{n.text}</li>)}
                    </ul>
                )}
                </>
            );
        };

        // DEMO MODE — a single scripted walk through the whole game, added so a new
        // player (or Wendell showing this to someone) can see how the process solves a
        // live problem before ever touching their own data. Every step highlights the
        // REAL button on the REAL screen (no separate mock UI) and clicking it fires
        // the real handler exactly as normal play would; the only functional change
        // demo mode makes anywhere in the app is skipping the Mode A persistence write
        // in handleCompleteCycle, so a demo run never pollutes a real player's saved
        // pattern summary.
        //
        // Each step's `key` matches a static `data-demo-key="..."` attribute already
        // sitting on one existing element in the render tree (added as a plain,
        // unconditional prop — it does nothing during normal play). The demo overlay
        // finds that element by key, pulses it, dims everything else on the card, and
        // shows the step's narration in a fixed banner. A step with `prefill` writes
        // location/texture directly before the player reaches it, since body-scan
        // fields start empty and this walk isn't asking anyone to type.
        //
        // The path: primary charge in Anger/Amber -> Tempering Wisdom to Fear/Orange
        // (Anger restrains Fear) -> name-and-defer a second thread in Joy/Green ->
        // Flow Forward to Sadness/Teal (the generative cycle) -> check back on the
        // deferred Joy thread twice (once still there, once resolved on its own) ->
        // Go Deeper on Joy/Green (hold three stems, two clean/one caught) -> complete
        // the cycle. Every channel the wuxing moves land on is touched exactly once by
        // those moves, so nothing doubles back on itself mid-walk.
        const DEMO_SCRIPT = [
            { key: "begin-practice", title: "Welcome", narration: "Hey — I'll walk alongside you here, real buttons only, none of it touching your own data. Let's begin." },
            { key: "phase1-this-is-it", prefill: { location: "my chest", texture: "tension" }, title: "Locate the block", narration: "You'd scan your own body here. Chest / tension is filled in for now — click “This is it.”" },
            { key: "channel-Anger", title: "Name the channel", narration: "Let's pick Anger." },
            { key: "face-Amber", title: "Find your face", narration: "Six faces, six ways of knowing a block. We'll go with Amber." },
            { key: "phase4-yes", title: "Try the belief on", narration: "Here's a candidate belief for Anger / Amber. Accept it as true for now." },
            { key: "phase5-ready", title: "Hold it", narration: "Hold the belief and notice what happens in the body." },
            { key: "open-choice-breaths", title: "Pick an opening technique", narration: "Three ways to open into this. Simple Breaths is quickest." },
            { key: "open-active-breaths-done", title: "Breathe", narration: "Three slow breaths, then continue." },
            { key: "phase5-result-yes", title: "Notice what shifted", narration: "Something moved — that's the belief doing its work." },
            { key: "state-confirm-neutral", title: "Where did it land?", narration: "Workable, not fully resolved — pick “neutral.” This routes what's next." },
            { key: "mult-yes-name", title: "Is it anywhere else?", narration: "This charge can live in more than one channel at once. Let's name a second one." },
            { key: "branch-channel-Joy", title: "Name the other channel", narration: "We'll say it's also alive in Joy." },
            { key: "face-Green", title: "Find its face there", narration: "Joy has its own faces too. Let's pick Green." },
            { key: "branch-defer", title: "Work it now, or set it aside?", narration: "You don't have to work every thread the moment you name it — set this one aside." },
            { key: "mult-no-thats-all", title: "Anywhere else?", narration: "That's enough named for now." },
            { key: "phase6-tempering", title: "Choose your next move", narration: "Tempering Wisdom → Fear, the channel Anger restrains. The rule: Tempering never advances a charge — it holds, or pulls it back toward dissatisfied." },
            { key: "flow-locate-this-is-it", prefill: { location: "my jaw", texture: "constriction" }, title: "Check for a live charge", narration: "Jaw / constriction is filled in — click “This is it.”" },
            { key: "face-Orange", title: "Find your face in Fear", narration: "Let's go with Orange this time." },
            { key: "phase4-yes", title: "Try the belief on", narration: "Accept the belief for Fear / Orange." },
            { key: "phase5-ready", title: "Hold it", narration: "Hold it and notice, same as before." },
            { key: "open-choice-breaths", title: "Open into it", narration: "Simple Breaths again." },
            { key: "open-active-breaths-done", title: "Breathe", narration: "Three breaths, then continue." },
            { key: "phase5-result-yes", title: "Notice what shifted", narration: "Something moved here too." },
            { key: "state-confirm-neutral", title: "Where did it land?", narration: "Neutral again — workable, not resolved." },
            { key: "recheck-no-still-there", title: "Checking back on Joy", narration: "The game checks back on threads you set aside. Nothing's moved on Joy yet." },
            { key: "recheck-choice-defer", title: "Work it now, or set it aside again?", narration: "Still set it aside — we're not done with the main thread." },
            { key: "mult-no-thats-all", title: "Anywhere else?", narration: "Move on from here." },
            { key: "phase6-flow-forward", title: "Choose your next move", narration: "Flow Forward → Sadness, the generative cycle. The rule: Flow Forward always nudges a charge one rung closer to satisfied." },
            { key: "flow-locate-this-is-it", prefill: { location: "my throat", texture: "numbness" }, title: "Check for a live charge", narration: "Throat / numbness is filled in — click “This is it.”" },
            { key: "face-Teal", title: "Find your face in Sadness", narration: "We'll go with Teal here." },
            { key: "phase4-yes", title: "Try the belief on", narration: "Accept the belief for Sadness / Teal." },
            { key: "phase5-ready", title: "Hold it", narration: "Hold and notice." },
            { key: "open-choice-breaths", title: "Open into it", narration: "Simple Breaths, once more." },
            { key: "open-active-breaths-done", title: "Breathe", narration: "Three breaths, then continue." },
            { key: "phase5-result-yes", title: "Notice what shifted", narration: "Something moved." },
            { key: "state-confirm-satisfied", title: "Where did it land?", narration: "This one feels resolved — pick “satisfied.”" },
            { key: "recheck-yes-moved", title: "Checking back on Joy", narration: "Say the Joy thread moved too — a passive resolution, no extra work needed." },
            { key: "mult-no-thats-all", title: "Anywhere else?", narration: "Everything's accounted for now." },
            { key: "phase6-go-deeper", title: "Choose your next move", narration: "Go deeper in place instead of moving channels — hold three stems on Joy / Green at once." },
            { key: "deeper-clean-0", title: "Hold the first stem", narration: "Hold it, notice: clean, or does something catch? This one's clean." },
            { key: "deeper-clean-1", title: "Hold the second stem", narration: "This one's clean too." },
            { key: "deeper-caught-2", title: "Hold the third stem", narration: "This one catches — that's real information too, not a wrong answer." },
            { key: "deeper-continue", title: "Continue holding", narration: "Only the clean ones get held forward." },
            { key: "deeper-sit-ready", title: "Hold all of it", narration: "Don't collapse them yet — just hold what's true." },
            { key: "open-choice-breaths", title: "Open into it", narration: "Simple Breaths." },
            { key: "open-active-breaths-done", title: "Breathe", narration: "Three breaths, then continue." },
            { key: "deeper-result-yes", title: "Notice what shifted", narration: "Even holding more than one thing, something moved." },
            { key: "deeper-landed-integrated", title: "Notice how it's sitting now", narration: "They came together into one clear sense." },
            { key: "complete-cycle", title: "Complete the cycle", narration: "That's the whole loop — core cycle, both wuxing moves, a named thread, and Level 2. Complete the cycle to see the wrap-up." }
        ];

        // Named jump points into the script (Onboarding Audit, Sept 26 2026, Recommended
        // changes #3/#9): a returning viewer can skip straight to a section instead of
        // replaying all 49 steps from scratch. Fast-forwarding is implemented by really
        // clicking through every earlier step programmatically (see jumpTo/the demo
        // click-catcher effect below) rather than hand-maintained state snapshots, so it
        // can never drift out of sync with DEMO_SCRIPT as the script changes.
        const DEMO_JUMP_POINTS = [
            { label: "Multiplicity", index: 10 },
            { label: "Wuxing moves", index: 15 },
            { label: "Level 2", index: 38 },
        ];

        function OnologyAlchemyGame() {
            const [phase, setPhase] = useState("entry");
            const [location, setLocation] = useState("");
            const [texture, setTexture] = useState("");
            const [selectedChannel, setSelectedChannel] = useState(null);
            const [selectedFace, setSelectedFace] = useState(null);
            const [currentStem, setCurrentStem] = useState("");
            const [userBelief, setUserBelief] = useState("");
            const [shifted, setShifted] = useState(null);
            const [history, setHistory] = useState([]);
            const [actionLog, setActionLog] = useState(["Game initialized"]);
            // Collapsed by default so a real playtester never sees raw state — this is
            // for Wendell (or a tester walking through a bug with him) to open on
            // purpose, not a HUD anyone is meant to look at while playing.
            const [debugPanelOpen, setDebugPanelOpen] = useState(false);
            const [phase3Context, setPhase3Context] = useState(null); // "initial", "flow-forward", "tempering", or "branch"
            const [previousChannel, setPreviousChannel] = useState(null);
            const [primaryChannel, setPrimaryChannel] = useState(null);
            const [primaryFace, setPrimaryFace] = useState(null);
            const [resolvedThreads, setResolvedThreads] = useState([]); // {channel, face, belief, passive, endState}
            const [deferredThreads, setDeferredThreads] = useState([]); // {channel, face} named but not yet worked
            const [recheckTarget, setRecheckTarget] = useState(null); // {channel, face} currently being checked back on
            // The satisfaction state ("dissatisfied" | "neutral" | "satisfied") the channel
            // currently being worked is starting FROM. Every entry point sets this
            // explicitly and on purpose (see the Satisfaction-State Wuxing Routing spec):
            // a fresh primary channel or a named branch/recheck always starts dissatisfied;
            // Flow Forward/Tempering compute it from the routing table off the thread just
            // resolved; a divergent "own charge" is asked for it directly.
            const [incomingState, setIncomingState] = useState("dissatisfied");
            // Opening-practice minigame state. currentPractice is rolled fresh at every
            // body-scan entry point; the rest are transient scratch fields specific to
            // one practice's ritual and are reset (not necessarily used) on every roll.
            const [currentPractice, setCurrentPractice] = useState(null);
            // W.A.V.E. as the player's chosen opener (site build, 6 October 2026). Null
            // keeps the original d6 roll. Set by a ?practice=wave link, by "Begin with
            // W.A.V.E." on the entry screen, or by switching to it mid-scan; it then holds
            // for every body scan in the session, including Flow Forward/Tempering hops.
            const [preferredPracticeId, setPreferredPracticeId] = useState(LINKED_PRACTICE_ID);
            // "first" (Phase 1 / a fresh cycle -- genuinely unknown) or "continuation"
            // (phase-flow-locate, after Flow Forward/Tempering -- checking for the
            // already-named charge in its new channel). Read by renderOpeningRitual()
            // to pick which blurb variant, and by the WAVE "welcome" step's own prompt.
            const [scanContext, setScanContext] = useState("first");
            const [wantedThing, setWantedThing] = useState("");
            const [happyAppleStep, setHappyAppleStep] = useState("want"); // "want" | "scan"
            const [groundingAnswers, setGroundingAnswers] = useState(["", "", "", "", ""]);
            const [resourceLocation, setResourceLocation] = useState("");
            // W.A.V.E. steps: Welcome -> Acknowledge/Accept/Appreciate (player's own
            // honest level, hardest last) -> Validate -> Exhale/Exit/Express (stay if
            // aligned, release if not) -> the shared body scan, framed by which branch
            // was taken.
            const [waveStep, setWaveStep] = useState("welcome"); // a WAVE_STEPS id, or "scan" once the opener is done
            const [waveLevel, setWaveLevel] = useState(null); // the highest rung reached: "acknowledge" | "allow" | "accept" | "appreciate"
            const [waveAlignment, setWaveAlignment] = useState(null); // "stay" | "release"
            // OPEN-UP TECHNIQUE CHOICE (Hold-the-Belief pause, between "Ready to notice"
            // and the shift check, in both the main flow and Go Deeper) — Wendell, Sept 24
            // 2026: "this was supposed to have options for people to choose," not the fixed
            // breathing-only screen it shipped as. Player-facing choice, not a random roll
            // like the openingPractices table above. W.A.V.E.'s four steps are ported from
            // that same ritual (own state here, since this ending doesn't feed a body-scan
            // the way the Phase 1 version does). Sedona Method is a new, faithful port of
            // the real technique's own sequence — welcome the feeling, then ask could I /
            // would I / when, repeating as many passes as the player wants (sourced against
            // the real technique, not invented: sourcesofinsight.com, thepleasantmind.com).
            const [openTechnique, setOpenTechnique] = useState(null); // "breaths" | "wave" | "sedona"
            const [openReturnPhase, setOpenReturnPhase] = useState("phase5-result"); // where to land once the chosen technique finishes
            const [openWaveStep, setOpenWaveStep] = useState("welcome"); // a WAVE_STEPS id
            const [openWaveLevel, setOpenWaveLevel] = useState(null); // the highest rung reached, as waveLevel
            const [openWaveAlignment, setOpenWaveAlignment] = useState(null); // "stay" | "release"
            // The route log the map is drawn from (oag-map-output): stops, moves, dead ends,
            // threads set aside, Go Deeper, and W.A.V.E. blocks, in the order they happened.
            // Belief text never goes in it (oag-map-private).
            const [route, setRoute] = useState([]);
            // Blocked W.A.V.E. steps (oag-wave-blocks). Each frame saves the whole cycle
            // state at the moment the block came up, so the block work can run the game's
            // own cycle and then return to the exact step with the outer charge unchanged.
            // A stack because a block can come up inside block work.
            const [blockStack, setBlockStack] = useState([]);
            const [blockFrameSkipped, setBlockFrameSkipped] = useState(false);
            // Where the trip began (oag-trailhead): set once, on the first body scan of a
            // cycle outside any block, so block work never overwrites it. Holds the
            // location, texture, first channel and face, the player's optional words, and
            // their answer on the way back at Cycle Complete. Never stored (oag-words-private).
            const [trailhead, setTrailhead] = useState(null);
            const [startWords, setStartWords] = useState("");
            // The block the player just came back from, shown on the step they return to
            // with a second size slider (oag-block-carry, oag-block-size).
            const [lastReturn, setLastReturn] = useState(null);
            // The optional Appreciate line, one per W.A.V.E. location (oag-appreciate-input).
            const [appreciateNotes, setAppreciateNotes] = useState({ opener: "", open: "" });
            // The three-sentence faces primer shows on the first face pick of a session
            // (oag-faces-primer).
            const [facesIntroSeen, setFacesIntroSeen] = useState(false);
            const mapSvgRef = React.useRef(null);
            const [sedonaStep, setSedonaStep] = useState(1); // 1 welcome, 2 could-i, 3 would-i, 4 when, 5 repeat-or-done
            const [sedonaRounds, setSedonaRounds] = useState(0); // completed full passes, for "round N" copy
            // LEVEL 2 — "Go Deeper" state. deeperStems is the 3-stem set for the current
            // (channel, face, state) cell. deeperVerdicts is the block check's real
            // output: one of null | "clean" | "caught" per stem, set by holding that
            // stem with the intention to state what's true right now and noticing ease
            // vs. friction (Sept 25, 2026 — see "Block Check Mechanic — Corrected
            // Against Existing Code" in the ontology-alchemy-game memory file). This
            // replaces the old bare-click toggle: a stem is never silently "not held",
            // it has to be actually checked, clean or caught, before Continue appears.
            // heldBeliefs is the resolved set (every stem that came out clean, or a
            // single self-authored replacement if zero did) actually carried into the
            // sit/breathe/result loop — any number 0-3 can be clean, same as the old
            // toggle allowed any number 0-3 to be selected.
            const [deeperStems, setDeeperStems] = useState([]);
            const [deeperState, setDeeperState] = useState(null); // the state ("dissatisfied"|"neutral"|"satisfied") this pass is keyed to
            const [deeperVerdicts, setDeeperVerdicts] = useState([]);
            const [deeperSelfAuthorText, setDeeperSelfAuthorText] = useState("");
            const [heldBeliefs, setHeldBeliefs] = useState([]);
            const [deeperShifted, setDeeperShifted] = useState(null);
            const [deeperOutcome, setDeeperOutcome] = useState(null); // "held-multiple" | "integrated-one"
            // ICA 2 face-pattern reflection (Simulated Playtesting doc's "typology
            // enthusiast" persona + ICA Productization Strategy doc, Sept 23, 2026):
            // logs every face actually CHOSEN at a fresh face-pick (Phase 3 initial,
            // flow-forward, tempering, or a named branch) — not every render of Phase 3,
            // and not a deferred thread's face being picked back up at recheck, since
            // that face was already fixed when the thread was first named, not a new
            // decision. Deliberately NOT reset by handleNewCycle: the pattern this exists
            // to reflect ("the same face regardless of channel") is a session-long habit,
            // not a within-charge one, and this is the one piece of state in the whole
            // game designed to outlive "Start a New Cycle" on purpose.
            const [faceLog, setFaceLog] = useState([]);
            // UX polish bundle (Simulated Playtesting doc, Speed/Blockers section, Sept 23, 2026):
            // "Phase 7 currently offers exactly two shapes for 'it didn't shift' — try again, or
            // abandon to a new charge — with no third option to simply stop here for today without
            // it counting as failure... a player who is fine but just not there yet deserves a
            // non-failing stop as much as a player in real distress does." This is explicitly named
            // in that doc as separate from the acute-distress off-ramp shipped earlier the same
            // session, and reuses that same phase-stopped screen from a second entry point, exactly
            // as the doc anticipated ("probably the same stop screen reused from a different entry
            // point"). stopReason distinguishes which entry point got us here, purely so the stop
            // screen's copy can match the register of "in crisis" vs. "just not done today" — the
            // ledger-clearing behavior on leaving is identical either way.
            const [stopReason, setStopReason] = useState(null); // "distress" | "done-for-today"
            // A genuine outside-the-practice interruption (6-Faces design review, Sept 26
            // 2026) -- not a felt-sense signal, and not either stop above, both of which
            // fully clear the charge ledger. This one preserves everything and only
            // remembers which phase to return to; see handlePauseHere/handleResumeFromPause.
            const [pausedFromPhase, setPausedFromPhase] = useState(null);
            // Archetype-classifier inputs (see classifyArchetype above), all charge-scoped
            // (reset by handleNewCycle, same as resolvedThreads/deferredThreads) since they
            // describe how THIS charge unfolded, not a session-long habit like faceLog.
            const [deadEndCount, setDeadEndCount] = useState(0); // "Nothing here" at phase-flow-locate
            const [divergentChargeCount, setDivergentChargeCount] = useState(0); // "This is its own charge" at Phase 7
            const [deferCount, setDeferCount] = useState(0); // branch/recheck "set aside" clicks
            // Approximates the random-walk classifier's "actions taken" for the pace rule —
            // incremented once per real phase transition via the render-logging effect below,
            // which already fires on every phase change. A ref (not state) since it's a
            // monotonic counter only read at cycle-complete time, not something that should
            // itself trigger a re-render.
            const moveCountRef = React.useRef(0);
            // Mode A persistence read state: patternSummary is this viewer's rollup doc
            // (null until the mount-time read resolves, or forever null with no db/user
            // grant); persistenceAvailable distinguishes "resolved and empty" (a genuinely
            // new viewer) from "not available at all" (no capability), so Phase 6's one-time
            // consent-context line only shows when a write is actually about to happen.
            const [patternSummary, setPatternSummary] = useState(null);
            const [persistenceAvailable, setPersistenceAvailable] = useState(false);
            // This charge's own archetype (classifyArchetype's verdict on it), set the
            // moment handleCompleteCycle runs — shown on phase6-done regardless of whether
            // persistence is available, since the reflection is interesting on its own and
            // isn't a claim about anything saved. Not charge-scoped-reset by handleNewCycle:
            // it always gets overwritten by the NEXT handleCompleteCycle before it's shown
            // again, so a stale value is never visible.
            const [lastCycleArchetype, setLastCycleArchetype] = useState(null);
            // Mode B (opt-in coach visibility). shareWithCoach is the player's own
            // per-cycle choice — reset every new cycle same as the archetype counters,
            // since Wendell's call was explicit approval every time, never a sticky
            // setting that shares silently going forward. pendingShareData holds the
            // just-completed cycle's classifier output between "Complete This Cycle"
            // and the share-confirmation screen's own decision (share / keep private).
            const [shareWithCoach, setShareWithCoach] = useState(false);
            const [pendingShareData, setPendingShareData] = useState(null);
            // The player's own uid, exposed here (Mode A's getPersistence() resolves it
            // internally but doesn't surface it) so the share-confirmation screen can
            // show it as "your code" — the identifier a coach later types in. Reusing
            // the uid rather than minting a separate share code: it's already an opaque,
            // per-artifact token safe to hand out (see user.d.ts), and data/coach-shared
            // isn't under data/users/, so writing there under this key is a SHARED
            // write, not a private one, even though the path is keyed by this uid.
            const [myCode, setMyCode] = useState(null);
            // Site build: the portable code for the cycle just shared (see
            // encodePortableCoachCode). Null in the artifact, and reset every new cycle.
            const [coachShareCode, setCoachShareCode] = useState(null);
            // Coach-view mode: reached from the entry screen by pasting a player's own
            // code, not a URL parameter — a query string on the outer claude.ai artifact
            // URL is not known to reach this page's own window.location once it's
            // rendered inside the platform's viewer frame (a separate origin, per the
            // console warnings this session's live test surfaced), so a code typed
            // in-page is the mechanism that's actually been kept inside what this
            // session could verify, not an assumption about URL passthrough. Entirely
            // separate from the rest of the phase machine.
            const [coachMode, setCoachMode] = useState(false);
            const [coachCodeInput, setCoachCodeInput] = useState("");
            const [coachViewCode, setCoachViewCode] = useState(null);
            const [coachSummary, setCoachSummary] = useState(null);
            const [coachCycles, setCoachCycles] = useState(null);
            const [coachViewError, setCoachViewError] = useState(null);
            const [coachViewLoading, setCoachViewLoading] = useState(false);

            // Demo Mode — walks a player alongside a scripted example instead of their
            // own data. demoStep indexes DEMO_SCRIPT; demoStep === DEMO_SCRIPT.length
            // means the script has finished and only the exit banner shows.
            const [demoMode, setDemoMode] = useState(false);
            const [demoStep, setDemoStep] = useState(0);

            const logAction = (msg) => {
                setActionLog(prev => [msg, ...prev.slice(0, 7)]);
            };

            // RENDER START - log the phase we're about to render
            if (phase !== "entry") {
                console.log(`%c>>> RENDER PHASE: ${phase} <<<`, "color: yellow; font-weight: bold");
            }

            // Log every render to see state changes
            React.useEffect(() => {
                if (phase !== "entry") {
                    logAction(`[RENDER] phase=${phase}, channel=${selectedChannel}`);
                    moveCountRef.current += 1;
                }
            }, [phase, selectedChannel]);

            // Mode A persistence: read this viewer's rollup summary once, on mount, for the
            // entry screen's "welcome back" reflection. Gated entirely on db/user resolving —
            // hidden outright (never a loading spinner blocking "Begin Practice") when they
            // don't, exactly as the spec requires.
            React.useEffect(() => {
                (async () => {
                    const p = await getPersistence();
                    if (!p) return;
                    setPersistenceAvailable(true);
                    setMyCode(p.uid);
                    try {
                        const snap = await p.profileRef.get();
                        if (snap.exists) setPatternSummary(snap.data());
                    } catch (e) {
                        // best-effort; entry screen simply shows no pattern reflection
                    }
                })();
            }, []);

            const debugPanel = !SHOW_DEBUG ? null : debugPanelOpen ? (
                <div className="debug-panel">
                    <button className="debug-close" onClick={() => setDebugPanelOpen(false)} aria-label="Close debug panel">✕</button>
                    <strong>DEBUG STATE</strong>
                    phase: {phase}
                    <strong>channel:</strong>
                    {selectedChannel || "null"}
                    <strong>face:</strong>
                    {selectedFace || "null"}
                    <strong>shifted:</strong>
                    {shifted === null ? "null" : shifted ? "true" : "false"}
                    <strong>phase3Context:</strong>
                    {phase3Context || "null"}
                    <strong>LAST ACTIONS</strong>
                    {actionLog.map((log, i) => <div key={i}>{log}</div>)}
                </div>
            ) : (
                <button className="debug-toggle" onClick={() => setDebugPanelOpen(true)} aria-label="Open debug panel">🐞</button>
            );

            // Test-only state mirror. Not part of the visible debug panel (left alone per
            // request) — this exposes the actual multiplicity state on window so automated
            // tests can assert against real state instead of inferring it from rendered text.
            React.useEffect(() => {
                if (typeof window !== "undefined") {
                    window.__gameState = {
                        phase, selectedChannel, selectedFace, shifted, phase3Context,
                        previousChannel, location, texture,
                        primaryChannel, primaryFace,
                        resolvedThreads, deferredThreads, recheckTarget,
                        incomingState,
                        currentPractice: currentPractice ? currentPractice.id : null,
                        scanContext,
                        waveLevel, waveAlignment,
                        openTechnique, openReturnPhase, openWaveStep, openWaveLevel, openWaveAlignment,
                        sedonaStep, sedonaRounds,
                        deeperState, deeperCleanCount, deeperCaughtCount: deeperVerdicts.filter(v => v === "caught").length,
                        allDeeperStemsChecked,
                        heldBeliefsCount: heldBeliefs.length, deeperShifted, deeperOutcome,
                        faceLog, stopReason,
                        deadEndCount, divergentChargeCount, deferCount,
                        persistenceAvailable, patternSummary, lastCycleArchetype,
                        shareWithCoach, pendingShareData, myCode,
                        coachMode, coachViewCode, coachSummary, coachCycles, coachViewError,
                        demoMode, demoStep,
                        pausedFromPhase,
                        waveStep, route, userBelief,
                        blockDepth: blockStack.length,
                        blockSteps: blockStack.map(f => f.step),
                        trailhead, lastReturn,
                    };
                }
            });

            // Rolls a fresh opening practice and clears every practice's scratch fields,
            // whether or not this roll will use them — called at every body-scan entry
            // point (fresh cycle, and each Flow Forward / Tempering hop) so a leftover
            // answer from a previous practice never bleeds into the next one.
            const beginBodyScan = (context = "first", preferredId = preferredPracticeId) => {
                // Test-only override: setting window.__forcePracticeId before triggering a
                // scan makes the roll deterministic, so existing regression tests (written
                // before this feature existed) don't have to handle six different rituals
                // at random. Real play never sets this, so it always rolls for real.
                const forced = (typeof window !== "undefined" && window.__forcePracticeId)
                    ? openingPractices.find(p => p.id === window.__forcePracticeId)
                    : null;
                const preferred = preferredId ? openingPractices.find(p => p.id === preferredId) : null;
                const roll = forced || preferred || openingPractices[Math.floor(Math.random() * openingPractices.length)];
                setCurrentPractice(roll);
                setScanContext(context);
                setWantedThing("");
                setHappyAppleStep("want");
                setGroundingAnswers(["", "", "", "", ""]);
                setResourceLocation("");
                setWaveStep("welcome");
                setWaveLevel(null);
                setWaveAlignment(null);
                setLocation("");
                setTexture("");
            };

            const handleEntryRitual = () => {
                beginBodyScan();
                setPhase("phase1");
            };

            const handleEntryWithWave = () => {
                setPreferredPracticeId("wave");
                beginBodyScan("first", "wave");
                setPhase("phase1");
            };

            // Switch the current scan to W.A.V.E. without losing what's already typed
            // into location/texture, and keep it as the opener for the rest of the session.
            const handleSwitchToWave = () => {
                setPreferredPracticeId("wave");
                setCurrentPractice(openingPractices.find(p => p.id === "wave"));
                setWaveStep("welcome");
                setWaveLevel(null);
                setWaveAlignment(null);
            };

            const logRoute = (event) => setRoute(prev => [...prev, event]);

            // Everything a cycle can change, as [value, setter] pairs, so a blocked W.A.V.E.
            // step can save it whole and put it back whole (oag-wave-blocks). The route log
            // and the block stack are left out on purpose: the map keeps the detour, and the
            // stack is what does the saving.
            const cycleStateBindings = () => ({
                phase: [phase, setPhase], location: [location, setLocation], texture: [texture, setTexture],
                selectedChannel: [selectedChannel, setSelectedChannel], selectedFace: [selectedFace, setSelectedFace],
                currentStem: [currentStem, setCurrentStem], userBelief: [userBelief, setUserBelief], shifted: [shifted, setShifted],
                history: [history, setHistory], phase3Context: [phase3Context, setPhase3Context],
                previousChannel: [previousChannel, setPreviousChannel], primaryChannel: [primaryChannel, setPrimaryChannel],
                primaryFace: [primaryFace, setPrimaryFace], resolvedThreads: [resolvedThreads, setResolvedThreads],
                deferredThreads: [deferredThreads, setDeferredThreads], recheckTarget: [recheckTarget, setRecheckTarget],
                incomingState: [incomingState, setIncomingState], currentPractice: [currentPractice, setCurrentPractice],
                scanContext: [scanContext, setScanContext], wantedThing: [wantedThing, setWantedThing],
                happyAppleStep: [happyAppleStep, setHappyAppleStep], groundingAnswers: [groundingAnswers, setGroundingAnswers],
                resourceLocation: [resourceLocation, setResourceLocation], waveStep: [waveStep, setWaveStep],
                waveLevel: [waveLevel, setWaveLevel], waveAlignment: [waveAlignment, setWaveAlignment],
                openTechnique: [openTechnique, setOpenTechnique], openReturnPhase: [openReturnPhase, setOpenReturnPhase],
                openWaveStep: [openWaveStep, setOpenWaveStep], openWaveLevel: [openWaveLevel, setOpenWaveLevel],
                openWaveAlignment: [openWaveAlignment, setOpenWaveAlignment], sedonaStep: [sedonaStep, setSedonaStep],
                sedonaRounds: [sedonaRounds, setSedonaRounds], deeperStems: [deeperStems, setDeeperStems],
                deeperState: [deeperState, setDeeperState], deeperVerdicts: [deeperVerdicts, setDeeperVerdicts],
                deeperSelfAuthorText: [deeperSelfAuthorText, setDeeperSelfAuthorText], heldBeliefs: [heldBeliefs, setHeldBeliefs],
                deeperShifted: [deeperShifted, setDeeperShifted], deeperOutcome: [deeperOutcome, setDeeperOutcome],
                appreciateNotes: [appreciateNotes, setAppreciateNotes],
            });
            const takeSnapshot = () => {
                const b = cycleStateBindings();
                return Object.keys(b).reduce((acc, k) => ({ ...acc, [k]: b[k][0] }), {});
            };
            const restoreSnapshot = (snap) => {
                const b = cycleStateBindings();
                Object.keys(snap).forEach(k => b[k][1](snap[k]));
            };

            // "Something's in the way" on a W.A.V.E. step. Wendell, 6 October 2026: "if
            // something is blocking welcoming a feeling in the player should be able to work
            // on that block and it should route them back to where they started when the
            // block emerged."
            const openBlock = (where, step) => {
                const depth = blockStack.length + 1;
                const id = `b${Date.now()}-${depth}`;
                // The charge the player was with when the step got blocked, so the block
                // screen and the trail can name exactly what was blocked (oag-block-carry).
                const charge = { location: location || null, texture: texture || null, channel: selectedChannel || null };
                setBlockStack(prev => [...prev, { snapshot: takeSnapshot(), where, step, channel: selectedChannel || null, depth, id, charge, words: "", size: null }]);
                logRoute({ kind: "block-open", id, step, where, channel: selectedChannel || null, depth });
                setBlockFrameSkipped(false);
                setLastReturn(null);
                setPhase("phase-wave-block");
            };
            const updateTopFrame = (fields) => setBlockStack(prev => prev.map((f, i) => (i === prev.length - 1 ? { ...f, ...fields } : f)));
            // Copies the player's words and size from the block screen into the route log,
            // when they leave that screen either way.
            const commitBlockDetails = () => {
                const frame = blockStack[blockStack.length - 1];
                if (!frame) return;
                const words = (frame.words || "").trim();
                setRoute(prev => prev.map(e => (e.kind === "block-open" && e.id === frame.id ? { ...e, words, size: frame.size } : e)));
            };

            // Block work runs the game's own cycle from a fresh body scan: find it, name its
            // channel and face, hold a true belief, see if it shifts. This is option A of the
            // open board question oag-block-work; B or C would replace only this function
            // and the copy on the block screen.
            const startBlockWork = () => {
                commitBlockDetails();
                setAppreciateNotes({ opener: "", open: "" });
                setSelectedChannel(null);
                setSelectedFace(null);
                setCurrentStem("");
                setUserBelief("");
                setShifted(null);
                setPhase3Context(null);
                setPreviousChannel(null);
                setPrimaryChannel(null);
                setPrimaryFace(null);
                setResolvedThreads([]);
                setDeferredThreads([]);
                setRecheckTarget(null);
                setHistory([]);
                setHeldBeliefs([]);
                setDeeperStems([]);
                setDeeperVerdicts([]);
                setDeeperState(null);
                setDeeperShifted(null);
                setDeeperOutcome(null);
                beginBodyScan("block");
                setPhase("phase1");
            };

            // Back to the step the newest block came up on, with everything it had.
            const returnFromBlock = (outcome) => {
                const frame = blockStack[blockStack.length - 1];
                if (!frame) return;
                const rid = `${frame.id}-r`;
                logRoute({ kind: "block-return", id: rid, openId: frame.id, step: frame.step, depth: frame.depth, outcome });
                restoreSnapshot(frame.snapshot);
                setBlockStack(blockStack.slice(0, -1));
                setLastReturn({ id: rid, step: frame.step, where: frame.where, words: (frame.words || "").trim(), sizeBefore: frame.size, sizeAfter: null, charge: frame.charge });
            };
            const setReturnSize = (n) => {
                if (!lastReturn) return;
                setLastReturn({ ...lastReturn, sizeAfter: n });
                setRoute(prev => prev.map(e => (e.kind === "block-return" && e.id === lastReturn.id ? { ...e, sizeAfter: n } : e)));
            };

            const handlePhase1Submit = () => {
                if (location && texture) {
                    if (!trailhead && blockStack.length === 0) {
                        setTrailhead({ location, texture, words: startWords.trim(), channel: null, face: null, answer: null });
                    }
                    setPhase("phase2");
                }
            };

            const handleChannelSelect = (channelName) => {
                try {
                    logAction(`🎯 Channel clicked: ${channelName}`);

                    setSelectedChannel(channelName);
                    logAction(`✓ setSelectedChannel("${channelName}")`);
                    if (blockStack.length === 0) setTrailhead(t => (t && !t.channel ? { ...t, channel: channelName } : t));

                    setPhase3Context("initial");
                    logAction(`✓ setPhase3Context("initial")`);

                    // A fresh primary charge always starts dissatisfied — that's the
                    // explicit rule for this entry point (Amber's completeness ask).
                    setIncomingState("dissatisfied");

                    setPreviousChannel(null);
                    setPhase("phase3");
                    logAction(`✓ setPhase("phase3") called`);

                } catch (error) {
                    logAction(`✗ ERROR in handler: ${error.message}`);
                    console.error("handleChannelSelect error:", error);
                }
            };

            const handleFaceSelect = (faceName) => {
                setSelectedFace(faceName);
                setFacesIntroSeen(true);
                if (blockStack.length === 0) setTrailhead(t => (t && !t.face ? { ...t, face: faceName } : t));
                setFaceLog(prev => [...prev, faceName]);
                const key = selectedChannel.toLowerCase();
                // incomingState was already set by whatever brought us to this channel:
                // "dissatisfied" for a fresh primary charge (handleChannelSelect), or the
                // routed value for Flow Forward / Tempering (handleFlowForward/Tempering).
                const stem = stems[key][faceName.toLowerCase()][incomingState];
                setCurrentStem(stem);
                setPhase("phase4");
            };

            const handleStemAccept = () => {
                setUserBelief(currentStem);
                setPhase("phase5");
            };

            const handleStemReject = () => {
                setPhase("phase4-self-author");
            };

            const handleSelfAuthor = () => {
                if (userBelief.trim()) {
                    setPhase("phase5");
                }
            };

            // Shared entry point for the open-up technique picker — used by both the main
            // Phase 5 flow and Go Deeper's own hold-and-check loop. Resets every technique's
            // scratch state on every entry so a leftover Sedona round or W.A.V.E. level from
            // a previous pass never bleeds into the next one, then records which phase to
            // land on once the player's chosen technique actually finishes.
            const handleOpenTechniqueEntry = (returnPhase) => {
                setOpenTechnique(null);
                setOpenWaveStep("welcome");
                setOpenWaveLevel(null);
                setOpenWaveAlignment(null);
                setSedonaStep(1);
                setSedonaRounds(0);
                setOpenReturnPhase(returnPhase);
                setPhase("phase-open-choice");
            };

            const handlePhase5Done = () => handleOpenTechniqueEntry("phase5-result");

            const handleChooseOpenTechnique = (technique) => {
                setOpenTechnique(technique);
                setPhase("phase-open-active");
            };

            // Simple Breaths — the original fixed screen's content, unchanged, just reached
            // through the picker now instead of being the only option.
            const handleOpenBreathingDone = () => setPhase(openReturnPhase);

            // W.A.V.E. in the Open Up picker: the same steps as the Phase 1 opener (see
            // renderWaveStep), ending back in the flow here instead of in a body scan.
            const handleOpenWaveExhale = (alignment) => {
                setOpenWaveAlignment(alignment);
                setPhase(openReturnPhase);
            };

            // Sedona Method: welcome/feel it, then the real three-question release sequence
            // (could I let this go / would I / when), repeated as many passes as the player
            // wants. Both "yes" and "no" genuinely advance at the could/would questions —
            // the real technique treats either answer as valid; only "repeat vs. move on"
            // actually branches.
            const handleSedonaAdvance = () => setSedonaStep(prev => prev + 1);
            const handleSedonaRepeat = () => {
                setSedonaRounds(prev => prev + 1);
                setSedonaStep(1);
            };
            const handleSedonaFinish = () => setPhase(openReturnPhase);

            const handleShifted = (didShift) => {
                setShifted(didShift);
                if (didShift) {
                    if (!primaryChannel) {
                        setPrimaryChannel(selectedChannel);
                        setPrimaryFace(selectedFace);
                    }
                    // Don't record the thread yet — we don't know its landing state until
                    // the player tells us (phase5-state-confirm). That state is what the
                    // routing table reads off later, so it has to come from the player,
                    // not get assumed.
                    setPhase("phase5-state-confirm");
                } else {
                    setPhase("phase7");
                }
            };

            // The felt-state check the hostile review insisted stay a real check, not a
            // shortcut: whatever the player picks becomes this thread's endState, which is
            // exactly what Flow Forward/Tempering read to route the NEXT channel's starting
            // state. No skip exists for this — every resolved thread goes through it.
            const handlePhase5StateConfirm = (state) => {
                // Block work ends here: the block shifted, so return to the step it
                // came up on (oag-wave-blocks), instead of asking about other channels.
                if (blockStack.length > 0) {
                    returnFromBlock("shifted");
                    return;
                }
                logRoute({ kind: "stop", channel: selectedChannel, face: selectedFace, endState: state });
                setResolvedThreads(prev => [...prev, { channel: selectedChannel, face: selectedFace, belief: userBelief, passive: false, endState: state }]);
                afterThreadResolved();
            };

            // After any thread resolves (directly worked or passively confirmed), either
            // check back on the next deferred thread, or ask if the charge is showing up
            // anywhere else it hasn't been named yet.
            const afterThreadResolved = () => {
                if (deferredThreads.length > 0) {
                    const next = deferredThreads[0];
                    setDeferredThreads(deferredThreads.slice(1));
                    setRecheckTarget(next);
                    setPhase("phase-recheck");
                } else {
                    setPhase("phase-multiplicity-check");
                }
            };

            const usedChannelNames = () => {
                const used = new Set();
                if (primaryChannel) used.add(primaryChannel);
                if (selectedChannel) used.add(selectedChannel);
                resolvedThreads.forEach(t => used.add(t.channel));
                deferredThreads.forEach(t => used.add(t.channel));
                return used;
            };

            const remainingChannelsForBranch = () => {
                const used = usedChannelNames();
                return channels.filter(ch => !used.has(ch.name));
            };

            const handleBranchChannelSelect = (channelName) => {
                setSelectedChannel(channelName);
                setPhase3Context("branch");
                setPhase("phase3");
            };

            const handleBranchFaceSelect = (faceName) => {
                setSelectedFace(faceName);
                setFacesIntroSeen(true);
                setFaceLog(prev => [...prev, faceName]);
                const key = selectedChannel.toLowerCase();
                // A branch is a freshly named thread, not a continuation of a resolved
                // one — it always starts dissatisfied, same explicit rule as the primary
                // channel. (setIncomingState here is bookkeeping for window.__gameState;
                // the stem lookup itself uses the local literal so it's correct on this
                // same click, before the state update commits.)
                setIncomingState("dissatisfied");
                const stem = stems[key][faceName.toLowerCase()]["dissatisfied"];
                setCurrentStem(stem);
                setPhase("phase-branch-choice");
            };

            const handleBranchWorkNow = () => {
                setPhase("phase4");
            };

            const handleBranchDefer = () => {
                logRoute({ kind: "defer", channel: selectedChannel, face: selectedFace });
                setDeferredThreads(prev => [...prev, { channel: selectedChannel, face: selectedFace }]);
                setDeferCount(prev => prev + 1);
                setPhase("phase-multiplicity-check");
            };

            // A passive resolution never went through the felt-state check, so it has no
            // player-reported landing — explicit default per the routing spec: treat it as
            // "neutral" (moved, but not directly verified) rather than leaving endState
            // undefined, which would break routing if this ends up being the last resolved
            // thread when Phase 6 asks "where next."
            const handleRecheckShifted = () => {
                logRoute({ kind: "stop", channel: recheckTarget.channel, face: recheckTarget.face, endState: "neutral", passive: true });
                setResolvedThreads(prev => [...prev, { channel: recheckTarget.channel, face: recheckTarget.face, belief: null, passive: true, endState: "neutral" }]);
                setRecheckTarget(null);
                afterThreadResolved();
            };

            const handleRecheckWorkNow = () => {
                setSelectedChannel(recheckTarget.channel);
                setSelectedFace(recheckTarget.face);
                // A deferred thread being picked back up is, like a branch, a fresh start —
                // always dissatisfied, not routed from anything.
                setIncomingState("dissatisfied");
                const stem = stems[recheckTarget.channel.toLowerCase()][recheckTarget.face.toLowerCase()]["dissatisfied"];
                setCurrentStem(stem);
                setRecheckTarget(null);
                setPhase("phase4");
            };

            const handleMultiplicityYesStart = () => {
                setPhase("phase-multiplicity-pick-channel");
            };

            // Phase 6's wuxing math (Flow Forward/Tempering targets, the "restrains" label)
            // reads off selectedChannel/selectedFace. That's only correct if the last thing
            // that happened was actually resolving a thread. If the last thing was naming a
            // thread and setting it aside, selectedChannel is left pointing at that deferred,
            // never-worked channel instead — so re-anchor to the last RESOLVED thread here,
            // the one Phase 6 is actually reporting on.
            const handleFinishMultiplicity = () => {
                const last = resolvedThreads[resolvedThreads.length - 1];
                if (last) {
                    setSelectedChannel(last.channel);
                    setSelectedFace(last.face);
                }
                setPhase("phase6");
            };

            const handleRecheckDefer = () => {
                const target = recheckTarget;
                setRecheckTarget(null);
                setDeferCount(prev => prev + 1);
                if (deferredThreads.length > 0) {
                    const next = deferredThreads[0];
                    setDeferredThreads([...deferredThreads.slice(1), target]);
                    setRecheckTarget(next);
                    setPhase("phase-recheck");
                } else {
                    setDeferredThreads([target]);
                    setPhase("phase-multiplicity-check");
                }
            };

            // Satisfaction-state routing table (confirmed against Wendell's three stated
            // rules): sheng (Flow Forward) always advances one rung toward satisfaction;
            // ke (Tempering) never advances — it holds or pulls back toward dissatisfied.
            // Satisfied is a ceiling on both cycles.
            const routingTable = {
                sheng: { dissatisfied: "neutral", neutral: "satisfied", satisfied: "satisfied" },
                ke: { dissatisfied: "dissatisfied", neutral: "dissatisfied", satisfied: "satisfied" }
            };

            const currentThreadEndState = () => {
                const last = resolvedThreads[resolvedThreads.length - 1];
                return last ? (last.endState || "dissatisfied") : "dissatisfied";
            };

            // Flow Forward / Tempering Wisdom continue working the SAME charge into a
            // related channel by default — they are not a new cycle, and primaryChannel/
            // resolvedThreads/deferredThreads belong to the charge, not to any one channel
            // within it, so they carry forward. But moving to the next channel isn't handed
            // to the player automatically: they have to find a live somatic charge there
            // first (phase-flow-locate), the same body-scan as Phase 1. If nothing's there,
            // this direction was a dead end for right now — handleFlowLocateNoCharge sends
            // them back to Phase 6 to pick something else, with the charge ledger untouched.
            const handleFlowForward = () => {
                const nextChannel = shengCycle[selectedChannel];
                const nextState = routingTable.sheng[currentThreadEndState()];
                logRoute({ kind: "move", type: "sheng", from: selectedChannel, to: nextChannel });
                setIncomingState(nextState);
                setPreviousChannel(selectedChannel);
                setSelectedChannel(nextChannel);
                setHistory([...history, { channel: selectedChannel, face: selectedFace, belief: userBelief, type: "flow-forward" }]);
                setSelectedFace(null);
                setUserBelief("");
                setShifted(null);
                setPhase3Context("flow-forward");
                beginBodyScan("continuation");
                setPhase("phase-flow-locate");
            };

            const handleTempering = () => {
                const restrainingChannel = keCycle[selectedChannel];
                const nextState = routingTable.ke[currentThreadEndState()];
                logRoute({ kind: "move", type: "ke", from: selectedChannel, to: restrainingChannel });
                setIncomingState(nextState);
                setPreviousChannel(selectedChannel);
                setSelectedChannel(restrainingChannel);
                setHistory([...history, { channel: selectedChannel, face: selectedFace, belief: userBelief, type: "tempering" }]);
                setSelectedFace(null);
                setUserBelief("");
                setShifted(null);
                setPhase3Context("tempering");
                beginBodyScan("continuation");
                setPhase("phase-flow-locate");
            };

            const handleFlowLocateSubmit = () => {
                if (location && texture) {
                    setPhase("phase3");
                }
            };

            const handleFlowLocateNoCharge = () => {
                // The move just logged found nothing: the map draws it as a dead end.
                setRoute(prev => {
                    const i = prev.map(e => e.kind).lastIndexOf("move");
                    return i < 0 ? prev : prev.map((e, j) => (j === i ? { ...e, kind: "deadend" } : e));
                });
                setSelectedChannel(previousChannel);
                // Fix (6 October 2026): handleFlowForward/handleTempering cleared the face
                // and belief, so a dead end came back to Phase 6 with no face. That hid Go
                // Deeper and left "What You Held" blank on Cycle Complete. Restore both
                // from the thread Phase 6 is reporting on.
                const lastResolved = resolvedThreads[resolvedThreads.length - 1];
                if (lastResolved) {
                    setSelectedFace(lastResolved.face);
                    if (lastResolved.belief) setUserBelief(lastResolved.belief);
                }
                setLocation("");
                setTexture("");
                setDeadEndCount(prev => prev + 1);
                setPhase("phase6");
            };

            // Level 2 protocol — "hold three stems at once." True to the Multiplicity
            // Correction: this is the ALTITUDE dimension (multiple beliefs alive within
            // one face-channel), not the channel dimension the multiplicity-check screens
            // already cover. Go Deeper stays in the same channel and face, and doesn't
            // carry an incomingState forward — it isn't a routed transition to a new
            // charge state, it's an in-place hold on the state the player already landed
            // at (currentThreadEndState()).
            const hasLevel2Content = (channelName, faceName, state) => {
                if (!channelName || !faceName || !state) return false;
                const c = stemsLevel2[channelName.toLowerCase()];
                const f = c && c[faceName.toLowerCase()];
                const arr = f && f[state];
                return Array.isArray(arr) && arr.length > 0;
            };

            const handleGoDeeper = () => {
                const state = currentThreadEndState();
                const candidates = hasLevel2Content(selectedChannel, selectedFace, state)
                    ? stemsLevel2[selectedChannel.toLowerCase()][selectedFace.toLowerCase()][state]
                    : null;
                // Defensive fallback — Phase 6 only offers this card when content exists,
                // but if it's ever reached without it, don't fake a hold: just finish.
                if (!candidates) {
                    setHistory([...history, { channel: selectedChannel, face: selectedFace, belief: userBelief, type: "go-deeper-unavailable" }]);
                    // This IS a completed cycle (just one that fell through the Go Deeper
                    // offer for lack of content) — route it through the same completion
                    // path as the normal button so it gets classified and persisted too,
                    // rather than a bare setPhase that would silently skip both.
                    handleCompleteCycle();
                    return;
                }
                setDeeperState(state);
                setDeeperStems(candidates);
                setDeeperVerdicts(candidates.map(() => null));
                setDeeperSelfAuthorText("");
                setHeldBeliefs([]);
                setDeeperShifted(null);
                setDeeperOutcome(null);
                setHistory([...history, { channel: selectedChannel, face: selectedFace, belief: userBelief, type: "go-deeper" }]);
                logRoute({ kind: "deeper", channel: selectedChannel });
                setPhase("phase-deeper-hold");
            };

            // The block check itself: hold this one stem with the intention to state
            // what's true right now, and notice whether it comes out clean or something
            // catches. Reversible up until Continue — clicking the other verdict on an
            // already-checked stem just changes the answer, same low-friction re-pick the
            // rest of the game allows elsewhere.
            const setDeeperVerdict = (idx, verdict) => {
                setDeeperVerdicts(prev => prev.map((v, i) => (i === idx ? verdict : v)));
            };

            const allDeeperStemsChecked = deeperVerdicts.length > 0 && deeperVerdicts.every(v => v !== null);
            const deeperCleanCount = deeperVerdicts.filter(v => v === "clean").length;

            // Zero clean isn't an error state — it means none of the three canned facets
            // actually held up under the check, same honest fallback Level 1 gives via
            // "No, generate my own."
            const handleDeeperContinue = () => {
                if (!allDeeperStemsChecked) return;
                const cleanIndices = deeperVerdicts.reduce((acc, v, i) => (v === "clean" ? [...acc, i] : acc), []);
                if (cleanIndices.length === 0) {
                    setPhase("phase-deeper-self-author");
                    return;
                }
                setHeldBeliefs(cleanIndices.map(i => deeperStems[i]));
                setPhase("phase-deeper-sit");
            };

            const handleDeeperSelfAuthor = () => {
                if (deeperSelfAuthorText.trim()) {
                    setHeldBeliefs([deeperSelfAuthorText.trim()]);
                    setPhase("phase-deeper-sit");
                }
            };

            const handleDeeperSitDone = () => handleOpenTechniqueEntry("phase-deeper-result");

            const handleDeeperShifted = (didShift) => {
                setDeeperShifted(didShift);
                setPhase(didShift ? "phase-deeper-landed" : "phase-deeper-retry");
            };

            // Not shifting isn't a failure state to route around — holding multiplicity is
            // allowed to just take longer, or not resolve this pass at all. Both exits are
            // real: keep sitting with the same held set, or set it down and go back to
            // Phase 6 with nothing forced.
            const handleDeeperRetry = () => setPhase("phase-deeper-sit");
            const handleDeeperSetDown = () => setPhase("phase6");

            // This isn't the resolved/workable/aches trichotomy Level 1 uses — that's a
            // routing decision (it feeds the wuxing table). Going deeper doesn't re-route
            // anything; it only asks whether multiplicity stayed multiple or settled into
            // one on its own, which is the thing Level 2 exists to let the player notice.
            const handleDeeperOutcome = (outcome) => {
                setDeeperOutcome(outcome);
                setHistory([...history, { channel: selectedChannel, face: selectedFace, belief: heldBeliefs.join(" / "), type: "go-deeper-landed", outcome }]);
                setPhase("phase6");
            };

            // Mode A persistence, write side (Cross-Session Persistence Spec, "Data Model
            // Mode A"). Fire-and-forget by design: called but never awaited from
            // handleCompleteCycle, so the felt-sense loop's phase6-done render is never
            // delayed by (or made to fail because of) a network round-trip. Recomputes the
            // rollup from a FRESH profileRef.get() rather than the mount-time patternSummary
            // state, since a second cycle completed later in the same session would
            // otherwise merge on top of a now-stale read. Deliberately excludes verbatim
            // belief text — only the shape of the cycle (channel/face/counts/archetype),
            // per the spec's stated Mode A boundary.
            const persistCompletedCycle = async (features, archetype) => {
                const p = await getPersistence();
                if (!p) return;
                try {
                    const cycleId = `cycle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                    await p.profileRef.collection("cycles").doc(cycleId).set({
                        completedAt: Date.now(),
                        channel: primaryChannel || selectedChannel,
                        face: primaryFace || selectedFace,
                        resolved: features.resolved,
                        deadEnds: features.deadEnds,
                        divergentCharges: features.divergentCharges,
                        goDeepers: features.goDeepers,
                        defers: features.defers,
                        channelsTouched: features.channelsTouched,
                        archetype,
                    });

                    const snap = await p.profileRef.get();
                    const prior = snap.exists ? snap.data() : {};
                    const faceCounts = { ...(prior.faceCounts || {}) };
                    const channelCounts = { ...(prior.channelCounts || {}) };
                    for (const t of resolvedThreads) {
                        faceCounts[t.face] = (faceCounts[t.face] || 0) + 1;
                        channelCounts[t.channel] = (channelCounts[t.channel] || 0) + 1;
                    }
                    const archetypeCounts = { ...(prior.archetypeCounts || {}) };
                    archetypeCounts[archetype] = (archetypeCounts[archetype] || 0) + 1;

                    // V2 UI Spec (Sept 26 2026) — the Wuxing Wheel and Open Threads Ledger's
                    // own fields, computed by the pure merge helpers above. Mode A only,
                    // per the spec (a personal accomplishment/incompleteness surface, never
                    // sent to a coach); Mode B's persistSharedCycle below is untouched.
                    // lastExitDistress clears here on purpose — completing a cycle normally
                    // is itself evidence the suppression from a past Stop-Here exit no
                    // longer needs to hold (see markLastExitDistress/handleStopHere).
                    const channelsSatisfied = mergeChannelsSatisfied(prior.channelsSatisfied, resolvedThreads);
                    const openThreads = mergeOpenThreads(prior.openThreads, resolvedThreads, deferredThreads);

                    await p.profileRef.set({
                        totalCycles: (prior.totalCycles || 0) + 1,
                        faceCounts,
                        channelCounts,
                        archetypeCounts,
                        lastCycleAt: Date.now(),
                        lastArchetype: archetype,
                        channelsSatisfied,
                        openThreads,
                        lastExitDistress: false,
                    });
                } catch (e) {
                    // Best-effort, per the spec: a failed write never surfaces to the player
                    // and never blocks or retries mid-session.
                }
            };

            // Mode B write side (opt-in coach visibility). Only ever called after the
            // player explicitly confirms sharing THIS cycle on the phase6-share-confirm
            // screen — never automatic, never sticky, and entirely separate from Mode
            // A's own unconditional private write above (both can fire for the same
            // cycle; declining to share never touches the private copy). Same stripped
            // shape as Mode A's cycle record — no belief text — written under a SHARED
            // path keyed by this player's own uid rather than data/users/, so any
            // viewer who later types this same code into the coach-view screen can
            // read it (subject to this whole artifact's own org-only sharing ceiling —
            // see the spec's Mode B section).
            const persistSharedCycle = async (features, archetype) => {
                const p = await getPersistence();
                if (!p) return;
                try {
                    const cycleId = `cycle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                    const coachProfileRef = p.db.doc(`data/coach-shared/${p.uid}/profile`);
                    await coachProfileRef.collection("cycles").doc(cycleId).set({
                        completedAt: Date.now(),
                        channel: primaryChannel || selectedChannel,
                        face: primaryFace || selectedFace,
                        resolved: features.resolved,
                        deadEnds: features.deadEnds,
                        divergentCharges: features.divergentCharges,
                        goDeepers: features.goDeepers,
                        defers: features.defers,
                        channelsTouched: features.channelsTouched,
                        archetype,
                    });

                    const snap = await coachProfileRef.get();
                    const prior = snap.exists ? snap.data() : {};
                    const faceCounts = { ...(prior.faceCounts || {}) };
                    const channelCounts = { ...(prior.channelCounts || {}) };
                    for (const t of resolvedThreads) {
                        faceCounts[t.face] = (faceCounts[t.face] || 0) + 1;
                        channelCounts[t.channel] = (channelCounts[t.channel] || 0) + 1;
                    }
                    const archetypeCounts = { ...(prior.archetypeCounts || {}) };
                    archetypeCounts[archetype] = (archetypeCounts[archetype] || 0) + 1;

                    const nextSummary = {
                        totalCycles: (prior.totalCycles || 0) + 1,
                        faceCounts,
                        channelCounts,
                        archetypeCounts,
                        lastCycleAt: Date.now(),
                        lastArchetype: archetype,
                    };
                    await coachProfileRef.set(nextSummary);
                    if (ON_SITE) {
                        const cyclesSnap = await coachProfileRef.collection("cycles").orderBy("completedAt", "desc").limit(10).get();
                        setCoachShareCode(encodePortableCoachCode(nextSummary, cyclesSnap.docs.map(d => d.data())));
                    }
                } catch (e) {
                    // Best-effort, same as Mode A.
                }
            };

            const handleCompleteCycle = () => {
                const features = {
                    resolved: resolvedThreads.length,
                    deadEnds: deadEndCount,
                    divergentCharges: divergentChargeCount,
                    goDeepers: history.filter(h => h.type === "go-deeper").length,
                    defers: deferCount,
                    channelsTouched: new Set(resolvedThreads.map(t => t.channel)).size,
                    pace: moveCountRef.current,
                };
                const archetype = classifyArchetype(features);
                setLastCycleArchetype(archetype);
                // Demo Mode never touches real persistence — a scripted walkthrough must
                // not pollute (or, for a first-time visitor, silently create) a real
                // player's saved pattern-summary rollup.
                if (!demoMode) persistCompletedCycle(features, archetype);
                if (shareWithCoach) {
                    // Hold the classifier output for the confirm screen rather than
                    // writing the shared copy immediately — "explicit approval every
                    // cycle" means the toggle at Phase 6 only expresses intent; the
                    // actual write happens on handleConfirmShare, not here.
                    setPendingShareData({ features, archetype });
                    setPhase("phase6-share-confirm");
                } else {
                    setPhase("phase6-done");
                }
            };

            // Draws the map's SVG onto a canvas and downloads it as a PNG. Nothing is sent
            // or stored; the belief exists only in the image the player keeps.
            const saveMapImage = () => {
                const svg = mapSvgRef.current;
                if (!svg) return;
                const vb = svg.viewBox.baseVal;
                const clone = svg.cloneNode(true);
                clone.setAttribute("width", String(vb.width));
                clone.setAttribute("height", String(vb.height));
                const xml = new XMLSerializer().serializeToString(clone);
                const img = new Image();
                img.onload = () => {
                    const scale = 3;
                    const canvas = document.createElement("canvas");
                    canvas.width = vb.width * scale;
                    canvas.height = vb.height * scale;
                    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                    const a = document.createElement("a");
                    a.download = "ontology-game-map.png";
                    a.href = canvas.toDataURL("image/png");
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                };
                img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
            };

            const handleConfirmShare = () => {
                if (pendingShareData) persistSharedCycle(pendingShareData.features, pendingShareData.archetype);
                setPendingShareData(null);
                setPhase("phase6-done");
            };

            const handleDeclineShare = () => {
                setPendingShareData(null);
                setPhase("phase6-done");
            };

            // Flow Forward / Tempering Wisdom default to being the SAME charge exponentially
            // unfolding through the wuxing cycle. The signal that it's actually a different,
            // divergent charge is the same somatic test the whole game already trusts: it
            // doesn't shift. So this is only offered at Phase 7 when we got there via a
            // flow-forward/tempering transition (not the primary thread or an explicit branch,
            // which already know what charge they belong to). Deferred threads from the old
            // charge are left alone here — they keep circulating through afterThreadResolved
            // regardless of which charge is currently open.
            const handleDifferentChargeEmerging = () => {
                setDivergentChargeCount(prev => prev + 1);
                setPhase("phase7-charge-state");
            };

            // A divergent charge isn't routed from anything — there's no sheng/ke transition
            // to read a starting state off, so the player is asked directly. Per the hostile
            // review (Magenta + Orange), whatever they pick does NOT skip the felt-state
            // check later — it still goes through phase5's full hold-and-notice, same as
            // every other thread. This answer is just where it starts, not a verified state.
            const handleChargeStateChosen = (state) => {
                setIncomingState(state);
                setPrimaryChannel(null);
                setPrimaryFace(null);
                setResolvedThreads([]);
                setPhase("phase5");
            };

            const handleNewCycle = () => {
                beginBodyScan();
                setPhase("phase1");
                setSelectedChannel(null);
                setSelectedFace(null);
                setCurrentStem("");
                setUserBelief("");
                setShifted(null);
                setPhase3Context(null);
                setPreviousChannel(null);
                setPrimaryChannel(null);
                setPrimaryFace(null);
                setResolvedThreads([]);
                setDeferredThreads([]);
                setRecheckTarget(null);
                setDeeperStems([]);
                setDeeperState(null);
                setDeeperVerdicts([]);
                setDeeperSelfAuthorText("");
                setHeldBeliefs([]);
                setDeeperShifted(null);
                setDeeperOutcome(null);
                setDeadEndCount(0);
                setDivergentChargeCount(0);
                setDeferCount(0);
                moveCountRef.current = 0;
                setShareWithCoach(false);
                setPendingShareData(null);
                setCoachShareCode(null);
                setRoute([]);
                setBlockStack([]);
                setTrailhead(null);
                setStartWords("");
                setLastReturn(null);
            };

            // V2 UI Spec (Sept 26 2026), Magenta's veto made concrete: marks that this
            // session's exit was the acute-distress off-ramp, so the entry screen's Open
            // Threads Ledger (which otherwise reads as "here's what's still owed") stays
            // suppressed on return, until a cycle completes normally again (see
            // persistCompletedCycle, which clears this flag). Fire-and-forget and
            // best-effort, same guarantee as every other Mode A write — never awaited,
            // never blocks the stop screen, never surfaces a failure. Read-then-write
            // (not a bare .set) so it never clobbers channelsSatisfied/openThreads/etc.
            // that are already sitting in the profile.
            const markLastExitDistress = async () => {
                const p = await getPersistence();
                if (!p) return;
                try {
                    const snap = await p.profileRef.get();
                    const prior = snap.exists ? snap.data() : {};
                    await p.profileRef.set({ ...prior, lastExitDistress: true });
                } catch (e) {
                    // Best-effort, same as everywhere else.
                }
            };

            // The acute-distress off-ramp (ICA Productization Strategy doc, "Not an ICA:
            // the Acute-Distress User"; Simulated Playtesting doc, "the missing safety
            // floor" — Sept 23, 2026). Every existing exit from a non-shifting block asks
            // for more: a precision question, another attempt, or naming a new charge.
            // This is the one exit that asks for nothing and diagnoses nothing — it's
            // offered unconditionally at Phase 7, not gated on any signal of distress,
            // since the game has no way to detect that and shouldn't pretend to.
            const handleStopHere = () => {
                setStopReason("distress");
                // Demo Mode never touches real persistence, same guard as everywhere else.
                if (!demoMode) markLastExitDistress();
                setPhase("phase-stopped");
            };

            // The non-failing counterpart (UX polish bundle, see the faceLog-adjacent comment
            // above): same destination screen, same full ledger clear on leaving, different reason
            // recorded so the copy doesn't reach for crisis-service language a player who is simply
            // not there yet today doesn't need.
            const handleStopForToday = () => {
                setStopReason("done-for-today");
                setPhase("phase-stopped");
            };

            // The third exit (6-Faces design review, Sept 26 2026): something outside the
            // practice needs the player right now. Deliberately asks nothing and clears
            // nothing -- setPhase alone is the whole mechanism, everything else (channel,
            // face, held/deferred threads, whatever's mid-belief-report) stays exactly as
            // it was. Reachable from any in-progress phase via the always-present
            // #pause-link (rendered imperatively below, same technique as the demo
            // banner, so it never has to be threaded through every phase branch).
            const handlePauseHere = () => {
                setPausedFromPhase(phase);
                setPhase("phase-paused");
            };

            const handleResumeFromPause = () => {
                setPhase(pausedFromPhase || "entry");
                setPausedFromPhase(null);
            };

            // Leaving the stop screen clears the charge/thread ledger the same way a new
            // cycle would (this thread isn't carried into a future session) but, unlike
            // handleNewCycle, does NOT roll a fresh opening practice or push the player
            // into Phase 1 — handing someone who just said "stop" a brand-new ritual to
            // perform would defeat the point. It returns to the entry screen and stops.
            const handleLeaveStopped = () => {
                setPhase("entry");
                setSelectedChannel(null);
                setSelectedFace(null);
                setCurrentStem("");
                setUserBelief("");
                setShifted(null);
                setPhase3Context(null);
                setPreviousChannel(null);
                setPrimaryChannel(null);
                setPrimaryFace(null);
                setResolvedThreads([]);
                setDeferredThreads([]);
                setRecheckTarget(null);
                setDeeperStems([]);
                setDeeperState(null);
                setDeeperVerdicts([]);
                setDeeperSelfAuthorText("");
                setHeldBeliefs([]);
                setDeeperShifted(null);
                setDeeperOutcome(null);
                setStopReason(null);
                setDeadEndCount(0);
                setDivergentChargeCount(0);
                setDeferCount(0);
                moveCountRef.current = 0;
                setShareWithCoach(false);
                setPendingShareData(null);
                setCoachShareCode(null);
                setRoute([]);
                setBlockStack([]);
                setTrailhead(null);
                setStartWords("");
                setLastReturn(null);
            };

            // Coach view (Mode B, read side). Reads a SHARED path — data/coach-shared/
            // isn't under data/users/ — so this only ever needs db, never a resolved
            // viewer identity; a coach who has never played the game themselves can
            // still read a code someone gave them. Best-effort, same redaction rule as
            // everywhere else in Mode A/B: the cycle records this reads never carry
            // belief text, only channel/face/archetype/counts.
            const handleCoachViewSubmit = async () => {
                const code = coachCodeInput.trim();
                if (!code) return;
                setCoachViewLoading(true);
                setCoachViewError(null);
                setCoachSummary(null);
                setCoachCycles(null);
                const portable = decodePortableCoachCode(code);
                if (portable) {
                    setCoachSummary(portable.summary);
                    setCoachCycles(portable.cycles);
                    setCoachViewCode(code);
                    setCoachViewLoading(false);
                    return;
                }
                const db = await getDb();
                if (!db) {
                    setCoachViewLoading(false);
                    setCoachViewError("This view only works when opened as a real claude.ai artifact link — it can't reach the shared data store here.");
                    return;
                }
                try {
                    const profileRef = db.doc(`data/coach-shared/${code}/profile`);
                    const snap = await profileRef.get();
                    if (!snap.exists) {
                        setCoachViewCode(code);
                        setCoachViewLoading(false);
                        setCoachViewError("No shared summary found for that code yet — either it's mistyped, or that player hasn't shared a cycle.");
                        return;
                    }
                    setCoachSummary(snap.data());
                    const cyclesSnap = await profileRef.collection("cycles").orderBy("completedAt", "desc").limit(50).get();
                    setCoachCycles(cyclesSnap.docs.map(d => d.data()));
                    setCoachViewCode(code);
                } catch (e) {
                    setCoachViewError("Something went wrong loading that summary.");
                } finally {
                    setCoachViewLoading(false);
                }
            };

            const handleCoachModeBack = () => {
                setCoachMode(false);
                setCoachCodeInput("");
                setCoachViewCode(null);
                setCoachSummary(null);
                setCoachCycles(null);
                setCoachViewError(null);
            };

            // ---------- Demo Mode ----------
            // Reuses the real entry/leave handlers rather than inventing parallel reset
            // logic — starting or bailing out of a demo is just "leave the game stopped"
            // plus toggling the demo flags, so it can never drift from what a real reset
            // does. window.__forcePracticeId (the existing test-only override, see
            // beginBodyScan) is what keeps every body-scan screen in the demo on the
            // plain "Simple Breaths" form instead of one of the other five random rituals.
            const startDemo = () => {
                handleLeaveStopped();
                window.__forcePracticeId = "breaths";
                setDemoStep(0);
                setDemoMode(true);
            };

            // A jump point (Onboarding Audit, Sept 26 2026, #3/#9): start the script over
            // and fast-forward through every step before `targetIndex` by really clicking
            // each one's real target, then stop and let the player take over normally from
            // there. See the auto-advance block in the render effect below.
            const jumpToStep = (targetIndex) => {
                startDemo();
                jumpTargetRef.current = targetIndex;
            };

            // Bail out mid-script: full reset back to the entry screen, same as leaving
            // any real game stopped.
            const exitDemo = () => {
                window.__forcePracticeId = null;
                jumpTargetRef.current = null;
                if (autoAdvanceTimerRef.current) { clearTimeout(autoAdvanceTimerRef.current); autoAdvanceTimerRef.current = null; }
                setDemoMode(false);
                setDemoStep(0);
                handleLeaveStopped();
            };

            // Reached the end of the script on its own terms (phase6-done): just drop
            // out of demo mode and hand the wheel over. The completed demo cycle is left
            // exactly where it is — persistCompletedCycle already skipped it (guarded on
            // demoMode in handleCompleteCycle) — and the player continues for real from
            // here, e.g. by clicking the game's own "Start a New Cycle" button.
            const finishDemo = () => {
                window.__forcePracticeId = null;
                jumpTargetRef.current = null;
                if (autoAdvanceTimerRef.current) { clearTimeout(autoAdvanceTimerRef.current); autoAdvanceTimerRef.current = null; }
                setDemoMode(false);
                setDemoStep(0);
            };

            // "Skip this step" (Onboarding Audit #3): rather than advancing demoStep on
            // its own — which would desync it from the game's real phase, since nothing
            // would have actually fired the step's handler — this performs the real click
            // on the player's behalf. The demo click-catcher below still sees it (a real
            // DOM click fires the same either way) and advances the script normally.
            const skipStep = () => {
                const step = DEMO_SCRIPT[demoStepRef.current];
                if (!step) return;
                const el = document.querySelector(`[data-demo-key="${step.key}"]`);
                if (el && !el.disabled) el.click();
            };

            const demoModeRef = React.useRef(false);
            const demoStepRef = React.useRef(0);
            const jumpTargetRef = React.useRef(null);
            const autoAdvanceTimerRef = React.useRef(null);
            demoModeRef.current = demoMode;
            demoStepRef.current = demoStep;

            // Mount-once capture-phase listener: advances the script when the player
            // clicks the element the current step is targeting. Deliberately never calls
            // preventDefault/stopPropagation, so the real onClick underneath still fires
            // exactly as it would in normal play — this only ever watches, never redirects.
            React.useEffect(() => {
                const onDemoClick = (e) => {
                    if (!demoModeRef.current) return;
                    const step = DEMO_SCRIPT[demoStepRef.current];
                    if (!step) return;
                    if (e.target.closest(`[data-demo-key="${step.key}"]`)) {
                        setDemoStep((s) => s + 1);
                    }
                };
                document.addEventListener("click", onDemoClick, true);
                return () => document.removeEventListener("click", onDemoClick, true);
            }, []);

            const DEMO_INTERACTIVE_SELECTOR = ".card .option-card, .card button, .card a, .card label";

            const clearDemoOverlay = () => {
                document.querySelectorAll(".demo-target").forEach((el) => el.classList.remove("demo-target"));
                document.querySelectorAll(".demo-dim").forEach((el) => {
                    el.classList.remove("demo-dim");
                    el.style.pointerEvents = "";
                });
            };

            const removeDemoBanner = () => {
                const existing = document.getElementById("demo-banner");
                if (existing) existing.remove();
                document.body.style.paddingBottom = "";
            };

            const renderDemoBanner = (opts) => {
                let banner = document.getElementById("demo-banner");
                if (!banner) {
                    banner = document.createElement("div");
                    banner.id = "demo-banner";
                    document.body.appendChild(banner);
                }
                banner.innerHTML = "";
                const progress = document.createElement("div");
                progress.className = "demo-banner-progress";
                progress.textContent = opts.progress;
                banner.appendChild(progress);
                const title = document.createElement("div");
                title.className = "demo-banner-title";
                title.textContent = opts.title;
                banner.appendChild(title);
                const narration = document.createElement("div");
                narration.className = "demo-banner-narration";
                narration.textContent = opts.narration;
                banner.appendChild(narration);
                const actions = document.createElement("div");
                actions.className = "demo-banner-actions";
                opts.actions.forEach((a) => {
                    const btn = document.createElement("button");
                    btn.className = a.className || "demo-banner-btn";
                    btn.textContent = a.label;
                    btn.onclick = a.onClick;
                    actions.appendChild(btn);
                });
                banner.appendChild(actions);
                // The banner is fixed at the bottom of the viewport, which would
                // otherwise sit on top of (and swallow clicks meant for) whatever's at
                // the bottom of a tall card, e.g. Phase 1's "This is it" button. Reserve
                // that space at the bottom of the page instead so nothing real is ever
                // hidden underneath it.
                document.body.style.paddingBottom = `${banner.offsetHeight + 32}px`;
            };

            // Runs after every render (no dependency array — the render-phase if-chain
            // below returns a different JSX tree per phase, so this is the one place that
            // reliably runs regardless of which branch rendered, same pattern the
            // window.__gameState mirror above already relies on). Applies this render's
            // highlight/dim/banner state to the DOM it just committed.
            React.useEffect(() => {
                if (!demoMode) {
                    clearDemoOverlay();
                    removeDemoBanner();
                    return;
                }

                if (demoStep >= DEMO_SCRIPT.length) {
                    clearDemoOverlay();
                    renderDemoBanner({
                        progress: "Demo complete",
                        title: "That's the whole loop",
                        narration: "Core cycle, both wuxing moves, a named second thread, and Level 2's Go Deeper. From here you're on your own — keep going with your own data, or exit back to the start.",
                        actions: [
                            { label: "Continue on my own", className: "demo-banner-btn primary", onClick: () => finishDemo() },
                            { label: "Exit demo", className: "demo-banner-btn", onClick: () => exitDemo() },
                        ],
                    });
                    return;
                }

                const step = DEMO_SCRIPT[demoStep];

                if (step.prefill && !location) {
                    setLocation(step.prefill.location);
                    setTexture(step.prefill.texture);
                }

                clearDemoOverlay();
                const target = document.querySelector(`[data-demo-key="${step.key}"]`);
                if (target) {
                    target.classList.add("demo-target");
                    document.querySelectorAll(DEMO_INTERACTIVE_SELECTOR).forEach((el) => {
                        if (el !== target && !target.contains(el) && !el.contains(target)) {
                            el.classList.add("demo-dim");
                            el.style.pointerEvents = "none";
                        }
                    });
                }

                // Jump-to-section: fast-forward by replaying real clicks on each
                // intervening step's real target, reusing the same click-catcher that
                // drives an ordinary manual walkthrough. Never simulates state.
                if (autoAdvanceTimerRef.current) {
                    clearTimeout(autoAdvanceTimerRef.current);
                    autoAdvanceTimerRef.current = null;
                }
                if (jumpTargetRef.current !== null) {
                    if (demoStep >= jumpTargetRef.current) {
                        jumpTargetRef.current = null;
                    } else if (target && !target.disabled) {
                        autoAdvanceTimerRef.current = setTimeout(() => {
                            autoAdvanceTimerRef.current = null;
                            target.click();
                        }, 150);
                    }
                }

                renderDemoBanner({
                    progress: `Step ${demoStep + 1} of ${DEMO_SCRIPT.length}`,
                    title: step.title,
                    narration: step.narration,
                    actions: [
                        { label: "Skip this step", className: "demo-banner-btn", onClick: () => skipStep() },
                        { label: "Exit demo", className: "demo-banner-btn", onClick: () => exitDemo() },
                    ],
                });
            });

            // Always-reachable pause exit, rendered outside the React tree (same
            // imperative-DOM technique as the demo banner above) so it never has to be
            // threaded through all ~28 phase branches individually. Rebuilt fresh every
            // render -- cheap for one small link -- so its onclick always closes over the
            // CURRENT render's handlePauseHere/phase rather than a stale one. Hidden on
            // entry (nothing to pause), phase-stopped and phase-paused themselves, and
            // during a demo run (nothing real to interrupt).
            const PAUSE_HIDDEN_PHASES = ["entry", "phase-stopped", "phase-paused"];
            React.useEffect(() => {
                const existing = document.getElementById("pause-link");
                if (existing) existing.remove();
                if (demoMode || PAUSE_HIDDEN_PHASES.includes(phase)) return;
                const link = document.createElement("a");
                link.id = "pause-link";
                link.href = "#";
                link.textContent = "Something needs me right now — pause here";
                link.onclick = (e) => { e.preventDefault(); handlePauseHere(); };
                document.body.appendChild(link);
                return () => {
                    const el = document.getElementById("pause-link");
                    if (el) el.remove();
                };
            });

            // While a block is being worked, a bar at the top says which step the player will
            // go back to, so the way back stays visible however deep the blocks go (the
            // Shaman's risk in the council pass). Imperative, like the pause link above.
            React.useEffect(() => {
                // Council pass 2 (oag-trailhead) widened it into the trip's trail: the first
                // line names where the trip began whenever one is under way, and the second
                // line appears inside a block. Two lines at most (the Challenger's limit).
                const existing = document.getElementById("oag-trail");
                if (existing) existing.remove();
                const hidden = ["entry", "phase-paused", "phase-stopped", "phase6-done"].includes(phase) || coachMode;
                if (hidden || (!trailhead && blockStack.length === 0)) return;
                const bar = document.createElement("div");
                bar.id = "oag-trail";
                if (trailhead) {
                    const start = document.createElement("div");
                    start.id = "trail-start";
                    start.textContent = `Where you started: ${describeCharge(trailhead)}` + (trailhead.words ? `, “${trailhead.words}”.` : ".");
                    bar.appendChild(start);
                }
                if (blockStack.length > 0) {
                    const steps = blockStack.map(f => WAVE_STEP_LABEL[f.step] || f.step);
                    const newest = steps[steps.length - 1];
                    const earlier = steps.slice(0, -1).reverse();
                    const top = blockStack[blockStack.length - 1];
                    const words = (top.words || "").trim();
                    const line = document.createElement("div");
                    line.id = "block-trail";
                    line.textContent = `Working what got in the way of ${newest}` + (words ? ` (“${words}”)` : "")
                        + `. When it shifts, you go back to ${newest}`
                        + (earlier.length ? `, then to ${earlier.join(", then to ")}.` : ".");
                    bar.appendChild(line);
                }
                document.body.appendChild(bar);
                return () => {
                    const el = document.getElementById("oag-trail");
                    if (el) el.remove();
                };
            });

            if (coachMode) {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">COACH VIEW</div>
                            <h2>Shared Practice Summary</h2>
                            <p className="prompt">{ON_SITE ? "Paste the code your client sent you." : "Enter the code a player shared with you."} This shows only what they chose to share — channels, faces, how sessions tend to shape up — never their held beliefs.</p>
                            <div className="mini-section" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                <input
                                    type="text"
                                    value={coachCodeInput}
                                    onChange={(e) => setCoachCodeInput(e.target.value)}
                                    placeholder="Paste the code here"
                                    style={{ flex: 1, minWidth: "200px" }}
                                />
                                <button className="primary" onClick={handleCoachViewSubmit} disabled={coachViewLoading}>
                                    {coachViewLoading ? "Loading..." : "View Summary"}
                                </button>
                            </div>
                            {coachViewError && (
                                <p className="prompt" style={{ color: "#e88", marginTop: "0.5rem" }}>{coachViewError}</p>
                            )}
                            {coachSummary && (
                                <div className="mini-section" style={{ marginTop: "1rem" }}>
                                    <p><strong>{coachSummary.totalCycles}</strong> cycle{coachSummary.totalCycles === 1 ? "" : "s"} shared
                                        {topOf(coachSummary.channelCounts) && <> — most often in {topOf(coachSummary.channelCounts)}</>}
                                        {topOf(coachSummary.faceCounts) && <>, landing on {topOf(coachSummary.faceCounts)} most</>}.
                                    </p>
                                    {coachCycles && coachCycles.length > 0 && (
                                        <div style={{ marginTop: "0.75rem" }}>
                                            {coachCycles.map((c, idx) => (
                                                <p key={idx} style={{ fontSize: "0.85rem", opacity: 0.85, marginTop: idx === 0 ? 0 : "0.35rem" }}>
                                                    {new Date(c.completedAt).toLocaleDateString()} — {c.channel} ({c.face}) — {c.archetype}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="button-group" style={{ marginTop: "1.5rem" }}>
                                <button className="secondary" onClick={handleCoachModeBack}>Back</button>
                            </div>
                        </div>
                        {debugPanel}
                    </div>
                );
            }

            if (phase === "entry") {
                return (
                    <div className="container">
                        <div className="card entry-ritual">
                            <h1>Ontology Alchemy Game</h1>
                            {/* Wuxing Mythic Framing (V2 UI Spec 2, Epic Meaning) — names the
                                five-element cycle directly instead of describing the game
                                mechanically. The math (shengCycle/keCycle) already existed;
                                only the words changed. The Safety Container line right below
                                is untouched on purpose — this narrates structure, never
                                overrides the disclaimer beneath it. */}
                            <p><strong>Five elements move through you in a fixed order — what generates, what restrains. This game finds where you are in that cycle and lets your body finish the turn.</strong></p>
                            <div className="mini-section">
                                <p><strong>Safety Container:</strong> This is a practice space. Nothing you discover here is permanent or true about you. You are exploring how your body knows things.</p>
                                <p><strong>What You'll Do:</strong> Find a block in your body. Name it. Hold a true belief about it. See if it shifts. Navigate through emotional channels.</p>
                                <p><strong>How It Works:</strong> Seven phases per cycle. No "winning." The game is infinite; you cycle as many times as you want.</p>
                                <p><strong>W.A.V.E.:</strong> Breathe through each step. Welcome what's here, then Acknowledge it, Allow it, Accept it and Appreciate it, as far as you honestly can. Validate your body's right to feel it, and Exhale. If something gets in the way of a step, you can work that block and come back to the step. You can open every body scan with it, and choose it again whenever you hold a belief.</p>
                            </div>
                            {patternSummary && patternSummary.totalCycles > 0 && (
                                // Mode A "welcome back" reflection (Cross-Session Persistence
                                // Spec, "Mode A"). Hidden outright — never a loading spinner —
                                // until this viewer's own rollup doc actually resolves with
                                // data in it, so a first-time viewer or a page with no db/user
                                // grant sees exactly the entry screen that always existed.
                                <div className="mini-section">
                                    <p>
                                        Welcome back. You've completed {patternSummary.totalCycles} cycle{patternSummary.totalCycles === 1 ? "" : "s"} here
                                        {topOf(patternSummary.channelCounts) && <> — most often in {topOf(patternSummary.channelCounts)}</>}
                                        {topOf(patternSummary.faceCounts) && <>, landing on {topOf(patternSummary.faceCounts)} most</>}.
                                    </p>
                                    {/* The Wuxing Wheel (V2 UI Spec, Sept 26 2026) — same gating as
                                        the welcome-back line above, since it's reflecting the same
                                        rollup doc. Turns "experience all 5 satisfaction states" from
                                        an implicit design intent into something visible to pursue. */}
                                    <WuxingWheel channelsSatisfied={patternSummary.channelsSatisfied} />
                                </div>
                            )}
                            {patternSummary && patternSummary.openThreads && patternSummary.openThreads.length > 0 && !patternSummary.lastExitDistress && (
                                // The Open Threads Ledger (V2 UI Spec, honest Loss/Avoidance) —
                                // suppressed whenever lastExitDistress is set (Magenta's veto,
                                // set by markLastExitDistress on the Stop-Here off-ramp and
                                // cleared the next time a cycle completes normally). Framed as
                                // availability, never debt or a count-up warning.
                                <div className="mini-section open-threads-ledger">
                                    <p>
                                        {patternSummary.openThreads.length} thread{patternSummary.openThreads.length === 1 ? "" : "s"} from earlier sessions {patternSummary.openThreads.length === 1 ? "is" : "are"} still open, whenever you're ready:
                                    </p>
                                    {patternSummary.openThreads.map((t, i) => (
                                        <p key={i} className="open-thread-line">{t.channel} ({t.face})</p>
                                    ))}
                                </div>
                            )}
                            <button className="primary" data-demo-key="begin-practice" onClick={handleEntryRitual} style={{ marginTop: "1.5rem" }}>
                                {preferredPracticeId === "wave" ? "Begin Practice with W.A.V.E." : "Begin Practice"}
                            </button>
                            {preferredPracticeId !== "wave" && (
                                <button className="secondary" data-demo-key="begin-with-wave" onClick={handleEntryWithWave} style={{ marginTop: "0.75rem" }}>
                                    Begin with W.A.V.E.
                                </button>
                            )}
                            <p className="prompt" style={{ marginTop: "1rem" }}>
                                <a href="#" onClick={(e) => { e.preventDefault(); startDemo(); }} style={{ fontSize: "0.85rem", opacity: 0.75 }}>
                                    Try a guided demo first
                                </a>
                                {" · "}
                                <a href="#" onClick={(e) => { e.preventDefault(); setCoachMode(true); }} style={{ fontSize: "0.85rem", opacity: 0.75 }}>
                                    Coach? View a shared summary
                                </a>
                            </p>
                            <p className="prompt" style={{ marginTop: "0.35rem", fontSize: "0.78rem", opacity: 0.6 }}>
                                The demo walks the real buttons through a full cycle — {DEMO_SCRIPT.length} steps, about 5 minutes, no data saved. Jump straight to:{" "}
                                {DEMO_JUMP_POINTS.map((p, i) => (
                                    <React.Fragment key={p.label}>
                                        {i > 0 && " · "}
                                        <a href="#" onClick={(e) => { e.preventDefault(); jumpToStep(p.index); }}>{p.label}</a>
                                    </React.Fragment>
                                ))}
                            </p>
                            {!ON_SITE && <p className="prompt" style={{ marginTop: "0.6rem", fontSize: "0.78rem", opacity: 0.55 }}>
                                Want the reading first? <a href="https://claude.ai/artifact/F9zYnkVSz17avjCKywVWVT" target="_blank" rel="noopener noreferrer">Interactive Walkthrough</a>
                                {" · "}
                                <a href="https://claude.ai/artifact/ca17c383-b838-4307-babf-673c8c1af3cc" target="_blank" rel="noopener noreferrer">Coach's Walkthrough</a>
                            </p>}
                        </div>
                        {debugPanel}
                    </div>
                );
            }

            // Shared across Phase 1 and Phase-Flow-Locate: whichever of the six opening
            // practices got rolled, every one of them ends by producing the same
            // location + texture pair. A practice only gates the location/texture fields
            // behind its own ritual when it genuinely needs a prior step (Happy Apple's
            // naming step, Grounding's five prompts) — everything else shows them right away.
            const isScanReady = () => {
                if (!currentPractice) return true;
                if (currentPractice.kind === "happy-apple") return happyAppleStep === "scan";
                if (currentPractice.kind === "grounding") return groundingAnswers.every(a => a.trim() !== "");
                if (currentPractice.kind === "wave") return waveStep === "scan";
                return true;
            };

            const weatherLabels = {
                constriction: "A storm brewing (tight, squeezed)",
                numbness: "Fog rolled in (absent, numb)",
                tension: "Wind picking up (tight, drawn, pulled)",
                strength: "Clear and still (solid, grounded, held)",
                other: "Something else in the sky (describe below)"
            };

            // One W.A.V.E. for both places it runs: the Phase 1 opener ("opener") and the
            // Open Up picker ("open"). Each step is one breath; the continue button shows
            // when the exhale ends. Any step can be blocked, and from Allow on the player can
            // stop at the rung they reached, which still completes the W.A.V.E.
            const renderWaveStep = (where) => {
                const opener = where === "opener";
                const step = opener ? waveStep : openWaveStep;
                const setStep = opener ? setWaveStep : setOpenWaveStep;
                const setLevel = opener ? setWaveLevel : setOpenWaveLevel;
                const onExhale = opener
                    ? (alignment) => { setWaveAlignment(alignment); setWaveStep("scan"); }
                    : handleOpenWaveExhale;
                const def = WAVE_STEPS.find(st => st.id === step) || WAVE_STEPS[0];
                const prompt = def.id === "welcome" && opener && scanContext === "block" ? def.promptBlock
                    : def.id === "welcome" && opener && scanContext === "continuation" ? def.promptContinuation
                    : def.prompt;
                const rungs = WAVE_STEPS.filter(st => st.rung).map(st => st.id);
                const rungIndex = rungs.indexOf(def.id);
                const lastRungReached = rungIndex > 0 ? rungs[rungIndex - 1] : null;
                const back = lastReturn && lastReturn.step === def.id && lastReturn.where === where ? lastReturn : null;
                const note = appreciateNotes[where] || "";
                const onContinue = () => {
                    if (def.id === "appreciate" && note.trim()) {
                        logRoute({ kind: "appreciate", where, channel: selectedChannel || null, text: note.trim() });
                        setAppreciateNotes(prev => ({ ...prev, [where]: "" }));
                    }
                    setLastReturn(null);
                    if (def.rung) setLevel(def.id);
                    setStep(nextWaveStep(def.id));
                };
                return (
                    <div className="wave-step" data-wave-step={def.id} data-wave-where={where}>
                        <p className="wave-trail">
                            {WAVE_STEPS.map((st, i) => (
                                <React.Fragment key={st.id}>
                                    {i > 0 && <span className="wave-trail-sep"> · </span>}
                                    <span className={st.id === def.id ? "wave-trail-current" : undefined}>{st.label}</span>
                                </React.Fragment>
                            ))}
                        </p>
                        <h3 className="wave-step-title">{def.label}</h3>
                        {back && (
                            // Back from a block (oag-block-carry): name what was in the way,
                            // and ask its size again (oag-block-size).
                            <div className="mini-section block-came-back" data-block-came-back={def.id}>
                                <p>You're back at {def.label}.{back.words ? <> What was in the way: <em>“{back.words}”</em>.</> : ""}{back.sizeBefore != null ? ` It was ${back.sizeBefore}, about the size of ${sizeWord(back.sizeBefore)}.` : ""}</p>
                                <p style={{ marginTop: "0.4rem" }}>How big is it now? You can leave this.</p>
                                <SizeSlider value={back.sizeAfter} onChange={setReturnSize} dataKey="after" />
                            </div>
                        )}
                        <p className="prompt">{prompt}</p>
                        {def.id === "appreciate" && (
                            <div className="appreciate-input">
                                <textarea data-appreciate-input value={note}
                                          onChange={(e) => { const v = e.target.value; setAppreciateNotes(prev => ({ ...prev, [where]: v })); }}
                                          placeholder="What can you appreciate about what showed up? (optional)" />
                                <p className="prompt" style={{ fontSize: "0.82rem", opacity: 0.75 }}>You may not find anything to appreciate today, and that's all right. You can go on without writing.</p>
                            </div>
                        )}
                        <BreathPacer key={`${where}-${def.id}-${blockStack.length}`}>
                            {def.id === "exhale" ? (
                                <>
                                    <div className="option-card" data-wave-exhale="stay" onClick={() => { setLastReturn(null); onExhale("stay"); }}>
                                        <strong>Yes, let it stay</strong>
                                        <p>It's serving me. I'll work with it as it is.</p>
                                    </div>
                                    <div className="option-card" data-wave-exhale="release" onClick={() => { setLastReturn(null); onExhale("release"); }}>
                                        <strong>No, exhale and release</strong>
                                        <p>Breathe it out and see what's left behind.</p>
                                    </div>
                                </>
                            ) : (
                                <div className="button-group">
                                    <button className="primary" data-wave-continue onClick={onContinue}>
                                        {def.button}
                                    </button>
                                </div>
                            )}
                        </BreathPacer>
                        <p className="wave-side-links">
                            {lastRungReached && (
                                <>
                                    <a href="#" data-wave-stop onClick={(e) => { e.preventDefault(); setLastReturn(null); setLevel(lastRungReached); setStep("validate"); }}>
                                        This is as far as I can honestly go today
                                    </a>
                                    {" · "}
                                </>
                            )}
                            <a href="#" data-wave-block onClick={(e) => { e.preventDefault(); openBlock(where, def.id); }}>
                                Something's in the way
                            </a>
                        </p>
                    </div>
                );
            };

            const renderOpeningRitual = () => {
                const practice = currentPractice || openingPractices[0];
                const textureOptions = practice.kind === "weather"
                    ? weatherLabels
                    : {
                        constriction: "Constriction (tight, squeezed)",
                        numbness: "Numbness (absent, numb)",
                        tension: "Tension (tight, drawn, pulled)",
                        strength: "Strength (solid, grounded, held)",
                        other: "Other (describe below)"
                    };

                const ritualIntro = (
                    <div className="mini-section">
                        <p><strong>Opening practice — {practice.name}</strong></p>
                        <p style={{ marginTop: "0.35rem" }}>{practice.blurb[scanContext] || practice.blurb.first}</p>
                        {practice.kind !== "wave" && !demoMode && (
                            <p style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                                <a href="#" data-demo-key="switch-to-wave" onClick={(e) => { e.preventDefault(); handleSwitchToWave(); }} style={{ color: "#64c8ff" }}>
                                    Use W.A.V.E. instead
                                </a>
                            </p>
                        )}
                    </div>
                );

                if (practice.kind === "happy-apple" && happyAppleStep === "want") {
                    return (
                        <>
                            {ritualIntro}
                            <p className="prompt">What do you want right now?</p>
                            <input
                                type="text"
                                placeholder="Name the thing, plainly"
                                value={wantedThing}
                                onChange={(e) => setWantedThing(e.target.value)}
                            />
                            <div className="button-group">
                                <button className="primary" onClick={() => setHappyAppleStep("scan")} disabled={!wantedThing.trim()}>
                                    I can feel wanting this
                                </button>
                            </div>
                        </>
                    );
                }

                if (practice.kind === "wave" && waveStep !== "scan") {
                    return (
                        <>
                            {ritualIntro}
                            {renderWaveStep("opener")}
                        </>
                    );
                }

                if (practice.kind === "grounding" && !isScanReady()) {
                    const prompts = [
                        "Name something you see (5th).",
                        "Name something you see (4th).",
                        "Name something you see (3rd).",
                        "Name something you can touch.",
                        "Name something you can hear."
                    ];
                    return (
                        <>
                            {ritualIntro}
                            {prompts.map((p, i) => (
                                <input
                                    key={i}
                                    type="text"
                                    placeholder={p}
                                    value={groundingAnswers[i]}
                                    onChange={(e) => {
                                        const next = [...groundingAnswers];
                                        next[i] = e.target.value;
                                        setGroundingAnswers(next);
                                    }}
                                />
                            ))}
                        </>
                    );
                }

                return (
                    <>
                        {ritualIntro}
                        {practice.kind === "happy-apple" && (
                            <p className="prompt">You named: "{wantedThing}." Picture it going into a bag beside you. Hands empty now — where's the block to reaching for it?</p>
                        )}
                        {practice.kind === "grounding" && (
                            <p className="prompt">Senses landed. Now — where has your attention settled in the body?</p>
                        )}
                        {practice.kind === "pendulation" && (
                            <>
                                <p className="prompt">Where's a place that feels more okay right now, even a little?</p>
                                <input
                                    type="text"
                                    placeholder="e.g., 'my feet', 'my hands'"
                                    value={resourceLocation}
                                    onChange={(e) => setResourceLocation(e.target.value)}
                                />
                                <p className="prompt">Now, where's the activation?</p>
                            </>
                        )}
                        {practice.kind === "wave" && (
                            <p className="prompt">
                                {waveAlignment === "release"
                                    ? "You exhaled it out. What's left behind — where do you feel it now?"
                                    : "You let it stay. Where does it live in the body?"}
                            </p>
                        )}
                        {!["happy-apple", "grounding", "pendulation", "wave"].includes(practice.kind) && (
                            <p className="prompt">Scan your body for a place that has texture. Where is it?</p>
                        )}
                        <input
                            type="text"
                            placeholder="e.g., 'my throat', 'my solar plexus', 'behind my sternum'"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                        <p className="prompt">What is the texture?</p>
                        <div className="texture-select-row">
                            <select value={texture} onChange={(e) => setTexture(e.target.value)}>
                                <option value="">Choose one...</option>
                                <option value="constriction">{textureOptions.constriction}</option>
                                <option value="numbness">{textureOptions.numbness}</option>
                                <option value="tension">{textureOptions.tension}</option>
                                <option value="strength">{textureOptions.strength}</option>
                                <option value="other">{textureOptions.other}</option>
                            </select>
                            {texture && <TextureGlyph texture={texture} size={32} />}
                        </div>
                        {texture === "other" && (
                            <input
                                type="text"
                                placeholder="Describe the texture in your own words"
                            />
                        )}
                    </>
                );
            };

            // The block screen (oag-wave-blocks, oag-wave-depth). Wendell's ruling of 9
            // September 2026: "We shouldn't assume a block, but if there IS a block we
            // should assume self-sabotage, with the given choice to skip if that's not a
            // frame that works for the user."
            if (phase === "phase-wave-block") {
                const frame = blockStack[blockStack.length - 1];
                const stepLabel = frame ? (WAVE_STEP_LABEL[frame.step] || frame.step) : "this step";
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">SOMETHING'S IN THE WAY</div>
                            <h2>Something is in the way of {stepLabel}.</h2>
                            {frame && (
                                // Exactly what was blocked (oag-block-carry): the step, and the
                                // charge the player was with when it got blocked.
                                <p className="prompt" data-block-what>
                                    {describeCharge(frame.charge)
                                        ? <>You were at {stepLabel} with {describeCharge(frame.charge)}.</>
                                        : <>You were at {stepLabel}, with whatever had come up to be welcomed.</>}
                                </p>
                            )}
                            {frame && (
                                <div className="mini-section block-details">
                                    <p><strong>What's in the way?</strong> Say it in your own words if you can. You can leave this blank.</p>
                                    <input type="text" data-block-words value={frame.words || ""}
                                           onChange={(e) => updateTopFrame({ words: e.target.value })}
                                           placeholder="e.g. 'I don't want to accept that it happened'" />
                                    <p style={{ marginTop: "0.6rem" }}><strong>How big is it?</strong></p>
                                    <SizeSlider value={frame.size} onChange={(n) => updateTopFrame({ size: n })} dataKey="before" />
                                    <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>What you write here stays on this page and isn't saved.</p>
                                </div>
                            )}
                            {blockStack.length === 3 && (
                                <div className="mini-section" data-block-depth-reflection>
                                    <p>This is the third block inside a block. Sometimes that is the work itself, and sometimes it means today has asked enough. Going on is fine, and so is stopping or pausing.</p>
                                </div>
                            )}
                            {!blockFrameSkipped ? (
                                <div className="mini-section" data-block-frame="self-sabotage">
                                    <p>When a step won't come, this game assumes self-sabotage: something in you working against the step, usually to protect you. It isn't wrong to be here. It is the next block to work.</p>
                                    <p style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                                        <a href="#" data-block-skip-frame onClick={(e) => { e.preventDefault(); setBlockFrameSkipped(true); }}>That frame doesn't fit me. Skip it.</a>
                                    </p>
                                </div>
                            ) : (
                                <div className="mini-section" data-block-frame="plain">
                                    <p>Whatever is in the way can be worked like any other block.</p>
                                </div>
                            )}
                            <p className="prompt">You'll find it in your body, name its channel and face, hold a true belief about it, and see if it shifts. Then you come back to {stepLabel}, right where you left it.</p>
                            <div className="button-group">
                                <button className="primary" data-block-work onClick={startBlockWork}>
                                    Work on what's in the way
                                </button>
                                <button className="secondary" data-block-back onClick={() => { commitBlockDetails(); returnFromBlock("none"); }}>
                                    Go back to {stepLabel}
                                </button>
                                <button className="secondary" onClick={handleStopForToday}>
                                    I'll leave this here for today
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            if (phase === "phase1") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">PHASE 1 — Locate the Block</div>
                            <h2>Where do you feel it?</h2>
                            {!trailhead && blockStack.length === 0 && scanContext === "first" && (
                                // The trailhead in the player's words (oag-trailhead). Optional,
                                // shown back to them on the trail and at the end, never stored.
                                <div className="mini-section start-words">
                                    <p><strong>What brought you here today?</strong> One line, if you like. It helps you find your way back at the end.</p>
                                    <input type="text" data-start-words value={startWords}
                                           onChange={(e) => setStartWords(e.target.value)}
                                           placeholder="e.g. 'the call with my sister' (optional)" />
                                </div>
                            )}
                            {renderOpeningRitual()}
                            {isScanReady() && (
                                <div className="button-group">
                                    <button className="primary" data-demo-key="phase1-this-is-it" onClick={handlePhase1Submit} disabled={!location || !texture}>
                                        This is it
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            if (phase === "phase-flow-locate") {
                const viaWord = phase3Context === "tempering" ? "restrains" : "flows into";
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">{phase3Context === "tempering" ? "TEMPERING WISDOM" : "FLOWING FORWARD"}</div>
                            {/* Wuxing Mythic Framing (V2 UI Spec 2, Epic Meaning) — the same
                                shengCycle/keCycle values that already drive the h2 below, drawn
                                as a highlighted arrow: a picture of the move that just happened,
                                not a new mechanic. previousChannel is the source (the h2 text
                                confirms it: "{previousChannel} {viaWord} {selectedChannel}"). */}
                            <WuxingWheel
                                compact
                                activeChannel={previousChannel}
                                transitionKind={phase3Context === "tempering" ? "ke" : "sheng"}
                                channelsSatisfied={mergeChannelsSatisfied(patternSummary && patternSummary.channelsSatisfied, resolvedThreads)}
                            />
                            <h2>{previousChannel} {viaWord} {selectedChannel}.</h2>
                            <p className="prompt">Before you name a face here, scan your body again. Is there a live charge in {selectedChannel} right now, connected to what you just worked?</p>
                            {renderOpeningRitual()}
                            {isScanReady() && (
                                <div className="button-group">
                                    <button className="primary" data-demo-key="flow-locate-this-is-it" onClick={handleFlowLocateSubmit} disabled={!location || !texture}>
                                        This is it
                                    </button>
                                    <button className="secondary" onClick={handleFlowLocateNoCharge}>
                                        Nothing here
                                    </button>
                                </div>
                            )}
                        </div>
                        {debugPanel}
                    </div>
                );
            }

            if (phase === "phase2") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">PHASE 2 — Name the Channel</div>
                            <h2>Which channel does this speak through?</h2>
                            <p className="prompt">Choose the emotional channel that resonates:</p>
                            <div className="options-grid">
                                {channels.map((ch) => (
                                    <div
                                        key={ch.name}
                                        className="option-card"
                                        data-demo-key={`channel-${ch.name}`}
                                        onClick={() => handleChannelSelect(ch.name)}
                                        role="button"
                                        tabIndex="0"
                                        onKeyPress={(e) => e.key === 'Enter' && handleChannelSelect(ch.name)}
                                    >
                                        <strong>
                                            {ch.name}
                                            <span className={`element-color ${ch.color}`}>{ch.element}</span>
                                        </strong>
                                        {ch.name === "Anger" && <small>Goal + Obstacle. Power is blocked.</small>}
                                        {ch.name === "Sadness" && <small>Care-Object + Distance. Presence is far.</small>}
                                        {ch.name === "Joy" && <small>Aliveness. Field is muted.</small>}
                                        {ch.name === "Fear" && <small>Threat. Boundary is breaking.</small>}
                                        {ch.name === "Neutrality" && <small>Ground Being Held. Ground is numb.</small>}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {debugPanel}
                    </div>
                );
            }

            // ICA 2 face-pattern reflection: how many face-picks, most recent first,
            // are all the same face. Reads faceLog as it stood BEFORE whatever choice
            // the player is about to make on this render, which is exactly what's
            // wanted — reflecting on the pattern so far, not on this click. Threshold
            // matches the doc's own language ("picked the same face four times
            // running"); it re-shows on the 5th, 6th, etc. in a row too, since the
            // pattern is still just as true each time.
            const faceStreak = () => {
                if (faceLog.length < 4) return null;
                const last = faceLog[faceLog.length - 1];
                let count = 0;
                for (let i = faceLog.length - 1; i >= 0 && faceLog[i] === last; i--) count++;
                return count >= 4 ? { face: last, count } : null;
            };

            if (phase === "phase3") {
                const streak = faceStreak();
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">PHASE 3 — Find Your Face</div>
                            {phase3Context === "initial" && (
                                <>
                                    <h2>Which way do you know this?</h2>
                                    {facesIntroSeen && <p className="prompt">Pick the face that fits best. Your body gets the next word.</p>}
                                </>
                            )}
                            {phase3Context === "flow-forward" && (
                                <>
                                    <h2>You've flowed through the generative cycle</h2>
                                    <p className="prompt" style={{ marginBottom: "0.5rem" }}>{previousChannel} flows into <strong>{selectedChannel}</strong>.</p>
                                    <p className="prompt" style={{ marginBottom: "0.5rem" }}>You arrive here <strong>{incomingState}</strong>.</p>
                                    <p className="prompt">Now, which way do you want to explore this?</p>
                                </>
                            )}
                            {phase3Context === "tempering" && (
                                <>
                                    <h2>You're invoking tempering wisdom</h2>
                                    {/* Bug fix (Sept 26, 2026): this had selectedChannel/previousChannel
                                        swapped, claiming the channel you just ARRIVED at restrains the one
                                        you came FROM — backwards. previousChannel is the one invoking
                                        tempering, so it's the one doing the restraining; selectedChannel is
                                        where that restraint lands. Matches phase-flow-locate's header just
                                        before this screen, which already had the direction right. */}
                                    <p className="prompt" style={{ marginBottom: "0.5rem" }}><strong>{previousChannel}</strong> restrains {selectedChannel}.</p>
                                    <p className="prompt" style={{ marginBottom: "0.5rem" }}>You arrive here <strong>{incomingState}</strong>.</p>
                                    <p className="prompt">How do you want to explore this deeper restraint?</p>
                                </>
                            )}
                            {phase3Context === "branch" && (
                                <>
                                    <h2>This charge is also alive in {selectedChannel}</h2>
                                    <p className="prompt">Which way do you know it there?</p>
                                </>
                            )}
                            {!facesIntroSeen && (
                                // The faces primer (oag-faces-primer): three sentences the first
                                // time a player picks a face in a session.
                                <div className="mini-section faces-primer" data-faces-primer>
                                    <p>There are six ways of knowing a feeling, and the game calls them faces. None ranks above another here; each one notices something the others miss.</p>
                                    <p style={{ marginTop: "0.4rem" }}>Read the questions and pick the one that sounds most like how this feels. If none fits, pick the one your body leans toward, since the next screen checks it with your body anyway.</p>
                                </div>
                            )}
                            {streak && (
                                <div className="mini-section">
                                    <p>
                                        {streak.face} is where you've landed the last {streak.count} times, across
                                        every channel so far. It might be right again — or another face might
                                        actually fit this block better. Both are fine; just notice before you pick.
                                    </p>
                                </div>
                            )}
                            <div className="options-grid">
                                {faces.map((f) => (
                                    <div
                                        key={f.name}
                                        className="option-card"
                                        data-demo-key={`face-${f.name}`}
                                        onClick={() => (phase3Context === "branch" ? handleBranchFaceSelect(f.name) : handleFaceSelect(f.name))}
                                        role="button"
                                        tabIndex="0"
                                        onKeyPress={(e) => e.key === 'Enter' && (phase3Context === "branch" ? handleBranchFaceSelect(f.name) : handleFaceSelect(f.name))}
                                    >
                                        <strong>{FACE_PLAIN[f.name] || f.name} <span className="face-tag">{f.name}</span></strong>
                                        <small>{f.description}</small>
                                        <small className="face-question">{precisionQuestions[f.name.toLowerCase()]}</small>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {debugPanel}
                    </div>
                );
            }

            if (phase === "phase4") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">PHASE 4 — Hold the Belief</div>
                            <h2>Notice what's already true.</h2>
                            <div className="mini-section">
                                <p><strong>Stem:</strong></p>
                                <p style={{ marginTop: "0.5rem", fontStyle: "italic" }}>"{currentStem}"</p>
                            </div>
                            {/* UX polish bundle (Simulated Playtesting doc, Speed/Blockers section,
                                Sept 23, 2026): the intellectualizer persona reflexively hits "No,
                                generate my own" to write something more precise, quietly swapping the
                                felt-sense test for a wordsmithing exercise, because the old copy
                                ("Does this land in your body? Does it feel true?") reads as an
                                accuracy question with a right answer. Same fix already given to the
                                satisfaction-state landing screen: reframe as a felt invitation, not a
                                test to pass. The buttons and the underlying accept/reject mechanic are
                                UNCHANGED on purpose — the doc's own constraint is that speed fixes
                                reduce friction around the check, never the check itself. */}
                            <p className="prompt">This isn't a wording test — just notice whether this already matches what's happening in your body, or whether something else is sitting there instead.</p>
                            <div className="button-group">
                                <button className="primary" data-demo-key="phase4-yes" onClick={handleStemAccept}>
                                    Yes, this is true
                                </button>
                                <button className="secondary" onClick={handleStemReject}>
                                    No, generate my own
                                </button>
                            </div>
                            <p className="prompt" style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#999" }}>Either answer is just information, not a grade.</p>
                        </div>
                    </div>
                );
            }

            if (phase === "phase4-self-author") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">PHASE 4 — Hold the Belief</div>
                            <h2>What is true?</h2>
                            <p className="prompt">Generate your own belief. What is actually true about this block right now?</p>
                            <textarea
                                value={userBelief}
                                onChange={(e) => setUserBelief(e.target.value)}
                                placeholder="Write the true statement here..."
                            />
                            <div className="button-group">
                                <button className="primary" onClick={handleSelfAuthor} disabled={!userBelief.trim()}>
                                    I've written it
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            if (phase === "phase5") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">PHASE 5 — Wait for the Shift</div>
                            <h2>Hold this. Don't do anything.</h2>
                            <p className="prompt">Simply be with the belief. Notice what wants to change. Notice the texture, the location, the feeling.</p>
                            <div className="texture-glyph-hold">
                                <TextureGlyph texture={texture} opened={false} size={64} />
                            </div>
                            <div className="mini-section" style={{ textAlign: "center" }}>
                                <p><strong>Your Belief:</strong></p>
                                <p style={{ marginTop: "0.5rem", fontStyle: "italic" }}>"{userBelief}"</p>
                            </div>
                            {/* In-session "this is live" framing (V2 UI Spec, honest
                                Scarcity/Impatience) — pure copy, no timer, no mechanic change.
                                Names something true (a live charge is more workable now than
                                the memory of it later) rather than manufacturing urgency; never
                                shown outside an active session, and changes nothing about the
                                Pause/Stop options below. */}
                            <p className="prompt live-charge-note" style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#999" }}>
                                This is live right now — that's worth using while it's here.
                            </p>
                            <div className="button-group">
                                <button className="primary" data-demo-key="phase5-ready" onClick={handlePhase5Done}>
                                    Ready to notice
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            // Shared by both the main Phase 5 flow and Go Deeper (openReturnPhase decides
            // which one gets resumed): a player-facing picker instead of a fixed screen.
            if (phase === "phase-open-choice") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">OPENING</div>
                            <h2>How do you want to open into this?</h2>
                            <p className="prompt">Pick whichever pass fits right now — there's no wrong door.</p>
                            <div className="options-grid">
                                {/* W.A.V.E. listed first (site build, 6 October 2026): Mastering the
                                    Game of Allyship teaches it as the Open Up practice, for when
                                    charge is already present in the body (Appendix C, Key Terms). */}
                                <div
                                    className="option-card"
                                    data-demo-key="open-choice-wave"
                                    onClick={() => handleChooseOpenTechnique("wave")}
                                    role="button"
                                    tabIndex="0"
                                    onKeyPress={(e) => e.key === 'Enter' && handleChooseOpenTechnique("wave")}
                                >
                                    <strong>W.A.V.E.</strong>
                                    <small>One breath per step: welcome it, climb as far as you honestly can, validate your body, then choose to stay or release. Use it when the charge is already in your body.</small>
                                </div>
                                <div
                                    className="option-card"
                                    data-demo-key="open-choice-breaths"
                                    onClick={() => handleChooseOpenTechnique("breaths")}
                                    role="button"
                                    tabIndex="0"
                                    onKeyPress={(e) => e.key === 'Enter' && handleChooseOpenTechnique("breaths")}
                                >
                                    <strong>Simple Breaths</strong>
                                    <small>Three slow, conscious breaths. The basic pass.</small>
                                </div>
                                <div
                                    className="option-card"
                                    onClick={() => handleChooseOpenTechnique("sedona")}
                                    role="button"
                                    tabIndex="0"
                                    onKeyPress={(e) => e.key === 'Enter' && handleChooseOpenTechnique("sedona")}
                                >
                                    <strong>Sedona Method</strong>
                                    <small>Welcome the feeling, then ask: could I let it go, would I, when.</small>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }

            if (phase === "phase-open-active") {
                if (openTechnique === "breaths") {
                    return (
                        <div className="container">
                            <div className="card">
                                <div className="three-breaths">
                                    <p style={{ fontSize: "1.2rem" }}>Take three conscious breaths.</p>
                                    <div className="breath-indicator">🌬️</div>
                                    <button className="primary" data-demo-key="open-active-breaths-done" onClick={handleOpenBreathingDone} style={{ marginTop: "2rem" }}>
                                        I've taken three breaths
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                }

                if (openTechnique === "wave") {
                    return (
                        <div className="container">
                            <div className="card">
                                <div className="phase-marker">OPENING — W.A.V.E.</div>
                                {renderWaveStep("open")}
                            </div>
                        </div>
                    );
                }

                if (openTechnique === "sedona") {
                    const roundLabel = sedonaRounds > 0 ? ` (round ${sedonaRounds + 1})` : "";
                    if (sedonaStep === 1) {
                        return (
                            <div className="container">
                                <div className="card">
                                    <div className="phase-marker">OPENING — Sedona Method{roundLabel}</div>
                                    <h2>Welcome whatever is here.</h2>
                                    <p className="prompt">Don't fix it or explain it. Just let yourself feel exactly what you're feeling right now, fully, for a moment.</p>
                                    <div className="button-group">
                                        <button className="primary" onClick={handleSedonaAdvance}>I'm feeling it</button>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    if (sedonaStep === 2) {
                        return (
                            <div className="container">
                                <div className="card">
                                    <div className="phase-marker">OPENING — Sedona Method{roundLabel}</div>
                                    <h2>Could you let this feeling go?</h2>
                                    <p className="prompt">Yes or no is fine — there's no wrong answer, only noticing you can ask.</p>
                                    <div className="button-group">
                                        <button className="secondary" onClick={handleSedonaAdvance}>Yes</button>
                                        <button className="secondary" onClick={handleSedonaAdvance}>No</button>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    if (sedonaStep === 3) {
                        return (
                            <div className="container">
                                <div className="card">
                                    <div className="phase-marker">OPENING — Sedona Method{roundLabel}</div>
                                    <h2>Would you let it go?</h2>
                                    <p className="prompt">Willing is different from could. Either answer moves you forward.</p>
                                    <div className="button-group">
                                        <button className="secondary" onClick={handleSedonaAdvance}>Yes</button>
                                        <button className="secondary" onClick={handleSedonaAdvance}>No</button>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    if (sedonaStep === 4) {
                        return (
                            <div className="container">
                                <div className="card">
                                    <div className="phase-marker">OPENING — Sedona Method{roundLabel}</div>
                                    <h2>When?</h2>
                                    <p className="prompt">Any answer is real, including "not yet." The choice is always yours.</p>
                                    <div className="button-group">
                                        <button className="secondary" onClick={handleSedonaAdvance}>Now</button>
                                        <button className="secondary" onClick={handleSedonaAdvance}>Not yet</button>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div className="container">
                            <div className="card">
                                <div className="phase-marker">OPENING — Sedona Method{roundLabel}</div>
                                <h2>Notice what's here now.</h2>
                                <p className="prompt">Often another layer is waiting underneath. You can run through it again, or move on.</p>
                                <div className="button-group">
                                    <button className="secondary" onClick={handleSedonaRepeat}>Go again</button>
                                    <button className="primary" onClick={handleSedonaFinish}>I'm ready to notice</button>
                                </div>
                            </div>
                        </div>
                    );
                }

                return null;
            }

            if (phase === "phase5-result") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">PHASE 5 — Result</div>
                            <h2>What changed?</h2>
                            <div className="texture-glyph-hold">
                                <TextureGlyph texture={texture} opened={false} size={64} />
                            </div>
                            <p className="prompt">Notice the block now. Did the texture shift? Did the location change? Did the feeling move?</p>
                            <div className="button-group">
                                <button className="primary" data-demo-key="phase5-result-yes" onClick={() => handleShifted(true)}>
                                    Yes, something shifted
                                </button>
                                <button className="secondary" onClick={() => handleShifted(false)}>
                                    No, it's still the same
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            if (phase === "phase5-state-confirm") {
                const key = selectedChannel.toLowerCase();
                const faceKey = selectedFace.toLowerCase();
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">PHASE 5 — What Landed</div>
                            <h2>Something shifted. Where does it live now?</h2>
                            <div className="texture-glyph-hold">
                                <TextureGlyph texture={texture} opened={true} size={64} />
                            </div>
                            <p className="prompt">Not a label to pick correctly — notice which of these actually matches what you feel right now, then choose it. That choice is what decides where this charge goes next.</p>
                            <div className="options-grid">
                                <div
                                    className="option-card"
                                    data-demo-key="state-confirm-dissatisfied"
                                    onClick={() => handlePhase5StateConfirm("dissatisfied")}
                                    role="button"
                                    tabIndex="0"
                                    onKeyPress={(e) => e.key === 'Enter' && handlePhase5StateConfirm("dissatisfied")}
                                >
                                    <strong>Does this still ache?</strong>
                                    <small>"{stems[key][faceKey]["dissatisfied"]}"</small>
                                </div>
                                <div
                                    className="option-card"
                                    data-demo-key="state-confirm-neutral"
                                    onClick={() => handlePhase5StateConfirm("neutral")}
                                    role="button"
                                    tabIndex="0"
                                    onKeyPress={(e) => e.key === 'Enter' && handlePhase5StateConfirm("neutral")}
                                >
                                    <strong>Does this feel workable now?</strong>
                                    <small>"{stems[key][faceKey]["neutral"]}"</small>
                                </div>
                                <div
                                    className="option-card"
                                    data-demo-key="state-confirm-satisfied"
                                    onClick={() => handlePhase5StateConfirm("satisfied")}
                                    role="button"
                                    tabIndex="0"
                                    onKeyPress={(e) => e.key === 'Enter' && handlePhase5StateConfirm("satisfied")}
                                >
                                    <strong>Does this feel resolved?</strong>
                                    <small>"{stems[key][faceKey]["satisfied"]}"</small>
                                </div>
                            </div>
                            <p className="prompt" style={{ marginTop: "1rem" }}>These are mirrors, not instructions — pick whichever is closest. Your own felt sense is the real record of what happened.</p>
                        </div>
                        {debugPanel}
                    </div>
                );
            }

            if (phase === "phase-multiplicity-check") {
                const hasRoom = remainingChannelsForBranch().length > 0;
                // UX polish bundle (Simulated Playtesting doc, Speed/Blockers section, Sept 23,
                // 2026): the over-namer persona (the coach's client, from the persona pass) chases
                // anything vaguely resonant, naming branch after branch without ever working one —
                // "more moves than the sum of their parts." The doc's proposed fix, word for word:
                // "once three or more threads are named with none resolved... 'you've named a lot
                // without landing one — is one of these the loudest?'" deferredThreads.length is the
                // count of named-but-never-worked threads, which is exactly what over-naming produces
                // (a defer never resolves a thread, it only sets it aside — see handleBranchDefer).
                // Purely informational, same as the ICA 2 face-pattern reflection: it doesn't disable
                // "Yes, name it," it just names the pattern back.
                const overNamed = deferredThreads.length >= 3;
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">CHECKING FOR MULTIPLICITY</div>
                            <h2>Is this same charge showing up somewhere else right now?</h2>
                            <p className="prompt">Not a different problem — the same one, wearing a different channel.</p>
                            {overNamed && (
                                <div className="mini-section">
                                    <p>
                                        You've named {deferredThreads.length} threads without landing one yet.
                                        More might really be alive here — or one of them might be the loudest,
                                        and worth working before naming another.
                                    </p>
                                </div>
                            )}
                            <div className="button-group">
                                {hasRoom && (
                                    <button className="primary" data-demo-key="mult-yes-name" onClick={handleMultiplicityYesStart}>
                                        Yes, name it
                                    </button>
                                )}
                                <button className="secondary" data-demo-key="mult-no-thats-all" onClick={handleFinishMultiplicity}>
                                    No, that's all of it
                                </button>
                            </div>
                            {!hasRoom && <p className="prompt" style={{ marginTop: "1rem", color: "#ff9800" }}>Every channel is already part of this charge.</p>}
                        </div>
                        {debugPanel}
                    </div>
                );
            }

            if (phase === "phase-multiplicity-pick-channel") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">NAME THE OTHER CHANNEL</div>
                            <h2>Where else is it showing up?</h2>
                            <p className="prompt">Choose the channel this same charge is also alive in:</p>
                            <div className="options-grid">
                                {remainingChannelsForBranch().map((ch) => (
                                    <div
                                        key={ch.name}
                                        className="option-card"
                                        data-demo-key={`branch-channel-${ch.name}`}
                                        onClick={() => handleBranchChannelSelect(ch.name)}
                                        role="button"
                                        tabIndex="0"
                                        onKeyPress={(e) => e.key === 'Enter' && handleBranchChannelSelect(ch.name)}
                                    >
                                        <strong>{ch.name}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {debugPanel}
                    </div>
                );
            }

            if (phase === "phase-branch-choice") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">{selectedChannel} — {selectedFace}</div>
                            <h2>Work through it now, or set it aside?</h2>
                            <div className="mini-section">
                                <p style={{ fontStyle: "italic" }}>"{currentStem}"</p>
                            </div>
                            <div className="button-group">
                                <button className="primary" data-demo-key="branch-work-now" onClick={handleBranchWorkNow}>
                                    Work on it now
                                </button>
                                <button className="secondary" data-demo-key="branch-defer" onClick={handleBranchDefer}>
                                    Set it aside for later
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            if (phase === "phase-recheck") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">CHECKING BACK</div>
                            <h2>What about {recheckTarget.channel}?</h2>
                            <p className="prompt">You set this one aside. Has anything moved there since?</p>
                            <div className="button-group">
                                <button className="primary" data-demo-key="recheck-yes-moved" onClick={handleRecheckShifted}>
                                    Yes, that one moved too
                                </button>
                                <button className="secondary" data-demo-key="recheck-no-still-there" onClick={() => setPhase("phase-recheck-choice")}>
                                    No, it's still there
                                </button>
                            </div>
                        </div>
                        {debugPanel}
                    </div>
                );
            }

            if (phase === "phase-recheck-choice") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">{recheckTarget.channel}</div>
                            <h2>Work through it now, or set it aside again?</h2>
                            <div className="button-group">
                                <button className="primary" data-demo-key="recheck-choice-work-now" onClick={handleRecheckWorkNow}>
                                    Work on it now
                                </button>
                                <button className="secondary" data-demo-key="recheck-choice-defer" onClick={handleRecheckDefer}>
                                    Set it aside for later
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            if (phase === "phase6") {
                const nextChannel = shengCycle[selectedChannel];
                const restrainingChannel = keCycle[selectedChannel];
                const movesSpent = resolvedThreads.filter(t => !t.passive).length;
                const passiveCount = resolvedThreads.filter(t => t.passive).length;
                const threadsTotal = resolvedThreads.length + deferredThreads.length;
                const satisfiedCount = resolvedThreads.filter(t => t.endState === "satisfied").length;
                const deeperAvailable = hasLevel2Content(selectedChannel, selectedFace, currentThreadEndState());

                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">PHASE 6 — Block Has Shifted</div>
                            <h2>Where next?</h2>
                            {persistenceAvailable && (
                                // The Wuxing Wheel, compact placement (V2 UI Spec) — merged
                                // live with THIS cycle's own resolvedThreads so a satisfied
                                // landing lights up immediately, not only after "Complete This
                                // Cycle" writes it. Same gating as the rest of the
                                // persistence-adjacent UI on this screen (the Mode B checkbox
                                // below), so the sheng/ke choice below visibly sits on the
                                // same wheel it's about to fill in further.
                                <WuxingWheel
                                    compact
                                    channelsSatisfied={mergeChannelsSatisfied(patternSummary && patternSummary.channelsSatisfied, resolvedThreads)}
                                />
                            )}
                            {resolvedThreads.length > 0 && (
                                <div className="mini-section">
                                    <p>{satisfiedCount} of {resolvedThreads.length} resolved thread{resolvedThreads.length === 1 ? "" : "s"} landed at full satisfaction so far.</p>
                                    {threadsTotal > 1 && (
                                        <>
                                            <p style={{ marginTop: "0.5rem" }}>This charge touched {threadsTotal} channel{threadsTotal === 1 ? "" : "s"}, and it took {movesSpent} move{movesSpent === 1 ? "" : "s"} to work through.</p>
                                            {passiveCount > 0 && <p style={{ marginTop: "0.5rem" }}>{passiveCount} of them moved on their own once the others did — two birds, one stone.</p>}
                                            {deferredThreads.length > 0 && <p style={{ marginTop: "0.5rem" }}>{deferredThreads.length} still open, set aside for their own pass.</p>}
                                        </>
                                    )}
                                </div>
                            )}
                            <p className="prompt">Choose your next move:</p>
                            <div className="options-grid">
                                <div
                                    className="option-card"
                                    data-demo-key="phase6-flow-forward"
                                    onClick={handleFlowForward}
                                    role="button"
                                    tabIndex="0"
                                    onKeyPress={(e) => e.key === 'Enter' && handleFlowForward()}
                                >
                                    <strong>Flow Forward → {nextChannel}</strong>
                                    <small>Move to the next channel in the generative cycle. Continue the momentum.</small>
                                </div>
                                <div
                                    className="option-card"
                                    data-demo-key="phase6-tempering"
                                    onClick={handleTempering}
                                    role="button"
                                    tabIndex="0"
                                    onKeyPress={(e) => e.key === 'Enter' && handleTempering()}
                                >
                                    <strong>Tempering Wisdom → {restrainingChannel}</strong>
                                    {/* Bug fix (Sept 26, 2026): "restrainingChannel" is misleadingly
                                        named — it's the channel selectedChannel restrains (the
                                        destination), not the one restraining selectedChannel. The
                                        sentence had it backwards; selectedChannel is the one doing
                                        the restraining here. */}
                                    <small>{selectedChannel} restrains {restrainingChannel}. Deepen the work with the controlling channel.</small>
                                </div>
                                {deeperAvailable && (
                                    <div
                                        className="option-card"
                                        data-demo-key="phase6-go-deeper"
                                        onClick={handleGoDeeper}
                                        role="button"
                                        tabIndex="0"
                                        onKeyPress={(e) => e.key === 'Enter' && handleGoDeeper()}
                                    >
                                        <strong>Go Deeper (Level 2)</strong>
                                        <small>Stay in {selectedChannel}. Hold three stems at once.</small>
                                    </div>
                                )}
                            </div>
                            {!deeperAvailable && (
                                <p className="prompt" style={{ marginTop: "1rem", color: "#999", fontSize: "0.85rem" }}>
                                    (Going deeper isn't written yet for {selectedChannel} — {selectedFace}. Coming soon.)
                                </p>
                            )}
                            {persistenceAvailable && (!patternSummary || !patternSummary.totalCycles) && (
                                // One-time consent-context line (Cross-Session Persistence
                                // Spec, "Capability Declaration / Consent / Integration
                                // Points") — shown only when a write is actually about to
                                // happen for the first time on this device: persistence is
                                // available but this viewer's rollup is still empty. Never
                                // shown again once totalCycles > 0, and never shown at all
                                // when there's no db/user grant to write with.
                                <p className="prompt" style={{ marginTop: "1rem", color: "#999", fontSize: "0.85rem" }}>
                                    {ON_SITE
                                        ? "(Completing this cycle saves a private pattern summary — channels, faces, how sessions tend to unfold — in this browser on this device only. No belief text is stored.)"
                                        : "(Completing this cycle saves a private pattern summary — channels, faces, how sessions tend to unfold — visible only to you. No belief text is stored.)"}
                                </p>
                            )}
                            {persistenceAvailable && (
                                // Mode B toggle (opt-in coach visibility). Off by default every
                                // cycle — no sticky setting, per Wendell's call — and gated on
                                // the same persistenceAvailable flag as Mode A's write, since
                                // sharing is a second write on top of it and needs the same
                                // db/user grant. Checking it doesn't share anything by itself:
                                // it only decides whether "Complete This Cycle" routes through
                                // an explicit confirm screen before any shared write happens.
                                <p className="prompt" style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={shareWithCoach}
                                            onChange={(e) => setShareWithCoach(e.target.checked)}
                                        />
                                        Also share this cycle with your coach
                                    </label>
                                </p>
                            )}
                            <div className="button-group" style={{ marginTop: "1.5rem" }}>
                                <button className="secondary" data-demo-key="complete-cycle" onClick={handleCompleteCycle}>
                                    Complete This Cycle
                                </button>
                            </div>
                        </div>
                        {debugPanel}
                    </div>
                );
            }

            if (phase === "phase7") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">PHASE 7 — Block Didn't Shift</div>
                            <h2>Try again or go deeper.</h2>
                            <p className="prompt">
                                {precisionQuestions[selectedFace.toLowerCase()]}
                            </p>
                            <textarea
                                value={userBelief}
                                onChange={(e) => setUserBelief(e.target.value)}
                                placeholder="Answer the precision question..."
                            />
                            <div className="button-group">
                                <button className="primary" onClick={() => setPhase("phase5")}>
                                    Try again with this
                                </button>
                                {blockStack.length > 0 && (
                                    <button className="secondary" data-block-back onClick={() => returnFromBlock("unshifted")}>
                                        Go back to {WAVE_STEP_LABEL[blockStack[blockStack.length - 1].step]} anyway
                                    </button>
                                )}
                                {(phase3Context === "flow-forward" || phase3Context === "tempering") && (
                                    <button className="secondary" onClick={handleDifferentChargeEmerging}>
                                        This is its own charge
                                    </button>
                                )}
                                <button className="secondary" onClick={handleNewCycle}>
                                    Start a new cycle
                                </button>
                                <button className="secondary" onClick={handleStopForToday}>
                                    I'll leave this here for today
                                </button>
                                <button className="secondary" onClick={handleStopHere}>
                                    This is too much right now — stop
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            if (phase === "phase-stopped") {
                const isDistress = stopReason !== "done-for-today";
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">{isDistress ? "STOPPING HERE" : "LEAVING IT FOR TODAY"}</div>
                            <h2>{isDistress ? "That's a fine place to stop." : "That's a fine place to leave it for today."}</h2>
                            {isDistress ? (
                                <>
                                    <p className="prompt">
                                        Nothing here needed to resolve today. A block not shifting isn't a
                                        failure to fix — sometimes the intensity itself is the information,
                                        not the belief being tested.
                                    </p>
                                    <p className="prompt">
                                        If it helps, and only if it helps: notice one thing you can see,
                                        one thing you can hear, and one thing you can feel touching you
                                        right now. If that doesn't help, that's fine too — there's nothing
                                        else to do here.
                                    </p>
                                    <p className="prompt" style={{ color: "#999", fontSize: "0.85rem" }}>
                                        This is a practice space, not a crisis service. If you're in real
                                        danger or crisis, please reach out to a person or a crisis line
                                        rather than this app.
                                    </p>
                                </>
                            ) : (
                                <p className="prompt">
                                    Not every block finishes in one sitting, and there's no rule that says
                                    it should. This isn't a failure to close out — leaving here clears
                                    today's ledger, same as starting a new cycle would, so there's nothing
                                    to undo. If it's still live for you, you're always welcome to come back
                                    and find your way to it again, whenever you're ready.
                                </p>
                            )}
                            <div className="button-group">
                                <button className="primary" onClick={handleLeaveStopped}>
                                    I'm done for now
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            if (phase === "phase-paused") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">PAUSED</div>
                            <h2>Whatever's here will wait.</h2>
                            <p className="prompt">
                                This isn't a stop and it isn't a failure to shift — something outside
                                the practice just needs you right now. Nothing here is cleared: come back
                                whenever you're able and pick up exactly where this left off.
                            </p>
                            <div className="button-group">
                                <button className="primary" onClick={handleResumeFromPause}>
                                    Resume where I left off
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            if (phase === "phase7-charge-state") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">A NEW CHARGE EMERGING</div>
                            <h2>Before you hold this, where does it start?</h2>
                            <p className="prompt">This is separate from what you were just working — its own charge, not the next rung of the last one. What state is it in right now?</p>
                            <div className="options-grid">
                                <div
                                    className="option-card"
                                    onClick={() => handleChargeStateChosen("dissatisfied")}
                                    role="button"
                                    tabIndex="0"
                                    onKeyPress={(e) => e.key === 'Enter' && handleChargeStateChosen("dissatisfied")}
                                >
                                    <strong>Still aches</strong>
                                    <small>Dissatisfied — the charge is live and unresolved.</small>
                                </div>
                                <div
                                    className="option-card"
                                    onClick={() => handleChargeStateChosen("neutral")}
                                    role="button"
                                    tabIndex="0"
                                    onKeyPress={(e) => e.key === 'Enter' && handleChargeStateChosen("neutral")}
                                >
                                    <strong>Feels workable</strong>
                                    <small>Neutral — not raw, not resolved.</small>
                                </div>
                                <div
                                    className="option-card"
                                    onClick={() => handleChargeStateChosen("satisfied")}
                                    role="button"
                                    tabIndex="0"
                                    onKeyPress={(e) => e.key === 'Enter' && handleChargeStateChosen("satisfied")}
                                >
                                    <strong>Feels resolved</strong>
                                    <small>Satisfied — though something here still wants attention.</small>
                                </div>
                            </div>
                        </div>
                        {debugPanel}
                    </div>
                );
            }

            if (phase === "phase-deeper-hold") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">PHASE 6 — Go Deeper (Level 2)</div>
                            <h2>There's more here than one sentence can hold.</h2>
                            <p className="prompt">Read one at a time. Hold it with the intention to say what's actually true right now — not just the words — and notice: does it come out clean, or does something catch?</p>
                            <div className="options-grid">
                                {deeperStems.map((stemText, idx) => (
                                    <div
                                        key={idx}
                                        className={`option-card${deeperVerdicts[idx] === "clean" ? " selected" : ""}`}
                                    >
                                        <small style={{ fontStyle: "italic" }}>"{stemText}"</small>
                                        <div className="button-group" style={{ marginTop: "0.75rem" }}>
                                            <button
                                                className={deeperVerdicts[idx] === "clean" ? "primary" : "secondary"}
                                                data-demo-key={`deeper-clean-${idx}`}
                                                onClick={() => setDeeperVerdict(idx, "clean")}
                                            >
                                                Came out clean
                                            </button>
                                            <button
                                                className={deeperVerdicts[idx] === "caught" ? "primary" : "secondary"}
                                                data-demo-key={`deeper-caught-${idx}`}
                                                onClick={() => setDeeperVerdict(idx, "caught")}
                                            >
                                                Something caught
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {allDeeperStemsChecked && (
                                <div className="button-group" style={{ marginTop: "1.5rem" }}>
                                    <button className="primary" data-demo-key="deeper-continue" onClick={handleDeeperContinue}>
                                        {deeperCleanCount === 0 ? "None of these came out clean — write my own" : `Continue holding these (${deeperCleanCount})`}
                                    </button>
                                </div>
                            )}
                        </div>
                        {debugPanel}
                    </div>
                );
            }

            if (phase === "phase-deeper-self-author") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">PHASE 6 — Go Deeper (Level 2)</div>
                            <h2>What's actually true here?</h2>
                            <p className="prompt">None of the three landed. Write what's actually true about this block right now — this becomes what you hold.</p>
                            <textarea
                                value={deeperSelfAuthorText}
                                onChange={(e) => setDeeperSelfAuthorText(e.target.value)}
                                placeholder="Write the true statement here..."
                            />
                            <div className="button-group">
                                <button className="primary" onClick={handleDeeperSelfAuthor} disabled={!deeperSelfAuthorText.trim()}>
                                    I've written it
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            if (phase === "phase-deeper-sit") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">PHASE 6 — Hold This</div>
                            <h2>Hold all of it. Don't do anything.</h2>
                            <p className="prompt">You don't have to collapse these into one story. Just notice what it's like to hold {heldBeliefs.length > 1 ? "all of them" : "this"} at once.</p>
                            <div className="mini-section">
                                {heldBeliefs.map((b, idx) => (
                                    <p key={idx} style={{ marginTop: idx === 0 ? 0 : "0.5rem", fontStyle: "italic" }}>"{b}"</p>
                                ))}
                            </div>
                            <div className="button-group">
                                <button className="primary" data-demo-key="deeper-sit-ready" onClick={handleDeeperSitDone}>
                                    Ready to notice
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            if (phase === "phase-deeper-result") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">PHASE 6 — Result</div>
                            <h2>What changed, holding it all at once?</h2>
                            <p className="prompt">Notice the block now. Did anything move — texture, location, feeling — even while you were holding more than one thing as true?</p>
                            <div className="button-group">
                                <button className="primary" data-demo-key="deeper-result-yes" onClick={() => handleDeeperShifted(true)}>
                                    Yes, something shifted
                                </button>
                                <button className="secondary" onClick={() => handleDeeperShifted(false)}>
                                    No, it's still the same
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            if (phase === "phase-deeper-retry") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">PHASE 6 — Still Holding</div>
                            <h2>Not yet. That's alright.</h2>
                            <p className="prompt">Holding multiple things at once doesn't always move fast. You can stay with it a little longer, or set it down and come back later.</p>
                            <div className="button-group">
                                <button className="primary" onClick={handleDeeperRetry}>
                                    Sit with it a little longer
                                </button>
                                <button className="secondary" onClick={handleDeeperSetDown}>
                                    Set it down for now
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            if (phase === "phase-deeper-landed") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">PHASE 6 — What's Left</div>
                            <h2>Notice how it's sitting now.</h2>
                            <p className="prompt">Not a label to get right — just which of these actually matches what's true for you right now.</p>
                            <div className="options-grid">
                                <div
                                    className="option-card"
                                    onClick={() => handleDeeperOutcome("held-multiple")}
                                    role="button"
                                    tabIndex="0"
                                    onKeyPress={(e) => e.key === 'Enter' && handleDeeperOutcome("held-multiple")}
                                >
                                    <strong>Still several things, and that's OK</strong>
                                    <small>They haven't merged into one story, and they don't need to.</small>
                                </div>
                                <div
                                    className="option-card"
                                    data-demo-key="deeper-landed-integrated"
                                    onClick={() => handleDeeperOutcome("integrated-one")}
                                    role="button"
                                    tabIndex="0"
                                    onKeyPress={(e) => e.key === 'Enter' && handleDeeperOutcome("integrated-one")}
                                >
                                    <strong>They've come together into one clear sense</strong>
                                    <small>Not forced — it actually settled that way.</small>
                                </div>
                            </div>
                        </div>
                        {debugPanel}
                    </div>
                );
            }

            if (phase === "phase6-share-confirm") {
                return (
                    <div className="container">
                        <div className="card">
                            <div className="phase-marker">SHARE WITH YOUR COACH</div>
                            <h2>Confirm what gets shared</h2>
                            <p className="prompt">This is the only thing that goes to your coach — no belief text, ever.</p>
                            {pendingShareData && (
                                <div className="mini-section">
                                    <p><strong>Channel:</strong> {primaryChannel || selectedChannel} ({primaryFace || selectedFace})</p>
                                    <p style={{ marginTop: "0.5rem" }}><strong>This cycle's shape:</strong> {pendingShareData.archetype}</p>
                                    <p style={{ marginTop: "0.5rem" }}><strong>Resolved threads:</strong> {pendingShareData.features.resolved}</p>
                                </div>
                            )}
                            {ON_SITE && (
                                <div className="mini-section" style={{ marginTop: "0.75rem" }}>
                                    <p>When you share, you get a code to send your coach. It holds only what's listed above and your earlier shared cycles, and nothing leaves this device unless you send it.</p>
                                </div>
                            )}
                            {myCode && !ON_SITE && (
                                // Shown here rather than as a separate URL-based link: a query
                                // parameter on the outer claude.ai artifact URL isn't known to
                                // reach this page once it's rendered inside the platform's own
                                // viewer frame (a separate origin — see the console warnings a
                                // live test surfaced this session), so a code the player copies
                                // and sends directly is the mechanism this session could actually
                                // verify, rather than an untested assumption about URL passthrough.
                                <div className="mini-section" style={{ marginTop: "0.75rem" }}>
                                    <p>Your coach code (give this to your coach, along with this game's link, so they can view your shared summary):</p>
                                    <p style={{ marginTop: "0.5rem", fontFamily: "monospace", fontSize: "0.9rem", wordBreak: "break-all", userSelect: "all" }}>{myCode}</p>
                                </div>
                            )}
                            <div className="button-group" style={{ marginTop: "1.5rem" }}>
                                <button className="primary" onClick={handleConfirmShare}>
                                    Share this cycle
                                </button>
                                <button className="secondary" onClick={handleDeclineShare}>
                                    Don't share, keep this one private
                                </button>
                            </div>
                        </div>
                        {debugPanel}
                    </div>
                );
            }

            if (phase === "phase6-done") {
                return (
                    <div className="container">
                        <div className="card">
                            <h2>Cycle Complete</h2>
                            {trailhead && (
                                // Back to the trailhead (oag-trailhead): the trip ends where it
                                // began. The answer goes on the map as a flag.
                                <div className="mini-section trailhead-return" data-trailhead-return>
                                    <p><strong>Back to where you started.</strong> You came in with {describeCharge(trailhead)}{trailhead.words ? <>, about <em>“{trailhead.words}”</em></> : ""}.</p>
                                    {!trailhead.answer ? (
                                        <>
                                            <p style={{ marginTop: "0.4rem" }}>Put your attention there now. What's there?</p>
                                            <div className="button-group">
                                                <button className="secondary" data-trailhead-answer="shifted" onClick={() => { setTrailhead({ ...trailhead, answer: "shifted" }); logRoute({ kind: "trailhead-return", answer: "shifted" }); }}>It has shifted</button>
                                                <button className="secondary" data-trailhead-answer="same" onClick={() => { setTrailhead({ ...trailhead, answer: "same" }); logRoute({ kind: "trailhead-return", answer: "same" }); }}>It's the same</button>
                                                <button className="secondary" data-trailhead-answer="different" onClick={() => { setTrailhead({ ...trailhead, answer: "different" }); logRoute({ kind: "trailhead-return", answer: "different" }); }}>Something else is there now</button>
                                            </div>
                                        </>
                                    ) : (
                                        <p style={{ marginTop: "0.4rem" }} data-trailhead-answered={trailhead.answer}>
                                            {trailhead.answer === "shifted" ? "It has shifted. The flag on the map marks where you started."
                                                : trailhead.answer === "same" ? "It's the same, and that's worth knowing. The flag on the map marks where you started, if you want to begin there next time."
                                                : "Something else is there now. That may be your next trailhead whenever you begin again."}
                                        </p>
                                    )}
                                </div>
                            )}
                            {route.some(e => e.kind === "stop") ? (
                                <div className="route-map-wrap" data-route-map>
                                    <p className="prompt">Here is where you went.</p>
                                    <RouteMap route={route} belief={heldBeliefs.length > 0 ? heldBeliefs.join(" / ") : userBelief} svgRef={mapSvgRef} trailhead={trailhead} />
                                    <p className="route-legend">
                                        Numbers are the order you worked each channel. A solid arrow flowed forward and a dashed arrow tempered. A short line with a bar is a place you looked and found nothing. A dotted ring is a thread you set aside, a double ring is where you went deeper, a small gold loop is a block you worked inside W.A.V.E., and the flag marks where you started.
                                    </p>
                                    <RouteList route={route} />
                                    <div className="button-group">
                                        <button className="secondary" data-save-map onClick={saveMapImage}>Save the map as an image</button>
                                    </div>
                                    <p className="route-legend">The belief and your own words under the map stay on this screen and in the image you save. The game doesn't store them.</p>
                                </div>
                            ) : (
                                <p className="prompt">You've completed one full cycle.</p>
                            )}
                            {coachShareCode && (
                                <div className="mini-section">
                                    <p><strong>Here is your code for your coach.</strong> Copy it and send it to them however you usually talk. They paste it into "Coach? View a shared summary" on this page.</p>
                                    <textarea readOnly value={coachShareCode} onFocus={(e) => e.target.select()} style={{ fontFamily: "monospace", fontSize: "0.8rem", minHeight: "4.5rem" }} />
                                    <button className="secondary" onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(coachShareCode); }}>
                                        Copy code
                                    </button>
                                </div>
                            )}
                            {!route.some(e => e.kind === "stop") && (
                                <div className="mini-section">
                                    <p><strong>What You Held:</strong> {userBelief}</p>
                                    <p style={{ marginTop: "0.5rem" }}><strong>Through:</strong> {selectedChannel} ({selectedFace})</p>
                                </div>
                            )}
                            {heldBeliefs.length > 0 && (
                                <div className="mini-section">
                                    <p><strong>Also Held, Going Deeper:</strong></p>
                                    {heldBeliefs.map((b, idx) => (
                                        <p key={idx} style={{ marginTop: "0.5rem", fontStyle: "italic" }}>"{b}"</p>
                                    ))}
                                </div>
                            )}
                            {lastCycleArchetype && (
                                // Archetype reflection (classifyArchetype, ported from
                                // classify_archetypes.py) — shown for every completed cycle,
                                // whether or not Mode A persistence is available, since it's
                                // a read of THIS cycle's own shape, not a claim about anything
                                // saved. persistenceAvailable only changes whether the trailing
                                // line about the running total is shown.
                                <div className="mini-section">
                                    <p><strong>This cycle's shape:</strong> {lastCycleArchetype}</p>
                                    {persistenceAvailable && patternSummary && patternSummary.totalCycles > 0 && (
                                        <p style={{ marginTop: "0.5rem" }}>That's {patternSummary.totalCycles + 1} cycles saved to your private pattern summary so far.</p>
                                    )}
                                </div>
                            )}
                            <p className="prompt" style={{ marginTop: "1.5rem" }}>Cycles repeat infinitely. You can begin again whenever you feel another block.</p>
                            <div className="button-group">
                                <button className="primary" onClick={handleNewCycle}>
                                    Start a New Cycle
                                </button>
                            </div>
                        </div>
                        {debugPanel}
                    </div>
                );
            }
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<OnologyAlchemyGame />);
    
