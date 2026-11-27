// The Gate Steward: a new player's guide to the Heaven Sect court. Every line here is a Claude draft for Wendell's edit.
// The sect calls the six keepers of the halls Elders; no line here uses any other word for them.
// Tags drive the page: "# title:" names the speaker line, "# path: <hall id>" lights that hall's path and walks the player.
// The page seeds these from WA.player.state and saves them back (guide.html): visits and last_hall as before;
// met is the Elders the player has met (hall ids, comma-separated); waiting_hall and waiting_line are the one Elder who waits for them.
// The lantern rail by the gate (guide.js) reads the same state. The Elder order after the first is not canon; only the first is.
VAR visits = 0
VAR last_hall = ""
VAR met = ""
VAR waiting_hall = ""
VAR waiting_line = ""
-> start

=== start ===
# title: The Gate Steward
{ visits == 0: -> first_visit | -> welcome_back }

=== first_visit ===
~ visits = visits + 1
You climbed all the steps. Good. The Elder of the north-west hall left a lantern here for whoever came today. That is you.
Carry it to her. She will tell you what it is for.
+ [Take the lantern] -> take_lantern
+ [Walk on for now] -> bye

=== take_lantern ===
# title: The Gate Steward
~ waiting_hall = "elder-shaman"
~ waiting_line = "She left a lantern here for you and is waiting at her hall."
# path: elder-shaman
Her hall is the north one on the west lane. I have lit the way. Walk there, or walk on and come back when you like.
-> menu

=== welcome_back ===
~ visits = visits + 1
{ waiting_hall != "":
  You are back. The Elder of the north-west hall is still waiting for you.
- else:
  You are back. Ask me anything, or walk on.
}{ last_hall != "": Last time I sent you to {last_hall}.}
-> menu

=== menu ===
+ [Who is waiting for me?] -> waiting
+ [Where am I?] -> where
+ [Show me the halls] -> halls
+ [I'll explore on my own] -> bye

=== waiting ===
# title: The Gate Steward
{ waiting_hall == "": -> waiting_nobody | -> waiting_someone }

=== waiting_nobody ===
Nobody yet. The Elder of the north-west hall left a lantern here for whoever came today. Do you want it?
+ [Take the lantern] -> take_lantern
+ [Not now] -> menu

=== waiting_someone ===
The Elder of the north-west hall. {waiting_line != "": {waiting_line}|She left a lantern here for you and is waiting at her hall.}
+ [Show me the way] -> hall_elder_shaman
+ [Back] -> menu

=== where ===
# title: The Gate Steward
This is the Gate Court, the paved square inside the torii. The two lanes run north from here along the edges of the sect. Founder's Hall stands in the middle, with the Altar behind it. Each Elder keeps a hall on the west or east side, and the lanterns by the gate say who is waiting for you.
-> menu

=== halls ===
# title: The Gate Steward
Choose a place and I will light the way, and walk you there if your window lets me.
+ [The Altar] -> hall_altar
+ [Founder's Hall] -> hall_founders_hall
+ { waiting_hall != "" } [An Elder's hall] -> elder_halls
+ [The Dojo] -> hall_dojo
+ [The Tea Library] -> hall_tea_library
+ [The Gate Court] -> hall_gate_court
+ [Back] -> menu

=== elder_halls ===
# title: The Gate Steward
Only the halls of Elders you have a lantern for or have met. The rest will light on your road.
+ { (waiting_hall == "elder-shaman") or (met ? "elder-shaman") } [The north-west hall] -> hall_elder_shaman
+ { met ? "elder-challenger" } [The west hall, middle] -> hall_elder_challenger
+ { met ? "elder-regent" } [The south-west hall] -> hall_elder_regent
+ { met ? "elder-architect" } [The north-east hall] -> hall_elder_architect
+ { met ? "elder-diplomat" } [The east hall, middle] -> hall_elder_diplomat
+ { met ? "elder-sage" } [The south-east hall] -> hall_elder_sage
+ [Back] -> halls

// The first Elder, met when the player walks into her hall (guide.js opens the sheet there with the page's "at" entry).
=== elder_meet ===
# title: The Elder of the north-west hall
{ not (met ? "elder-shaman"):
  ~ met = met + ",elder-shaman"
}
~ waiting_hall = "elder-shaman"
~ waiting_line = "She is waiting to hear what you saw at the forest edge."
Something has been following you since the settlements. Take this lantern to the forest edge and look at what it lights.
Come back and tell me what you saw. Then I will know what you came here for.
+ [Go to the forest edge] -> go_forest_edge
+ [Not today] -> elder_not_today

=== go_forest_edge ===
# title: The Elder of the north-west hall
Follow the west lane to its north end. The lantern will show you.
# done: true
-> END

=== elder_not_today ===
# title: The Elder of the north-west hall
Then keep the lantern. I will be here.
# done: true
-> END

=== hall_altar ===
~ last_hall = "the Altar"
# title: The Altar
# path: altar
The Altar sits at the far north, inside a dark stone room with two cushions. Go in quietly. Two people can sit.
-> after_hall
=== hall_founders_hall ===
~ last_hall = "Founder's Hall"
# title: Founder's Hall
# path: founders-hall
Founder's Hall is the big room straight up the avenue, with six School banners on its north wall. Twenty-four people can sit there at once.
-> after_hall
=== hall_elder_shaman ===
~ last_hall = "the north-west hall"
# title: The Gate Steward
# path: elder-shaman
That is the north hall on the west lane.
-> after_hall
=== hall_elder_architect ===
~ last_hall = "the north-east hall"
# title: The Gate Steward
# path: elder-architect
That is the north hall on the east lane.
-> after_hall
=== hall_elder_challenger ===
~ last_hall = "the west hall, middle"
# title: The Gate Steward
# path: elder-challenger
That is the middle hall on the west lane.
-> after_hall
=== hall_elder_regent ===
~ last_hall = "the south-west hall"
# title: The Gate Steward
# path: elder-regent
That is the south hall on the west lane.
-> after_hall
=== hall_elder_diplomat ===
~ last_hall = "the east hall, middle"
# title: The Gate Steward
# path: elder-diplomat
That is the middle hall on the east lane.
-> after_hall
=== hall_elder_sage ===
~ last_hall = "the south-east hall"
# title: The Gate Steward
# path: elder-sage
That is the south hall on the east lane.
-> after_hall
=== hall_dojo ===
~ last_hall = "the Dojo"
# title: The Dojo
# path: dojo
The Dojo is the boarded hall west of the avenue, down a short step from the gate court. Eight seats, a weapon rack and a bench at the back.
-> after_hall
=== hall_tea_library ===
~ last_hall = "the Tea Library"
# title: The Tea Library
# path: tea-library
The Tea Library is the green-walled room east of the avenue, with four shelves along its north wall and four seats.
-> after_hall
=== hall_gate_court ===
~ last_hall = "the Gate Court"
# title: The Gate Court
You are standing in it. The torii is behind you, and the notice board is to your left.
-> after_hall

=== after_hall ===
+ [Show me another hall] -> halls
+ [That is enough for now] -> bye

=== bye ===
# title: The Gate Steward
# done: true
Walk well. I will be here by the torii.
-> END
