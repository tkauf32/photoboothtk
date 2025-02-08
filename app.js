const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the index.html file
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'script.js')));

// Handle socket connection
io.on('connection', (socket) => {
    socket.on('start capture', async () => {
        try {
            const dirname = `image_set_${Date.now()}`; // name the directory after datetime
            const images = await capture_images(dirname);
            socket.emit('display all images', { images: images.map(image => `images/${dirname}/${image}`) });
        } catch (error) {
            console.error("Error capturing images:", error);
            socket.emit('error', 'Failed to capture images');
        }
    });
});

// Listen on port 3000
server.listen(3000, () => console.log('Server running on port 3000'));

function makePhotoSetDirectory() {
    const dirname = `image_set_${Date.now()}`; // name the directory after datetime
    exec(`mkdir -p ${dirname}`)

}

// Function to capture images using gphoto2
async function capture_images(dirname) {
    const imagePaths = [];
    const delayBetweenCaptures = 100;

    for (let i = 0; i < 4; i++) {

        if (i == 0) {
            console.log("First Pass i=0. Making directory for photos")
            try {
                await new Promise((resolve, reject) => {
                    console.log(`Creating directory for ${dirname}`);
                    exec(`mkdir -p public/images/${dirname}`, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Error making directory ${dirname}: ${stderr}`);
                            return reject(error);  // Reject the promise if an error occurs
                        }
                        resolve(stdout); // Resolve the promise on success
                    });
                });
            } catch (error) {
                console.error(`failed to make directory ${dirname}`);
                break;
            }
        }

        const imageName = `image_${Date.now()}.jpg`; // Unique image name
        const imagePath = path.join(__dirname, `public/images/${dirname}`, imageName);

        // Implement delay between captures
        try {
            await new Promise((resolve, reject) => {
                console.log(`Attempting to capture image: ${imageName}`);
                exec(`gphoto2 --capture-image-and-download --keep --filename ${imagePath}`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error capturing image: ${stderr}`);
                        reject(error);
                        return;
                    }
                    console.log(`Image captured: ${stdout}`); // Log gphoto2 output
                    imagePaths.push(imageName); // Add image name to array
                    resolve();
                });
            });
        } catch (error) {
            console.error(`Failed during capture: ${error}`);
            break; // Break out of the loop on failure
        }

        // // Implement delay between captures
        console.log(`Waiting for ${delayBetweenCaptures / 1000} seconds before next capture.`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenCaptures));
    }

    return imagePaths; // Return the array of image names
}
