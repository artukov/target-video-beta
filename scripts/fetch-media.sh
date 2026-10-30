#!/usr/bin/env bash
set -euo pipefail

dest=$(cd "$(dirname "$0")/.." && pwd)/media-src
ua='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
mkdir -p "$dest"

get() {
  [ -s "$dest/$2" ] && return
  curl -fsSL -A "$ua" -o "$dest/$2.part" "$1"
  mv "$dest/$2.part" "$dest/$2"
}

# The Pexels pages sit behind a Cloudflare challenge, the file host does not.
get https://videos.pexels.com/video-files/7599305/7599305-hd_1080_2048_25fps.mp4 pexels-7599305.mp4
get https://videos.pexels.com/video-files/9870659/9870659-hd_1080_2048_25fps.mp4 pexels-9870659.mp4
get https://assets.mixkit.co/videos/51404/51404-1080.mp4 mixkit-51404-1080.mp4
get https://assets.mixkit.co/videos/40746/40746-1080.mp4 mixkit-40746-1080.mp4
get 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Dark%20Fog.mp3' dark-fog.mp3

ls -l "$dest"
