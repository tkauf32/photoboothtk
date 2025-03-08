from PIL import Image
from diffusers import StableDiffusionImg2ImgPipeline
import argparse
import torch

def read_image(path):
	print(f"Reading from: {path}")
	image = Image.open(path).convert("RGB")
	return image

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-ip', '--ipath', type=str, required=True, help="Input image path. Ex: 'samplein.jpg'.")
    parser.add_argument('-op', '--opath', type=str, required=True, help="Output image path. Ex: 'sampleout.jpg'.")
    parser.add_argument('-p', '--prompt', type=str, required=True)
    parser.add_argument('-s', '--strength', type=float, required=False, default=0.75, help="Model strenght. Ex: '0.5'.")
    parser.add_argument('-c', '--cpu', type=bool, required=False, default=False, help="Whether to use cpu over gpu.")
    parser.add_argument('-d', '--display', type=bool, required=False, default=False, help="Whether to display the before and after images.")

    args = parser.parse_args()

    input_image = read_image(f"{args.ipath}")

    if args.display:
        input_image.show()

    if not isinstance(input_image, Image.Image):
        raise ValueError("The input image must be a PIL.Image.Image object.")

    model_id = "CompVis/stable-diffusion-v1-4"
    device = torch.device('cuda' if (torch.cuda.is_available() and args.cpu == False) else 'cpu')

    print(f"The type of image is: {type(input_image)}")
    print(f"Model is: {model_id}")
    print("CUDA Version:", torch.version.cuda)
    print("CUDA Available:", torch.cuda.is_available())
    print("CUDA Device Count:", torch.cuda.device_count())
    print("Using:", device)
    print("Prompt is:", args.prompt)
    print("Strength is:", args.strength)
		
    pipe = StableDiffusionImg2ImgPipeline.from_pretrained(model_id).to(device)

    #generated_image = input_image
    generated_image = pipe(prompt=args.prompt, init_image=input_image, strength=args.strength, device=device).images[0]

    if args.display:
        generated_image.show()
        
    generated_image.save(f"{args.opath}", format='PNG')
    
if __name__ == '__main__':
    main()