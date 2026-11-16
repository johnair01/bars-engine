"""The two arm checks J7 runs on the Integrate action's last key. Plain Python, so the offline tier can run them at
chosen hand heights without Blender (test_offline.py J7b).

Each takes one forearm as a vector from elbow to wrist (x, y, z in metres, Z up, the figure facing -Y) and the side,
"L" or "R", and returns a list of problems, empty when the arm passes.

  general_arm_problems   the floor, main's check from Wendell's 2026-10-16 ruling: a hand MAY be held out. The forearm
                         ends hanging or held out, never raised more than a fifth of its length above its elbow. It
                         passes any such stance, a hanging right arm included.
  honored_form_problems  this build's honored form, a regression guard on character.py HONORED["controller"]: the left
                         forearm hangs (its drop at least half its length), the right is offered forward (at least half
                         its length forward of its elbow, no more than 5 cm above it). It fails a stance that drifts
                         from the shipped offer, so the offered hand cannot vanish without a build failing. It is not
                         law: a ruling that the offer is required would promote it to the floor.

Both run in J7. The pass record is bars-engine store records/pr426-arms-check_2026-11-14, ruled A on 2026-11-14.
"""
HANGING, OFFERED = "L", "R"   # HONORED["controller"] in character.py (2026-10-17)
RAISED_LIMIT = 0.2            # of the forearm's length above its elbow (general check)
DROP_MIN = 0.5                # of its length, the hanging forearm's drop (honored form)
REACH_MIN = 0.5               # of its length, the offered forearm's reach forward (honored form)
CEILING = 0.05                # metres above its elbow, the offered hand's most (honored form)


def length(fore):
    return (fore[0] ** 2 + fore[1] ** 2 + fore[2] ** 2) ** 0.5


def general_arm_problems(s, fore):
    n = length(fore)
    if -fore[2] < -RAISED_LIMIT * n:
        return [f"general check: forearm {s} ends raised"]
    return []


def honored_form_problems(s, fore):
    n = length(fore)
    if s == HANGING and -fore[2] < DROP_MIN * n:
        return [f"honored form: forearm {s} does not end hanging: {(-fore[2]) * 100:.1f} cm of drop over {n * 100:.1f} cm"]
    if s == OFFERED:
        out = []
        forward = -fore[1]                                    # the figure faces -Y
        if forward < REACH_MIN * n:
            out.append(f"honored form: the offered forearm {s} reaches only {forward * 100:.1f} cm forward of its elbow, "
                       f"of {n * 100:.1f} cm")
        if fore[2] > CEILING:
            out.append(f"honored form: the offered hand {s} ends {fore[2] * 100:.1f} cm above its elbow")
        return out
    return []
