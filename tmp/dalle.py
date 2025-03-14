from openai import OpenAI
from PIL import Image
import io

client = OpenAI(
)

# Open the image file
img = Image.open('image_20250305222704.png')

# Convert the image to RGBA format
img = img.convert('RGBA')

img_byte_arr = io.BytesIO()
img.save(img_byte_arr, format='PNG')
img_byte_arr = img_byte_arr.getvalue()

# Define the size of the image (width, height)
size = (1024, 686)

# Create a new image with an RGBA mode (including alpha channel)
mask = Image.open('centered_rectangle.png')
mask = mask.convert('RGBA')

mask_byte_arr = io.BytesIO()
mask.save(mask_byte_arr, format='PNG')
mask_byte_arr = mask_byte_arr.getvalue()

response = client.images.edit(
    image=img_byte_arr,
	  mask=mask_byte_arr,
    prompt="A festive scene with one or more people posing for the camera at a party. The individuals should remain mostly unchanged, though they can be lightly enhanced with accessories such as party hats, shamrocks, or Celtic jewelry. Transform the background to depict a picturesque Irish setting, with lush green rolling hills, stone fences, and a traditional Irish cottage in the distance. Add subtle hints of an Irish celebration, such as flags or bunting with Irish colors, without altering the main subjects too much. The scene should feel vibrant and cheerful, with warm natural lighting that complements the lively atmosphere.",
    n=1,
    size="1024x1024",
)

print(response)