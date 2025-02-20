# photoboothtk
sudo apt-get install nodejs
sudo apt-get install gphoto2
# kill gvfs-gphoto2 temporarily
sudo pkill -f gvfs-gphoto2-volume-monitor

# install dependencies for mjpg streamer
sudo apt-get install build-essential libjpeg62-turbo-dev imagemagick libv4l-dev cmake git 

# build mjpg streamer
cd mjpg-streamer/mjpg-streamer-experimental
make

# run mjpg streamer
./mjpg_streamer -i ./input_uvc.so -d /dev/video0 -r 640x480 -f 30 -o ./output_http.so -w ./www

