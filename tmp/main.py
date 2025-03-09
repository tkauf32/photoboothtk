import requests
import json 
import io
import os
import base64
from datetime import datetime
from PIL import Image, PngImagePlugin

# Get current timestamp for unique folder naming
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

# Create an output folder for this request
output_folder = os.path.join("outputs", timestamp)
os.makedirs(output_folder, exist_ok=True)

# Define your prompt dictionary with various styling options.
prompt = {}
prompt['Lego'] = (
    "Transform all people into detailed Lego minifigures, maintaining their unique features, clothing colors, "
    "and hairstyles. Render in a realistic Lego style with smooth plastic textures, defined edges, and subtle lighting. "
    "Ensure accurate facial expressions and iconic Lego-style eyes and mouths. Background elements should match the Lego aesthetic, "
    "appearing as brick-built structures. ((Highly detailed)), ((sharp focus)), ((cinematic lighting))."
)
prompt['Medieval'] = (
    "Transform all people into medieval fantasy characters, with period-accurate clothing, armor, and accessories. "
    "Stylize their attire based on status (royalty, knights, peasants, etc.), ensuring ornate embroidery, chainmail, or rugged fabrics where appropriate. "
    "Retain defining facial features while enhancing them with a hand-painted, historical illustration feel. "
    "Background elements should reflect medieval settings such as castles, villages, or dense forests. "
    "((Epic fantasy painting style)), ((intricate details)), ((dramatic lighting and shadows))."
)
prompt['Pixar'] = (
    "Render all people in Pixar-style 3D animation, with smooth, expressive faces, large glossy eyes, and soft lighting. "
    "Retain their defining facial features while slightly exaggerating expressions and proportions for a friendly, stylized effect. "
    "Clothing should be detailed with high-quality fabric textures. Background elements should match Pixar’s polished, cinematic style. "
    "((Hyper-detailed rendering)), ((soft shadows and highlights)), ((Pixar movie aesthetic)), ((warm lighting))."
)
prompt['Simpsons'] = (
    "Convert into The Simpsons animated style, featuring bold outlines, exaggerated facial features, and yellow-toned skin. "
    "Maintain unique hairstyles, accessories, clothing while simplifying details to match the classic Simpsons aesthetic. "
    "Background elements should use the same flat, cartoonish color palette and perspective. "
    "((Consistent with The Simpsons universe)), ((2D animation style)), ((bold black outlines)), ((flat vibrant colors))."
)
prompt['Anime'] = (
    "Stylize all people in high-quality anime style, with expressive eyes, sharp facial features, and vibrant hair colors. "
    "Maintain accurate clothing details while enhancing them with clean cel-shading and soft lighting. "
    "The background should complement the anime aesthetic, using a mix of painterly and cel-shaded effects. "
    "((Highly detailed linework)), ((smooth shading)), ((soft glowing highlights)), ((dynamic expressions))."
)

# Choose which prompt key to use (e.g., 'Simpsons')
used_prompt_key = 'Simpsons'

# Function to encode an image file to a Base64 string.
def encode_image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Original input image path (we log its path rather than copying the file)
input_image_path = "inputs/image_20250305222704.png"  # Replace with your actual image file path

# Convert the input image to Base64 (for the API request)
encoded_image = encode_image_to_base64(input_image_path)

# Build the JSON payload with the chosen prompt style.
payload = {
    "init_images": [encoded_image],  # Required by the API (but will not be logged)
    "prompt": prompt[used_prompt_key],
    "save_images": True,
    "send_images": True,
    "steps": 20,
    "cfg_scale": 1.0,
    "distilled_cfg_scale": 3.5,
    "tiling": False,
    "sampler_name": "Euler",
    "scheduler": "simple",
    "denoising_strength": 0.75,
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

# Prepare a copy of the payload for logging, replacing the init_images with a reference to the image path.
payload_for_log = payload.copy()
payload_for_log["init_image_path"] = input_image_path
if "init_images" in payload_for_log:
    payload_for_log["init_images"] = input_image_path

# API endpoint URL
url = "http://192.168.4.88:7860"

# Send the payload to the API endpoint.
response = requests.post(f"{url}/sdapi/v1/img2img", json=payload)
r = response.json()

# If the request is successful, process the response.
if response.status_code == 200:
    modified_images = []
    # Loop through each returned image.
    for idx, image_b64 in enumerate(r.get('images', [])):
        # Decode the Base64 string to create an image object.
        image = Image.open(io.BytesIO(base64.b64decode(image_b64.split(",", 1)[0])))

        # Request additional PNG metadata (specifically, the "parameters" field).
        png_payload = {
            "image": "data:image/png;base64," + image_b64
        }
        response2 = requests.post(f"{url}/sdapi/v1/png-info", json=png_payload)
        parameters = response2.json().get("info")
        pnginfo = PngImagePlugin.PngInfo()
        pnginfo.add_text("parameters", parameters)

        # Save the image with its metadata in a unique file.
        output_image_path = os.path.join(output_folder, f"output_{idx}.png")
        image.save(output_image_path, pnginfo=pnginfo)
        print(f"Output image saved at {output_image_path}")
        # Append the file path to the list.
        modified_images.append(output_image_path)
    
    # Replace the original images list in the response with the output file paths.
    r['images'] = modified_images
else:
    print("Request failed:", response.status_code)
    print(response.text)

# Build the combined log that includes the prompt used, payload details, and the modified response.
combined_log = {
    "prompt_used": used_prompt_key,
    "payload": payload_for_log,
    "output": r  # Entire response with image paths in place of the Base64 data
}

# Write the combined log into a single file.
combined_log_path = os.path.join(output_folder, "combined.log")
with open(combined_log_path, "w") as f:
    f.write(json.dumps(combined_log, indent=4))
