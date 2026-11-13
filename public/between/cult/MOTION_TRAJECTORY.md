# Motion trajectory review contract

The viewer must apply a clip's `rootForward` to the character holder. A label that reports travel while the holder stays still is a failed review. The browser capture checks the holder displacement, not the label.

The run has two contact cycles per 0.64 s loop. `run-dynamics.js` defines foot strike, compression, toe-off, flight apex, and the next strike in each half-cycle. The cloud capture samples actual root heights at 0, .09, .35, and .5 of the full cycle and requires a lower compression frame, a higher flight frame, and a matching next strike. The motion-capture file still supplies limb directions. Foot placement and cloth collision are separate gates.

The jump has a .18 s preload, .28 s takeoff, .96 s landing, and 1.12 s recovery. Between takeoff and landing, horizontal speed is constant and vertical height follows gravity at 9.81 m/s². The cloud capture checks forward displacement at takeoff, midair, and descent, plus an airborne apex. The preflight crouch and recovery remain authored pose keys. The transition from landing into walk or run is not yet implemented.
