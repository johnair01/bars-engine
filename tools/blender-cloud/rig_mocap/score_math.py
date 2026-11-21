"""The run score's arithmetic, with no bpy: sagittal angle, RMS error, correlation, peak-to-peak, thresholds.

A bone's sagittal angle is how far it points forward of straight down, in degrees, seen from the side: the angle of its
head-to-tail direction in the plane of the walking direction and up (positive = forward). check.py samples it for the
retargeted figure and for the source BVH at the same phase of one cycle, and scores the figure against the source."""
import math

# Pass thresholds (degrees, ratio, correlation). Set from what a retarget of one subject can hold: the figure's legs and
# arms are proportioned differently from the actor's, so the bar is a shape match, not an exact copy.
THRESHOLDS = {"joint_rms_deg": 8.0, "swing_ratio_min": 0.75, "swing_ratio_max": 1.33, "opposition_max": -0.5}


def sagittal(d, fwd):
    """d, fwd: (x, y, z) world vectors, fwd horizontal and unit. Degrees forward of straight down."""
    return math.degrees(math.atan2(d[0] * fwd[0] + d[1] * fwd[1], -d[2]))


def rms(a, b):
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)) / len(a))


def corr(a, b):
    ma, mb = sum(a) / len(a), sum(b) / len(b)
    num = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    den = math.sqrt(sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b))
    return num / den if den else 0.0


def p2p(a):
    return max(a) - min(a)


def score(fig, src):
    """fig, src: {"thigh.L": [deg per sample], ...} for thigh, shin, upper_arm, forearm on .L and .R, same sample count.
    Returns the numbers and the verdict against THRESHOLDS."""
    T = THRESHOLDS
    joint = {k: round(rms(fig[k], src[k]), 1) for k in fig}
    swing, opp, deg = {}, {}, {}
    for s in ("L", "R"):
        deg[s] = {"figure": round(p2p(fig["upper_arm." + s]), 1), "source": round(p2p(src["upper_arm." + s]), 1)}
        swing[s] = round(p2p(fig["upper_arm." + s]) / max(p2p(src["upper_arm." + s]), 1e-6), 2)
        opp[s] = {"figure": round(corr(fig["upper_arm." + s], fig["thigh." + s]), 2),
                  "source": round(corr(src["upper_arm." + s], src["thigh." + s]), 2)}
    fails = [f"{k} off by {v} deg" for k, v in joint.items() if v > T["joint_rms_deg"]]
    fails += [f"arm swing {s} is {r} of the source" for s, r in swing.items() if not T["swing_ratio_min"] <= r <= T["swing_ratio_max"]]
    fails += [f"arm {s} not opposed to its leg ({o['figure']})" for s, o in opp.items() if o["figure"] > T["opposition_max"]]
    return {"joint_rms_deg": joint, "arm_swing_deg": deg, "arm_swing_ratio": swing, "arm_leg_correlation": opp, "thresholds": T,
            "pass": not fails, "fails": fails}
