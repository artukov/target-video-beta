#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
src=$root/media-src
out=$root/assets/video
music=$src/dark-fog.mp3

fps=24
crf=23
gain=-2dB

# in/out are seconds into the source file. Keep each segment a whole number of
# seconds so the cuts land on the 1 s keyframes. y is the top of the 1920 px
# window cut from the 1080x2048 Pexels files; the Mixkit files are already 9:16.
ep1_a=$src/pexels-7599305.mp4;    ep1_a_in=3.6; ep1_a_out=14.6; ep1_a_y=64
ep1_b=$src/mixkit-51404-1080.mp4; ep1_b_in=6.0; ep1_b_out=14.0; ep1_b_y=0
ep1_black=1
ep1_music_in=1.2  # Dark Fog opens with 1.6 s of near silence; this puts its first hit half a second in
ep1_music_fade=0.005  # 5 ms ramp so the stop at the cut does not click

ep2_a=$src/pexels-9870659.mp4;    ep2_a_in=3.0; ep2_a_out=17.0; ep2_a_y=0
ep2_b=$src/mixkit-40746-1080.mp4; ep2_b_in=2.9; ep2_b_out=10.9; ep2_b_y=0
ep2_black=0
ep2_music_in=27.9
ep2_music_fade=1.5

# thumb_at: seconds into the clip. thumb_y: top of the 405 px band cut from the
# 720x1280 frame. Episode 3 has no clip: it takes a native-size 720x1280 window
# (x, y) out of one frame of its source.
ep1_thumb_at=0.4; ep1_thumb_y=470
ep2_thumb_at=2.0; ep2_thumb_y=780
ep3_src=$src/pexels-7599305.mp4; ep3_at=30.2; ep3_x=330; ep3_y=300; ep3_thumb_y=400

for f in "$ep1_a" "$ep1_b" "$ep2_a" "$ep2_b" "$ep3_src" "$music"; do
  [ -s "$f" ] || { echo "missing $f, run scripts/fetch-media.sh" >&2; exit 1; }
done

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

calc() { awk "BEGIN { printf \"%g\", $1 }"; }
var() { local n=${1}_${2}; echo "${!n}"; }

seg() { # crop_y frames
  echo "setpts=PTS-STARTPTS,fps=$fps,trim=end_frame=$2,crop=iw:iw*16/9:0:$1,scale=720:1280:flags=lanczos,setsar=1,format=yuv420p"
}

encode() {
  local ep=$1 a_len b_len black fade music_len total g n=2 labels='[a][b]'
  a_len=$(calc "$(var "$ep" a_out) - $(var "$ep" a_in)")
  b_len=$(calc "$(var "$ep" b_out) - $(var "$ep" b_in)")
  black=$(var "$ep" black)
  fade=$(var "$ep" music_fade)
  music_len=$(calc "$a_len + $b_len")
  total=$(calc "$music_len + $black")

  g="[0:v]$(seg "$(var "$ep" a_y)" "$(calc "int($a_len * $fps + 0.5)")")[a];"
  g+="[1:v]$(seg "$(var "$ep" b_y)" "$(calc "int($b_len * $fps + 0.5)")")[b];"
  if [ "$black" != 0 ]; then
    g+="color=c=black:s=720x1280:r=$fps:d=$black,format=yuv420p,setsar=1[k];"
    labels+='[k]'
    n=3
  fi
  g+="${labels}concat=n=$n:v=1:a=0[v];"
  g+="[2:a]aresample=48000,aformat=channel_layouts=stereo,atrim=duration=$music_len,volume=$gain,"
  g+="afade=t=in:d=0.3,afade=t=out:st=$(calc "$music_len - $fade"):d=$fade,apad=whole_dur=$total[a]"

  ffmpeg -nostdin -v error -y \
    -ss "$(var "$ep" a_in)" -i "$(var "$ep" a)" \
    -ss "$(var "$ep" b_in)" -i "$(var "$ep" b)" \
    -ss "$(var "$ep" music_in)" -i "$music" \
    -filter_complex "$g" -map '[v]' -map '[a]' \
    -c:v libx264 -preset slow -profile:v high -level 4.0 -crf "$crf" \
    -g "$fps" -keyint_min "$fps" -sc_threshold 0 -x264-params aq-mode=3 \
    -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
    -c:a aac -b:a 128k -ar 48000 -ac 2 \
    -t "$total" -map_metadata -1 -fflags +bitexact -flags:v +bitexact -flags:a +bitexact \
    -movflags +faststart "$tmp/$ep.mp4"
  mv "$tmp/$ep.mp4" "$out/vl-$ep.mp4"
}

# ffmpeg tags the png as BT.709 and sips keeps that profile, so iOS draws the
# stills with the same transfer curve as the video.
rgb='scale=in_color_matrix=bt709,format=rgb24'
ep3_frame="crop=720:1280:$ep3_x:$ep3_y,$rgb"

still() { # input seek filter dest
  ffmpeg -nostdin -v error -y -ss "$2" -i "$1" -frames:v 1 -vf "$3" "$tmp/still.png"
  sips -s format jpeg -s formatOptions 85 "$tmp/still.png" --out "$4" > /dev/null
}

stills() {
  local ep=$1 clip=$out/vl-$1.mp4
  still "$clip" 0 "$rgb" "$out/vl-$ep-poster.jpg"
  still "$clip" "$(var "$ep" thumb_at)" \
    "$rgb,crop=720:405:0:$(var "$ep" thumb_y),scale=480:270:flags=lanczos" "$out/vl-$ep-thumb.jpg"
}

report() {
  local f=$1 box
  box=$(ffprobe -v trace "$f" 2>&1 | grep -oE "type:'(ftyp|moov|mdat)' parent:'root'" \
    | sed -E "s/type:'([a-z]+)'.*/\1/" | paste -sd' ' - || true)
  echo "== $(basename "$f")"
  echo "video: $(ffprobe -v error -select_streams v:0 \
    -show_entries stream=codec_name,profile,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_frames \
    -of default=nw=1 "$f" | paste -sd' ' -)"
  echo "audio: $(ffprobe -v error -select_streams a:0 \
    -show_entries stream=codec_name,profile,channels,sample_rate -of default=nw=1 "$f" | paste -sd' ' -)"
  echo "duration: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f" | awk '{ printf "%.2f", $1 }') s," \
    "size: $(wc -c < "$f" | awk '{ printf "%.2f MB (%d bytes)", $1 / 1048576, $1 }')"
  ffprobe -v error -select_streams v:0 -skip_frame nokey -show_entries frame=pts_time -of csv=p=0 "$f" \
    | awk 'NR > 1 { d = $1 - p; if (min == "" || d < min) min = d; if (d > max) max = d } { p = $1 }
      END { printf "keyframes: %d, spacing %.2f-%.2f s\n", NR, min, max }'
  case "$box" in
    *moov*mdat*) echo "atoms: $box (moov before mdat, faststart ok)" ;;
    *) echo "atoms: $box (NOT faststart)" ;;
  esac
}

encode ep1
encode ep2
stills ep1
stills ep2
still "$ep3_src" "$ep3_at" "$ep3_frame" "$out/vl-ep3-poster.jpg"
still "$ep3_src" "$ep3_at" "$ep3_frame,crop=720:405:0:$ep3_thumb_y,scale=480:270:flags=lanczos" "$out/vl-ep3-thumb.jpg"

report "$out/vl-ep1.mp4"
report "$out/vl-ep2.mp4"
