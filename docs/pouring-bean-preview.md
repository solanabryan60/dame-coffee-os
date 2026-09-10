# Pouring Bean homepage preview

Preview branch: `agent/pouring-bean-homepage`. Do not promote to production without approval.

Only the homepage hero is changed. Existing navigation, logo, ordering, live location, events, and footer remain in place. The video component and original mascot files are preserved.

## Revision 2 — restore the original composition

The first split-layout concept was rejected. Restore the original landing classes, original heading and supporting copy, original actions and scroll cue. Remove all newly added captions and the bottom slogan strip. The mascot belongs within the full-screen scene, not in a new block beneath the copy. On phones it occupies the upper visual space, with the original copy below.

Active asset: `public/assets/bean-states/bean-pouring-open-eyes-v2.png`, created with the built-in image tool directly from the ORIGINAL `bean-pouring.png`; `bean-confused.png` supplies only the smaller oval eye style. Keep the earlier asset for reference but do not render it.

Revision 2 prompt:

> Precise minimal mascot edit. Image 1 is the EDIT TARGET; reproduce this exact original Pouring Bean, preserving its proportions, thin soft hand-drawn brown-burgundy outline, small puckered lips on the long central face seam, slim little limbs, tilted pitcher, iced plastic cup and ledge. Image 2 is ONLY an eye-style reference: small narrow oval pupils and a subtle friendly eyebrow, NOT large black circles. Replace only the two closed U-shaped eyes on Image 1 with small narrow open oval eyes like Image 2; retain ALL of Image 1's body and face geometry. Remove steam above cold iced cup. Do not thicken the outlines, enlarge eyes, widen body, add shadows, darken all the lines, or redesign this character. Flat opaque white fill. Background: perfectly solid flat #961010 red outside mascot, no gradient, texture, grain, shadow, vignette, checkerboard or decoration. Whole original character and ledge visible, same framing. No words. This must look like the SAME original character with his eyes opened, not a newly drawn alternative.

## Artwork

Saved asset: `public/assets/bean-states/bean-pouring-open-eyes-red.png`.

Created with the built-in image generation tool using the original `bean-pouring.png` as the edit target. The first edit opened both eyes as small burgundy ovals and removed steam from the iced drink while retaining the white body, burgundy outlines, pouring jug, iced plastic cup and counter. The first background result was rejected because it contained a checkerboard.

Final background-edit prompt:

> Edit only the background of this exact mascot illustration. Replace ALL checkerboard and textured background outside the character with a perfectly flat, uniform solid Dame red color, HEX #961010 (RGB 150,16,16). No texture, no gradients, no vignette, no shadows, no checkerboard, no transparent background this time. Keep the white-filled open-eyed Pouring Bean, dark burgundy outlines, pouring jug and iced coffee cup and counter exactly unchanged. Smooth clean edges against solid red. Maintain full composition, pose, open eyes, proportions. Do not add text or other objects.

The image's outer padding fades into the hero background in CSS. The character itself stays opaque white. This is an illustration, not a pouring animation.
