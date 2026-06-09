import PIL.Image
import os

logo_path = r"c:\Users\USER\OneDrive\Desktop\Ai_journal\my-genai-hub\apps\web\public\logo.png"
mark_path = r"c:\Users\USER\OneDrive\Desktop\Ai_journal\my-genai-hub\apps\web\public\logo-mark.png"

if not os.path.exists(logo_path):
    print("Logo not found:", logo_path)
    exit()

img = PIL.Image.open(logo_path)
width, height = img.size

# We will scan the rows from top to bottom to find the horizontal gap between the bulb and the text.
# For each row, count the number of non-transparent pixels (alpha > 0).
row_counts = []
for y in range(height):
    count = 0
    for x in range(width):
        r, g, b, a = img.getpixel((x, y))
        if a > 10:
            count += 1
    row_counts.append(count)

# Find the gap: a row in the middle 40% to 70% of the height that has the minimum number of colored pixels.
# The bulb is at the top, the text "GENAI" is below it, and "ACADEMY & HUB" is at the bottom.
# Let's see if there is a gap between the bulb tip (base) and the text "GENAI".
# Let's inspect rows from 50% to 65% of the height.
min_row = -1
min_count = width
for y in range(int(height * 0.45), int(height * 0.65)):
    if row_counts[y] < min_count:
        min_count = row_counts[y]
        min_row = y

print(f"Detected gap row: {min_row} with count: {min_count}")

# Let's crop the bulb mark (from y=0 to y=min_row)
# We add a few pixels buffer
crop_y = min_row
mark_img = img.crop((0, 0, width, crop_y))

# Crop transparent borders of the mark
bbox = mark_img.getbbox()
if bbox:
    mark_img = mark_img.crop(bbox)

mark_img.save(mark_path, "PNG")
print("Saved transparent logo-mark to:", mark_path)
print("Logo-mark dimensions:", mark_img.size)
