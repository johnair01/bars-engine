#!/usr/bin/env bash
# Encode arrival.py's frames: shot1 and shot2 as MP4 (H.264) and WebM (VP9), each under 3 MB, no sound.
# Shot two gets its white-out here: the push fades to white into the cut (frame 46, arrival.py PUSH) and the road fades in from white.
#   bash encode.sh OUT        -> OUT/shot1.mp4 OUT/shot1.webm OUT/shot2.mp4 OUT/shot2.webm, sizes printed
set -euo pipefail
OUT=${1:?OUT}; PUSH=46
v1='format=yuv420p'
v2="[0]trim=end_frame=$PUSH,setpts=PTS-STARTPTS,fade=t=out:s=$((PUSH-12)):n=12:c=white[a];[0]trim=start_frame=$PUSH,setpts=PTS-STARTPTS,fade=t=in:s=0:n=16:c=white[b];[a][b]concat=n=2:v=1,format=yuv420p[v]"
for s in 1 2; do
  in=(-y -loglevel error -framerate 24 -i "$OUT/shot$s/%04d.png")
  if [ $s = 1 ]; then f=(-vf "$v1"); else f=(-filter_complex "$v2" -map "[v]"); fi
  ffmpeg "${in[@]}" "${f[@]}" -an -c:v libx264 -preset slow -crf 27 -movflags +faststart "$OUT/shot$s.mp4"
  ffmpeg "${in[@]}" "${f[@]}" -an -c:v libvpx-vp9 -crf 38 -b:v 0 -row-mt 1 -deadline good "$OUT/shot$s.webm"
done
for f in "$OUT"/shot?.mp4 "$OUT"/shot?.webm; do
  b=$(stat -c %s "$f"); echo "$(basename "$f") $b bytes"; [ "$b" -lt 3000000 ] || { echo "over 3 MB: $f" >&2; exit 1; }
done
