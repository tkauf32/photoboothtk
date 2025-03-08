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

``` bash
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

------------------
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

# run img2img
python3 img2img.py -ip "input.png" -op "output.png" -p "turn everyone into anime characters with big personalities"
