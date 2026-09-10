# Pouring Bean homepage preview

Preview branch: `agent/pouring-bean-homepage`. Do not promote to production without approval.

Only the homepage hero is changed. Existing navigation, logo, ordering, live location, events, and footer remain in place. The video component and original mascot files are preserved.

## Artwork

Saved asset: `public/assets/bean-states/bean-pouring-open-eyes-red.png`.

Created with the built-in image generation tool using the original `bean-pouring.png` as the edit target. The first edit opened both eyes as small burgundy ovals and removed steam from the iced drink while retaining the white body, burgundy outlines, pouring jug, iced plastic cup and counter. The first background result was rejected because it contained a checkerboard.

Final background-edit prompt:

> Edit only the background of this exact mascot illustration. Replace ALL checkerboard and textured background outside the character with a perfectly flat, uniform solid Dame red color, HEX #961010 (RGB 150,16,16). No texture, no gradients, no vignette, no shadows, no checkerboard, no transparent background this time. Keep the white-filled open-eyed Pouring Bean, dark burgundy outlines, pouring jug and iced coffee cup and counter exactly unchanged. Smooth clean edges against solid red. Maintain full composition, pose, open eyes, proportions. Do not add text or other objects.

The image's outer padding fades into the hero background in CSS. The character itself stays opaque white. This is an illustration, not a pouring animation.
