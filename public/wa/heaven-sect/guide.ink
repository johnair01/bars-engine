// The Gate Steward: a new player's guide to the Heaven Sect court. Every line here is a Claude draft for Wendell's edit.
// Tags drive the page: "# title:" names the speaker line, "# path: <hall id>" lights that hall's path and walks the player.
// The page seeds `visits` and `last_hall` from WA.player.state and saves them back, so a returning player is greeted differently.
VAR visits = 0
VAR last_hall = ""
-> start

=== start ===
# title: The Gate Steward
{ visits == 0:
  Welcome to the Heaven Sect. I keep this gate. Ask me anything, or walk on; every hall is open to you either way.
- else:
  You are back.{ last_hall != "": Last time I sent you to {last_hall}.} Do you want the halls again, or are you walking on your own?
}
~ visits = visits + 1
-> menu

=== menu ===
+ [Where am I?] -> where
+ [Show me the halls] -> halls
+ [Who are the Elders?] -> elders
+ [I'll explore on my own] -> bye

=== where ===
# title: The Gate Steward
This is the Gate Court, the paved square inside the torii. The two lanes run north from here along the edges of the sect. Founder's Hall stands in the middle, with the Altar behind it. The six Elders each keep a hall on the west and east sides.
-> menu

=== halls ===
# title: The Gate Steward
Choose a place and I will light the way, and walk you there if your window lets me.
+ [The Altar] -> hall_altar
+ [Founder's Hall] -> hall_founders_hall
+ [The six Elders' halls] -> elder_halls
+ [The Dojo] -> hall_dojo
+ [The Tea Library] -> hall_tea_library
+ [The Gate Court] -> hall_gate_court
+ [Back] -> menu

=== elder_halls ===
# title: The Gate Steward
Each Elder keeps a hall along the two lanes. Choose one and I will light the way.
+ [The Shaman Elder] -> hall_elder_shaman
+ [The Architect Elder] -> hall_elder_architect
+ [The Challenger Elder] -> hall_elder_challenger
+ [The Regent Elder] -> hall_elder_regent
+ [The Diplomat Elder] -> hall_elder_diplomat
+ [The Sage Elder] -> hall_elder_sage
+ [Back] -> halls

=== elders ===
# title: The Gate Steward
Six Elders, one for each face of the Game Master. Each asks one question of whatever you bring.
The Shaman Elder asks what is moving underneath. The Architect Elder asks what must be true in the machine. The Challenger Elder asks what breaks, and what you broke yourself.
The Regent Elder asks what you owe, and what ships when. The Diplomat Elder asks who is left out, and what the community will accept. The Sage Elder asks what the smallest whole is.
+ [Show me their halls] -> elder_halls
+ [Back] -> menu

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
~ last_hall = "the Shaman Elder's hall"
# title: The Shaman Elder
# path: elder-shaman
The Shaman Elder keeps the north hall on the west lane. Bring a feeling you cannot name yet.
-> after_hall
=== hall_elder_architect ===
~ last_hall = "the Architect Elder's hall"
# title: The Architect Elder
# path: elder-architect
The Architect Elder keeps the north hall on the east lane. Bring something that has to hold weight.
-> after_hall
=== hall_elder_challenger ===
~ last_hall = "the Challenger Elder's hall"
# title: The Challenger Elder
# path: elder-challenger
The Challenger Elder keeps the middle hall on the west lane. Bring the plan you most want to survive.
-> after_hall
=== hall_elder_regent ===
~ last_hall = "the Regent Elder's hall"
# title: The Regent Elder
# path: elder-regent
The Regent Elder keeps the south hall on the west lane. Bring a promise with a date on it.
-> after_hall
=== hall_elder_diplomat ===
~ last_hall = "the Diplomat Elder's hall"
# title: The Diplomat Elder
# path: elder-diplomat
The Diplomat Elder keeps the middle hall on the east lane. Bring a person you have not spoken to yet.
-> after_hall
=== hall_elder_sage ===
~ last_hall = "the Sage Elder's hall"
# title: The Sage Elder
# path: elder-sage
The Sage Elder keeps the south hall on the east lane. Bring everything the other five said.
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
