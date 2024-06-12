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
            const images = [];
            for (let i = 0; i < 4; i++) {
                await startCountdown(socket);
                const image = await capture_image();
                images.push(image);
            }
            socket.emit('display all images', { images: images.map(image => `images/${image}`) });
        } catch (error) {
            console.error("Error capturing images:", error);
            socket.emit('error', 'Failed to capture images');
        }
    });
});

// Listen on port 3000
server.listen(3000, () => console.log('Server running on port 3000'));

// Function to start countdown
async function startCountdown(socket) {
    for (let i = 3; i >= 0; i--) {
        socket.emit('countdown', i);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// Function to capture a single image using gphoto2
async function capture_image() {
    const imageName = `image_${Date.now()}.jpg`; // Unique image name
    const imagePath = path.join(__dirname, 'public/images', imageName);
    const usePlaceholder = !(await isCameraConnected());

    if (usePlaceholder) {
        // Simulate capture by copying a placeholder image
        fs.copyFileSync(path.join(__dirname, 'public/placeholder.jpg'), imagePath);
        console.log(`Simulated image capture: ${imageName}`);
    } else {
        // Capture image using gphoto2
        await new Promise((resolve, reject) => {
            console.log(`Attempting to capture image: ${imageName}`);
            exec(`gphoto2 --capture-image-and-download --keep --filename ${imagePath}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error capturing image: ${stderr}`);
                    reject(error);
                    return;
                }
                console.log(`Image captured: ${stdout}`); // Log gphoto2 output
                resolve();
            });
        });
    }

    return imageName; // Return the image name
}

// Function to check if the camera is connected
async function isCameraConnected() {
    return new Promise((resolve) => {
        exec('gphoto2 --auto-detect', (error, stdout, stderr) => {
            if (error || !stdout.includes('Canon')) {
                console.log('Camera not detected.');
                resolve(false);
            } else {
                console.log('Camera detected.');
                resolve(true);
            }
        });
    });
}
