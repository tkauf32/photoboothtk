const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { exec } = require('child_process');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Directory where images will be saved
const imageDir = path.join(__dirname, 'public/images');

// Serve static files from public directory
app.use(express.static('public'));

// Serve the static HTML file to display the image
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));

// Capture and return image file path
const captureImage = () => {
    // Unique filename for each capture based on the current timestamp
    const filename = `image_${new Date().getTime()}.jpg`;
    const filepath = path.join(imageDir, filename);

    return new Promise((resolve, reject) => {
        // Make sure to specify the correct path for saving images
        exec(`gphoto2 --capture-image-and-download --filename ${filepath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return reject(error);
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            resolve(filename); // Resolve with the filename of the captured image
        });
    });
};

// Handle socket connection
io.on('connection', (socket) => {
    console.log('a user connected');

    // Handle the capture sequence
    const handleCaptureSequence = async () => {
        for (let i = 0; i < 4; i++) {
            try {
                const filename = await captureImage();
                // Emit the filename (or path) to the client
                socket.emit('new image', { path: `images/${filename}` });
            } catch (error) {
                socket.emit('error', error.toString());
                break;
            }
        }
    };

    handleCaptureSequence();
});

// Start server
const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
