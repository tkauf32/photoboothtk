# Photobooth
## Install packages
### gphoto2 for usb camera commands, nodejs for backend. 
```bash
sudo apt-get install nodejs
sudo apt-get install gphoto2
```

### install dependencies for mjpg streamer
```bash
sudo apt-get install build-essential libjpeg62-turbo-dev imagemagick libv4l-dev cmake git 
```

## Running
# kill gvfs-gphoto2 temporarily
```bash
sudo pkill -f gvfs-gphoto2-volume-monitor
```
# build mjpg streamer
```bash
cd mjpg-streamer/mjpg-streamer-experimental
make
```

# run mjpg streamer
```bash
./mjpg_streamer -i "./input_uvc.so -d /dev/video0 -r 640x480 -f 30" -o "./output_http.so -w ./www"
```
