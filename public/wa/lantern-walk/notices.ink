// The three Lantern Walk notices. Each page starts at its own knot (notice_1, notice_2, notice_3); the page copies
// the traveller's visit count from WA.player.state into visits_N before it starts and saves it back after each choice.
// Rebuild notices.json with: node compile_notices.mjs   (needs inkjs 2.4.0)
VAR visits_1 = 0
VAR visits_2 = 0
VAR visits_3 = 0
-> notice_1

=== notice_1 ===
# title: Someone who writes
Master Yun, who keeps the dojo gate, has three lines for his lantern that will not sit together and wants a second pair of eyes. He is waiting at the Reading Bench.
+ [Walk to the Reading Bench together] -> bench
+ [Walk on for now] -> later_1

=== later_1 ===
# title: Someone who writes
The notice stays lit. It will be here when you pass again.
-> END

=== bench ===
~ visits_1 = visits_1 + 1
# title: Reading Bench
{ visits_1 > 1:
  Master Yun is glad you came back. Tell the table how it went.
- else:
  Master Yun reads his three lines aloud, one at a time. Say which line you would keep. Then say who else here you would ask for help.
}
+ [Done for today] -> END

=== notice_2 ===
# title: Someone who builds
Master Yun, who keeps the dojo gate, has half a table and no one to hold the other end. He is waiting at the Workbench.
+ [Walk to the Workbench together] -> workbench
+ [Walk on for now] -> later_2

=== later_2 ===
# title: Someone who builds
The notice stays lit. It will be here when you pass again.
-> END

=== workbench ===
~ visits_2 = visits_2 + 1
# title: Workbench
{ visits_2 > 1:
  Master Yun is glad you came back. Tell the table how it went.
- else:
  Hold the other end of the table with Master Yun. Say what you would build next and who here would enjoy building it with you.
}
+ [Done for today] -> END

=== notice_3 ===
# title: Someone who listens
Master Yun, who keeps the dojo gate, has a decision he keeps circling and wants to say it out loud to one person. He is waiting at the Listening Stone.
+ [Walk to the Listening Stone together] -> stone
+ [Walk on for now] -> later_3

=== later_3 ===
# title: Someone who listens
The notice stays lit. It will be here when you pass again.
-> END

=== stone ===
~ visits_3 = visits_3 + 1
# title: Listening Stone
{ visits_3 > 1:
  Master Yun is glad you came back. Tell the table how it went.
- else:
  Sit beside Master Yun and listen without fixing. When he stops, say back the one thing you heard.
}
+ [Done for today] -> END
