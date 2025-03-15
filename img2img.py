import argparse
import requests
import json 
import io
import os
import base64
from datetime import datetime
from PIL import Image, PngImagePlugin

prompt = {}
prompt['Lego'] = (
    "Transform all people into detailed LEGO minifigures, maintaining their unique features, clothing colors, "
    "and hairstyles. Render in a realistic LEGO style with smooth plastic textures, defined edges, and subtle lighting. "
    "Ensure accurate facial expressions and iconic LEGO-style eyes and mouths. Background elements should match the Lego aesthetic, "
    "appearing as brick-built structures. ((LEGO)), ((Highly detailed)), ((sharp focus)), ((cinematic lighting))."
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

timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

def get_image_paths(directory_path):
    images_paths = []
    files = os.listdir(directory_path)

    for file_name in files:
        file_path = os.path.join(directory_path, file_name)
        images_paths.append(file_path)

    return images_paths

def encode_image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')
    
# Removed duplicate encode_image_to_base64 definition

def img2img(base_url, encoded_image, input_image_path, prompt_key, output_directory):
    print(f"Working on {input_image_path}")
    
    payload = {
        "init_images": [encoded_image],  # Required by the API (but will not be logged)
        "prompt": prompt[prompt_key],
        "save_images": True,
        "send_images": True,
        "steps": 5,
        "cfg_scale": 1.0,
        "distilled_cfg_scale": 3.5,
        "tiling": False,
        "sampler_name": "Euler",
        "scheduler": "simple",
        "denoising_strength": 0.7,
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

    payload_for_log = payload.copy()
    payload_for_log["init_image_path"] = input_image_path
    if "init_images" in payload_for_log:
        payload_for_log["init_images"] = input_image_path

    response = requests.post(f"{base_url}/sdapi/v1/img2img", json=payload)
    r = response.json()

    now = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    output_image_path = None  # ADDED CODE: Initialize variable to store output image path
    if response.status_code == 200:
        modified_images = []
        for idx, image_b64 in enumerate(r.get('images', [])):
            image = Image.open(io.BytesIO(base64.b64decode(image_b64.split(",", 1)[0])))

            png_payload = {
                "image": "data:image/png;base64," + image_b64
            }
            response2 = requests.post(f"{base_url}/sdapi/v1/png-info", json=png_payload)
            parameters = response2.json().get("info")
            pnginfo = PngImagePlugin.PngInfo()
            pnginfo.add_text("parameters", parameters)

            output_image_path = os.path.join(output_directory, f"{now}_{prompt_key}.png")  # ADDED CODE: Save output image path
            image.save(output_image_path, pnginfo=pnginfo)
            print(f"Output image saved at {output_image_path}")
            modified_images.append(output_image_path)
        
        r['images'] = modified_images
    else:
        print("Request failed:", response.status_code)
        print(response.text)

    combined_log = {
        "prompt_used": prompt_key,
        "payload": payload_for_log,
        "output": r  # Entire response with image paths in place of the Base64 data
    }

    combined_log_path = os.path.join(output_directory, f"{now}_{prompt_key}.log")
    with open(combined_log_path, "w") as f:
        f.write(json.dumps(combined_log, indent=4))

    print(f"Finished {input_image_path}")
    
    # ADDED CODE: Return a tuple of the input image path and the output image path
    return input_image_path, output_image_path

# ADDED CODE: Function to create a macro image from input/output image pairs.
def create_macro_image(image_pairs, macro_image_path):
    """
    image_pairs: list of tuples (input_image_path, output_image_path)
    macro_image_path: path to save the combined macro image.
    """
    # Open the first pair to determine dimensions (assuming all images are similar in size)
    first_input = Image.open(image_pairs[0][0])
    first_output = Image.open(image_pairs[0][1])
    width_input, height_input = first_input.size
    width_output, height_output = first_output.size

    # Use maximum dimensions for each cell (in case sizes differ slightly)
    cell_width = max(width_input, width_output)
    cell_height = max(height_input, height_output)

    # Calculate final dimensions: len(image_pairs) columns and 2 rows.
    macro_width = cell_width * len(image_pairs)
    macro_height = cell_height * 2

    macro_image = Image.new('RGB', (macro_width, macro_height), color=(255, 255, 255))

    for i, (inp_path, out_path) in enumerate(image_pairs):
        inp = Image.open(inp_path)
        outp = Image.open(out_path)

        # Resize images if they differ from the cell dimensions
        if inp.size != (cell_width, cell_height):
            inp = inp.resize((cell_width, cell_height))
        if outp.size != (cell_width, cell_height):
            outp = outp.resize((cell_width, cell_height))

        x_offset = i * cell_width
        # Paste input image in row 1 (top row)
        macro_image.paste(inp, (x_offset, 0))
        # Paste output image in row 2 (bottom row)
        macro_image.paste(outp, (x_offset, cell_height))

    macro_image.save(macro_image_path)
    print(f"Macro image saved at {macro_image_path}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-sdbu', '--baseurl', type=str, required=True, help="Stable Diffussion base url like: http//127.0.0.1:7861")
    parser.add_argument('-ipd', '--ipathd', type=str, required=True, help="Directory with input images.")
    parser.add_argument('-opd', '--opathd', type=str, required=True, help="Directory to put output images.")
    parser.add_argument('-pl', '--promptlist', type=str, required=True, help='Comma delimited list of prompt keys like: "Anime,Simpsons,Pixar,Medieval" which will be applied to the images.')
    parser.add_argument('-rcp', '--rpath', type=str, required=True, help='Directory that will sync to google photos.')

    args = parser.parse_args()

    prompts = args.promptlist.split(',')

    image_paths = get_image_paths(args.ipathd)  
    output_folder = os.path.join(args.opathd, timestamp)
    os.makedirs(output_folder, exist_ok=True)
    rclone_cloud_folder = args.rpath

    encoded_images = []
    for path in image_paths:
        encoded_images.append(encode_image_to_base64(path))

    assert len(prompts) == len(image_paths) == len(encoded_images)

    # ADDED CODE: List to store input/output image pairs for the macro image.
    image_pairs = []
    
    for i in range(len(image_paths)):
        pair = img2img(args.baseurl, encoded_images[i], image_paths[i], prompts[i], output_folder)
        image_pairs.append(pair)
    
    # ADDED CODE: After processing all images, create the macro image.
    if image_pairs:
        # macro_image_path = os.path.join(output_folder, "macro_image.png")
        macro_image_path = os.path.join(rclone_cloud_folder, f"img_{timestamp}.png")
        create_macro_image(image_pairs, macro_image_path)

if __name__ == '__main__':
    main()
