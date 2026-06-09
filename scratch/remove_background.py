import PIL.Image
import os
from collections import deque

img_path = r"C:\Users\USER\.gemini\antigravity-ide\brain\3502d7a1-0bc3-46ec-85bc-b7262c66da87\media__1780944208094.png"
output_path = r"c:\Users\USER\OneDrive\Desktop\Ai_journal\my-genai-hub\apps\web\public\logo.png"

if not os.path.exists(img_path):
    print("File not found:", img_path)
    exit()

img = PIL.Image.open(img_path).convert("RGBA")
width, height = img.size

# We will perform a BFS flood fill from all borders to find and remove background pixels.
# A pixel is background if it is grayscale and r > 140.
visited = [[False for _ in range(width)] for _ in range(height)]
mask = [[False for _ in range(width)] for _ in range(height)] # True means transparent

queue = deque()

# Add all border pixels to the queue
for x in range(width):
    queue.append((x, 0))
    queue.append((x, height - 1))
    visited[0][x] = True
    visited[height - 1][x] = True

for y in range(height):
    queue.append((0, y))
    queue.append((width - 1, y))
    visited[y][0] = True
    visited[y][width - 1] = True

def is_background(r, g, b):
    # Grayscale check
    is_gray = abs(r - g) <= 12 and abs(g - b) <= 12 and abs(r - b) <= 12
    # Light pixel check (checkerboard squares are r > 160)
    # Also include the slightly darker squares (around 170)
    return is_gray and r > 150

while queue:
    x, y = queue.popleft()
    r, g, b, a = img.getpixel((x, y))
    
    if is_background(r, g, b):
        mask[y][x] = True
        
        # Check neighbors
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height:
                if not visited[ny][nx]:
                    visited[ny][nx] = True
                    queue.append((nx, ny))

new_data = []
for y in range(height):
    for x in range(width):
        r, g, b, a = img.getpixel((x, y))
        if mask[y][x]:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append((r, g, b, a))

new_img = PIL.Image.new("RGBA", (width, height))
new_img.putdata(new_data)

# Auto-crop the transparent edges
bbox = new_img.getbbox()
if bbox:
    new_img = new_img.crop(bbox)

os.makedirs(os.path.dirname(output_path), exist_ok=True)
new_img.save(output_path, "PNG")
print("Saved perfect transparent logo to:", output_path)
print("New logo dimensions:", new_img.size)
