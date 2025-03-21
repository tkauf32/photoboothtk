# Photobooth

## Install packages

### gphoto2 for usb camera commands, nodejs for backend.

```bash
sudo apt-get install -y nodejs
sudo apt-get install -y gphoto2
```

### install rclone for syncing with the cloud

```bash
sudo apt-get install -y rclone
```

### install dependencies for mjpg streamer

```bash
sudo apt-get install -y build-essential libjpeg62-turbo-dev imagemagick libv4l-dev cmake git
```

## Running

### kill gvfs-gphoto2 temporarily

```bash
sudo pkill -f gvfs-gphoto2-volume-monitor
```

### build mjpg streamer

```bash
cd mjpg-streamer/mjpg-streamer-experimental
make
```

### run mjpg streamer

```bash
./mjpg_streamer -i "./input_uvc.so -d /dev/video0 -r 640x480 -f 30" -o "./output_http.so -w ./www"
```

# Running the apps as System Services

## create a systemd service file for node js web app

```bash
sudo nano /etc/systemd/system/photobooth-web.service
```

add the following to the file:

```sh
[Unit]
Description=Photobooth Web Server
After=network.target

[Service]
ExecStart=/usr/bin/node /home/pi/photoboothtk/app.js
WorkingDirectory=/home/pi/photoboothtk
Restart=always
User=pi
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

and enable the system service:

```bash
sudo systemctl enable photobooth-web
sudo systemctl start photobooth-web
```

### Monitoring logs live with:

```bash
sudo journalctl -u photobooth-web.service -f
```

## create a systemd service file for mjpeg streamer

```bash
sudo nano /etc/systemd/system/mjpeg-stream.service
```

```bash
[Unit]
Description=MJPEG Streamer
After=network.target

[Service]
ExecStart=/home/pi/photoboothtk/mjpg-streamer/mjpg-streamer-experimental/mjpg_streamer -i "./input_uvc.so -d /dev/video0 -r 1080x1080 -f 30" -o "./output_http.so -w ./www"
WorkingDirectory=/home/pi/photoboothtk/mjpg-streamer/mjpg-streamer-experimental
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable mjpeg-stream
sudo systemctl start mjpeg-stream
```

# Kill gvfs from the get-go

```bash
sudo systemctl mask gvfs-gphoto2-volume-monitor.service
sudo systemctl disable gvfs-gphoto2-volume-monitor.service
```

if that doesn't work, rename the binary to a backup file:

```bash
sudo mv /usr/libexec/gvfs-gphoto2-volume-monitor /usr/libexec/gvfs-gphoto2-volume-monitor.bak
```

---

# run img2img

This script will call the stable diffusion api hosted at -sdbu and run an img2img conversion over all the images within -ipd.
The converted images will end up within -opd. -pl specifies which prompts to run over the provided images. Make sure the number
of images matches the number of prompts in the prompt list.

python3 .\img2img.py -sdbu "http://127.0.0.1:7860" -ipd "inputs" -opd "outputs" -pl "Simpsons,Lego,Pixar,Simpsons"


```bash
python img2img.py -sdbu "http://192.168.4.133:7860" --ipathd "test/inputs" --opathd "test/outputs" --rpath "ai_images" --promptlist "Medieval,Medieval,Lego,Medieval"
```
# qrcode
```bash
sudo apt-get install qrencode
sudo apt-get install imagemagick```

```bash
# Album 1
qrencode -o album1.png 'https://example.com/album1'
convert album1.png -fuzz 10% -fill green -opaque black -transparent white album1_green.png
echo "Album 1 QR code generated as album1_green.png"

# Album 2
qrencode -o album2.png 'https://example.com/album2'
convert album2.png -fuzz 10% -fill green -opaque black -transparent white album2_green.png
echo "Album 2 QR code generated as album2_green.png"
```
# ideas

## Realistic

- timeout feature where resets back to the beginning
- give a few seconds before the first photo
- timer on the screen to get ready for the photo, like 5-10 seconds or something.

## maybe realistic

- QR code to the exact image set taken (how do we get the url? -- may have to stick with basic)
- Submit or delete to the cloud feature (keep all locally for bakup purposes)

## prob Unrealistic

- containerize mjpeg stream server, web server, and rclone sync
- use dockercompose to manage and launch all the containers at once
- probably much work for not much value. Maybe someone else will use the project and it will help them.
- printing the photos
