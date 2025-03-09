const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const { spawn, exec } = require('child_process');
let lastCapturedImagesArray = [];

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the index.html file
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

// // Listen on port 3000
server.listen(3000, () => console.log('Server running on port 3000'));

async function capture_images(dirname) {
    return new Promise((resolve, reject) => {
        const directory = path.join(__dirname, 'public/images', dirname);

        // Create the directory for images
        exec(`mkdir -p ${directory}`, (dirError) => {
            if (dirError) {
                console.error(`Error creating directory: ${dirError}`);
                return reject(dirError);
            }
            
            // Construct the unique filename pattern
            const filenamePattern = path.join(directory, 'image_%Y%m%d%H%M%S.jpg');
            const args = [
                '--wait-event-and-download=5000ms',  // Correct flag
                '--capture-image-and-download',
                '--interval=5',
                '--frames=4',
                '--keep',
                '--filename', filenamePattern
            ];

            // Spawn the gphoto2 process
            const gphotoProcess = spawn('gphoto2', args);

            // Optional: Log output for debugging
            gphotoProcess.stdout.on('data', (data) => {
                const output =  data.toString();
                console.log('gphoto2 stdout:', output);

                if (output.includes('Saving file as')) {
                    io.emit('reset countdown');
                }
            });

            gphotoProcess.stderr.on('data', (data) => {
                console.error('gphoto2 stderr:', data.toString());
            });

            // Once gphoto2 is done, read the directory for the captured files
            gphotoProcess.on('close', (code) => {
                console.log(`gphoto2 process exited with code ${code}`);
                if (code !== 0) {
                    return reject(new Error(`gphoto2 exited with code ${code}`));
                }
                fs.readdir(directory, (err, files) => {
                    if (err) {
                        return reject(err);
                    }
                    // Filter out non-jpg files if needed
                    const imageFiles = files.filter(file => file.endsWith('.jpg'));
                    copyImagesToCloud(directory);
                    console.log("imageFiles: ", imageFiles);
                    resolve(imageFiles);
                });
            });
        });
    });
}

async function copyImagesToCloud(dir) {
    try {
        exec(`rclone copy ${dir} GooglePhotosTest02:album/myTestAlbum`);
        console.log(`copying files in ${dir} to the cloud`);
    } catch (error) {
        console.log(`couldn't copy files to cloud :( : ${error})`);
    }
};

// Socket.IO integration
io.on('connection', (socket) => {
    socket.on('start capture', async () => {
        try {
            // Create a unique directory name
            const dirname = `image_set_${Date.now()}`;
            // Await the capture process; it resolves with the image paths
            const images = await capture_images(dirname);
            console.log("Dirname: " + dirname)
            // Emit the completed list of images to the client
            const lastCapturedImagesArray = images.map(image => `images/${dirname}/${image}`);
            socket.emit('display all images', { images: lastCapturedImagesArray });
            console.log('lastCapturedImagesArray: ',lastCapturedImagesArray);
        } catch (error) {
            console.error("Error capturing images:", error);
            socket.emit('error', 'Failed to capture images');
        }
    });
});
