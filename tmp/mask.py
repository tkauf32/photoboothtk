from PIL import Image, ImageDraw

# Set image dimensions
width, height = 480, 320

# Create an image with an RGBA mode and a transparent background
image = Image.new("RGBA", (width, height), (0, 0, 0, 0))

# Define dimensions of the centered rectangle
rect_width, rect_height = width / 2, height / 2

# Calculate coordinates for the rectangle
left = (width - rect_width) // 2
top = (height - rect_height) // 2
right = left + rect_width
bottom = top + rect_height

# Draw the rectangle with a solid color (e.g., white)
draw = ImageDraw.Draw(image)
draw.rectangle([left, top, right, bottom], fill=(255, 255, 255, 255))

# Save the image
image.save("centered_rectangle.png")
