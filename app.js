const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const { spawn, exec } = require('child_process');

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the index.html file
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
// app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'script.js')));

// // Handle socket connection
// io.on('connection', (socket) => {
//     socket.on('start capture', async () => {
//         try {
//             const dirname = `image_set_${Date.now()}`; // name the directory after datetime
//             // const images = await capture_images(dirname);
//             const images = await captureImageWithSpawn(dirname);
//             socket.emit('display all images', { images: images.map(image => `images/${dirname}/${image}`) });
//         } catch (error) {
//             console.error("Error capturing images:", error);
//             socket.emit('error', 'Failed to capture images');
//         }
//     });
// });

// // Listen on port 3000
server.listen(3000, () => console.log('Server running on port 3000'));

// Updated capture function using spawn and Promise
// function capture_images(dirname) {
//     return new Promise((resolve, reject) => {
//         const imagePaths = [];
//         const directory = path.join(__dirname, 'public/images', dirname);

//         // Create directory first
//         exec(`mkdir -p ${directory}`, (dirError) => {
//             if (dirError) {
//                 console.error(`Error creating directory: ${dirError}`);
//                 return reject(dirError);
//             }
            
//             // Construct the unique filename pattern
//             const filenamePattern = path.join(directory, 'image_%Y%m%d%H%M%S.jpg');
//             const args = [
//                 '--wait-event-and-download=500ms',
//                 '--capture-image-and-download',
//                 '--interval=3',
//                 '--frames=4',
//                 '--keep',
//                 '--filename', filenamePattern
//             ];

//             // Spawn the gphoto2 process
//             const gphotoProcess = spawn('gphoto2', args);

//             // Listen for stdout data
//             gphotoProcess.stdout.on('data', (data) => {
//                 const output = data.toString();
//                 console.log('gphoto2 output:', output);
//                 // Example check: adjust based on actual output text from gphoto2
//                 if (output.includes('Saving file as')) {
//                     // Use a regex to extract the filename if needed.
//                     const regex = /Saving file as\s+(.+)/;
//                     const match = output.match(regex);
//                     if (match && match[1]) {
//                         imagePaths.push(match[1].trim());
//                     }
//                 }
//             });

//             // Listen for stderr data
//             gphotoProcess.stderr.on('data', (data) => {
//                 console.error('gphoto2 error:', data.toString());
//             });

//             // When the process finishes, resolve or reject the promise
//             gphotoProcess.on('close', (code) => {
//                 console.log(`gphoto2 process exited with code ${code}`);
//                 if (code !== 0) {
//                     return reject(new Error(`gphoto2 exited with code ${code}`));
//                 }
//                 resolve(imagePaths); // Return the array of image names
//             });
//         });
//     });
// }

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
                console.log('gphoto2 stdout:', data.toString());
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
                    resolve(imageFiles);
                });
            });
        });
    });
}

async function copyImagesToCloud(dir) {
    console.log(`copying files in ${dir} to the cloud`);
    exec(`rclone copy ${dir} GooglePhotosTest02:album/myTestAlbum`);
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
            socket.emit('display all images', {
                images: images.map(image => `images/${dirname}/${image}`)
            });
        } catch (error) {
            console.error("Error capturing images:", error);
            socket.emit('error', 'Failed to capture images');
        }
    });
});

async function captureImageWithSpawn(dirname) {
    return new Promise((resolve, reject) => {
        const imagePaths = [];

        // generate a unique filename pattern
        const filenamePattern = path.join(__dirname, `public/images/${dirname}`, 'image_%Y%m%d%H%M%S.jpg');

        // prepage gphoto2 commands
        const args = [
            '--wait-even-and-download=500ms',
            '--capture-image-and-download',
            '--interval=3',
            '--frames=4',
            '--keep',
            '--filename', filenamePattern
        ]

        const gphotoProcess = spawn('gphoto2', args);

        // Listen for stdout data events
        gphotoProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('gphoto2 output:',output);

            if (output.includes('Saving file as')) {
                const regex = /Saving file as (.+)/;
                const match = output.match(regex);
                if (match && match[1]) {
                    imagePaths.push(match[1].trim());
                }
            }
        });

        // Capture any errors from stderr
        gphotoProcess.stderr.on('data', (data) => {
            console.error('gphoto2 error output:', data.toString());
        });

        gphotoProcess.on('close', (code) => {
            console.log(`gphoto2 process exited with code ${code}`);
            if (code !== 0) {
                return reject(new Error(`gphoto2 exited with code ${code}`));
            }
            resolve(imagePaths);
        });
    });
}
