#!/bin/bash
# make blurred vertical backgrounds for every jpg in a dir (writes bg/ subdir)
d=$1; mkdir -p $d/bg
for f in $d/*.jpg; do b=$(basename $f .jpg); [ -f $d/bg/$b.jpg ] && continue
ffmpeg -v error -y -i $f -vf "scale=-2:1920,crop=1080:1920,boxblur=40:3,eq=brightness=-0.28:saturation=1.3" -q:v 4 $d/bg/$b.jpg; done
