import requests
import base64
from datetime import datetime

# Get current timestamp
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

# Create filename with timestamp
output_image_path = f"output_{timestamp}.png"

def encode_image_to_base64(image_path):
    """
    Reads an image file and returns a Base64-encoded string.
    Ensures the output is a single continuous string.
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def decode_base64_to_image(base64_string, output_path):
    """
    Decodes a Base64 string back into an image file.
    """
    with open(output_path, "wb") as out_file:
        out_file.write(base64.b64decode(base64_string))
    print(f"Image saved as {output_path}")

# Path to your input image file
input_image_path = "image_20250305222704.png"  # Replace with your actual image file path

# Convert the input image to Base64
encoded_image = encode_image_to_base64(input_image_path)

# Build the JSON payload using your provided raw JSON
payload = {
    "init_images": [encoded_image],
    "prompt": ("Transform all people into detailed Lego minifigures, maintaining their unique features, clothing colors, "
               "and hairstyles. Render in a realistic Lego style with smooth plastic textures, defined edges, and subtle lighting. "
               "Ensure accurate facial expressions and iconic Lego-style eyes and mouths. Background elements should match the Lego aesthetic, "
               "appearing as brick-built structures. ((Highly detailed)), ((sharp focus)), ((cinematic lighting))."),
    "denoising_strength": 0.5,
    "steps": 50,
    "cfg_scale": 7,
    "width": 512,
    "height": 512,
    "sampler_name": "Euler a",
    "model": "flux1-dev-bnb-nf4-v2.safetensors",
    "send_images": True,
    "save_images": True,
}

# API endpoint URL
url = "http://192.168.4.88:7860/sdapi/v1/img2img"

# Set headers (the API expects JSON)
headers = {"Content-Type": "application/json"}

# Send the POST request to the API
response = requests.post(url, headers=headers, json=payload)

# Check if the request was successful
if response.status_code == 200:
    result = response.json()
    # The response should have an "images" key containing a list of Base64 strings.
    if "images" in result and result["images"]:
        generated_image_b64 = result["images"][0]
        # Define an output file name (use .png since the returned Base64 string looks like PNG data)
        decode_base64_to_image(generated_image_b64, output_image_path)
        print(output_image_path)
        open(output_image_path)
    else:
        print("No images found in the response.")
else:
    print("Request failed:", response.status_code)
    print(response.text)
