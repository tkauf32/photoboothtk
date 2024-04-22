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

// Handle socket connection
io.on('connection', (socket) => {
    socket.on('start capture', async () => {
        try {
            const images = await capture_images();
            socket.emit('display all images', { images: images.map(image => `images/${image}`) });
        } catch (error) {
            console.error("Error capturing images:", error);
            socket.emit('error', 'Failed to capture images');
        }
    });
});

// Listen on port 3000
server.listen(3000, () => console.log('Server running on port 3000'));

// Function to capture images using gphoto2
async function capture_images() {
    const imagePaths = [];
    const delayBetweenCaptures = 100; // 4 seconds delay

    for (let i = 0; i < 4; i++) {
        const imageName = `image_${Date.now()}.jpg`; // Unique image name
        const imagePath = path.join(__dirname, 'public/images', imageName);

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
