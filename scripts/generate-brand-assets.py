"""Generate every Dame Coffee web and native icon from the approved master logo."""

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "brand/source/dame-dc-master.png"
BACKGROUND = (217, 217, 217, 255)


def square_master() -> Image.Image:
    source = Image.open(SOURCE).convert("RGBA")
    side = min(source.size)
    left = (source.width - side) // 2
    top = (source.height - side) // 2
    return source.crop((left, top, left + side, top + side))


def resized(image: Image.Image, size: int) -> Image.Image:
    return image.resize((size, size), Image.Resampling.LANCZOS)


def circular(image: Image.Image, size: int) -> Image.Image:
    artwork = resized(image, size)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((1, 1, size - 2, size - 2), fill=255)
    output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    output.paste(artwork, (0, 0), mask)
    return output


def transparent_mark(image: Image.Image, size: int, monochrome: bool = False) -> Image.Image:
    artwork = resized(image, size)
    pixels = []
    pixel_data = getattr(artwork, "get_flattened_data", artwork.getdata)()
    for red, green, blue, _alpha in pixel_data:
        is_red = red > 70 and red > green * 1.45 and red > blue * 1.45
        if not is_red:
            pixels.append((0, 0, 0, 0))
        elif monochrome:
            pixels.append((255, 255, 255, 255))
        else:
            pixels.append((red, green, blue, 255))
    artwork.putdata(pixels)

    foreground = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inset = int(size * 0.12)
    mark = artwork.resize((size - inset * 2, size - inset * 2), Image.Resampling.LANCZOS)
    foreground.alpha_composite(mark, (inset, inset))
    return foreground


def save_png(image: Image.Image, path: str) -> None:
    destination = ROOT / path
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "PNG", optimize=True)


master = square_master()
site_logo = resized(master, 1024)
circle_512 = circular(master, 512)

save_png(site_logo, "public/assets/dame-dc-logo-square.png")
save_png(circle_512, "app/icon.png")
save_png(resized(master, 180), "app/apple-icon.png")
save_png(circular(master, 192), "public/icon-192.png")
save_png(circle_512, "public/icon-512.png")
save_png(resized(master, 512), "public/app-icon-maskable-512.png")

favicon = circular(master, 256)
favicon.save(
    ROOT / "app/favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)

save_png(resized(master, 1024), "mobile/assets/icon.png")
save_png(resized(master, 1024), "mobile/assets/splash-icon.png")
save_png(circular(master, 192), "mobile/assets/favicon.png")
save_png(transparent_mark(master, 1024), "mobile/assets/android-icon-foreground.png")
save_png(transparent_mark(master, 1024, monochrome=True), "mobile/assets/android-icon-monochrome.png")
save_png(Image.new("RGBA", (1024, 1024), BACKGROUND), "mobile/assets/android-icon-background.png")
