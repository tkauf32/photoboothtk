import requests
import json 
import io
from PIL import Image, PngImagePlugin
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
# payload = {
#     "init_images": [encoded_image],
#     "prompt": ("Transform all people into detailed Lego minifigures, maintaining their unique features, clothing colors, "
#                "and hairstyles. Render in a realistic Lego style with smooth plastic textures, defined edges, and subtle lighting. "
#                "Ensure accurate facial expressions and iconic Lego-style eyes and mouths. Background elements should match the Lego aesthetic, "
#                "appearing as brick-built structures. ((Highly detailed)), ((sharp focus)), ((cinematic lighting))."),
#     "denoising_strength": 0.5,
#     "steps": 50,
#     "cfg_scale": 7,
#     "width": 512,
#     "height": 512,
#     "sampler_name": "Euler a",
#     "model": "flux1-dev-bnb-nf4-v2.safetensors",
#     "send_images": True,
#     "save_images": True,
# }

# API endpoint URL
url = "http://192.168.4.88:7860"

# payload = {
#     "forge_preset": "flux",
#     ""
#     "prompt": "puppy dog mountain",
#     "negative_prompt": "",  # Ensures no negative conditioning is applied
#     "sampler_name": "Euler",
#     "steps": 20,
#     "height": 512,
#     "width": 512,
#     "model": "flux1-dev-bnb-nf4-v2.safetensors",
# }

payload = {
    "prompt": "puppy dog mountain",
    "save_images": True,
    "send_images": True,
    "steps": 20,
    "cfg_scale": 1.0,
    "distilled_cfg_scale": 3.5,
    "tiling": False,
    "sampler_name": "Euler",
    "scheduler": "simple",
    "override_settings": {
        'forge_preset': 'flux', 
        'forge_additional_modules': [], 
        'forge_canvas_plain': False, 
        'forge_canvas_toolbar_always': False, 
        'enable_prompt_comments': True, 
        'sd_t2i_width': 512.0, 
        'sd_t2i_height': 640.0, 
        'sd_t2i_cfg': 7.0, 
        'sd_t2i_hr_cfg': 7.0, 
        'sd_i2i_width': 512.0, 
        'sd_i2i_height': 512.0, 
        'sd_i2i_cfg': 7.0, 
        'xl_t2i_width': 896.0, 
        'xl_t2i_height': 1152.0, 
        'xl_t2i_cfg': 5.0, 
        'xl_t2i_hr_cfg': 5.0, 
        'xl_i2i_width': 1024.0, 
        'xl_i2i_height': 1024.0,
        'xl_i2i_cfg': 5.0, 
        'xl_GPU_MB': 2774.0, 
        'flux_t2i_width': 512.0, 
        'flux_t2i_height': 512.0, 
        'flux_t2i_cfg': 1.0, 
        'flux_t2i_hr_cfg': 1.0, 
        'flux_t2i_d_cfg': 3.5, 
        'flux_t2i_hr_d_cfg': 3.5, 
        'flux_i2i_width': 1024.0, 
        'flux_i2i_height': 1024.0, 
        'flux_i2i_cfg': 1.0, 
        'flux_i2i_d_cfg': 3.5, 
        'flux_GPU_MB': 2774.0, 
        'sd_model_checkpoint': 'flux1-dev-bnb-nf4-v2.safetensors',
        "tiling": False,
    }
}

        # 'stream': False,
        # 'inference_memory': 1024.0,
        # 'pin_shared_memory': False,

# Send said payload to said URL through the API.
# options = requests.get('http://192.168.4.88:7860/sdapi/v1/options')
# print(options.json())
# postreq = requests.post("http://192.168.4.88:7860/sdapi/v1/options", json={"forge_preset": "flux"})

response = requests.post("http://192.168.4.88:7860/sdapi/v1/txt2img", json=payload)

# modelResponse = requests.post(url=f'{url}/sdapi/v1/options)', json={"sd_model_checkpoint": "flux1-dev-bnb-nf4-v2.safetensors"})

# response = requests.post(url=f'{url}/sdapi/v1/txt2img', json=payload)
r = response.json()
print(r)

if response.status_code == 200:
    for i in r['images']:
        image = Image.open(io.BytesIO(base64.b64decode(i.split(",",1)[0])))

        png_payload = {
            "image": "data:image/png;base64," + i
        }
        response2 = requests.post(url=f'{url}/sdapi/v1/png-info', json=png_payload)

        pnginfo = PngImagePlugin.PngInfo()
        pnginfo.add_text("parameters", response2.json().get("info"))
        image.save('output.png', pnginfo=pnginfo)


# # Decode and save the image.
# with open("output.png", 'wb') as f:
#     f.write(base64.b64decode(r['images'][0]))

# # Check if the request was successful
# if response.status_code == 200:
#     result = response.json()
#     # The response should have an "images" key containing a list of Base64 strings.
#     if "images" in result and result["images"]:
#         generated_image_b64 = result["images"][0]
#         # Define an output file name (use .png since the returned Base64 string looks like PNG data)
#         decode_base64_to_image(generated_image_b64, output_image_path)
#         print(output_image_path)
#         open(output_image_path)
#     else:
#         print("No images found in the response.")
# else:
#     print("Request failed:", response.status_code)
#     print(response.text)
