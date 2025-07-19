const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const { spawn, exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

let lastCapturedImagesArray = [];
let activeJobs = 0;
const maxActiveJobs = 1; // Adjust this if you want to allow more concurrent tasks
let jobQueue = [];

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the index.html file
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

// // Listen on port 3000
server.listen(3000, () => console.log('Server running on port 3000'));

function clearImageCache() {
  // 1. Grab all img nodes
  const imgs = imageContainer.querySelectorAll('img');
  imgs.forEach(img => {
    // 2. Clear the src so the bitmap can be released
    img.src = '';
    // 3. Remove from DOM
    img.remove();
  });
  // 4. Reset your JS array
  capturedImagesArray = [];
}

async function capture_images(dirname) {
    return new Promise((resolve, reject) => {
        const directory = path.join(__dirname, 'public/images2', dirname);

        // Create the directory for images
        exec(`mkdir -p ${directory}`, (dirError) => {
            if (dirError) {
                console.error(`Error creating directory: ${dirError}`);
                return reject(dirError);
            }
          
            photoCount = 0  
            // Construct the unique filename pattern
            const filenamePattern = path.join(directory, 'image_%Y%m%d%H%M%S.jpg');
            const args = [
                '--wait-event-and-download=3000ms',  // Correct flag
                '--capture-image-and-download',
                '--interval=4',
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
                  photoCount++
                  if (photoCount >= 4) {
                    photoCount = 0
                  }
                  io.emit('reset countdown', photoCount);
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
//        exec(`rclone copy ${dir} lychee:/root/lychee/uploads/import`);
        exec(`rclone copy "${dir}" "lychee:/root/lychee-compose/uploads/import/Ivan and Martyna Engagement Party 2025"`);
        console.log(`copying files in ${dir} to the cloud`);
    } catch (error) {
        console.log(`couldn't copy files to cloud :( : ${error})`);
    }
};


async function sendImagesToAiServer(inputPhotosDir, outputAiPhotosDir, cloudOutputDir, promptList) {
    try {
        const command = `python img2img.py -sdbu "http://192.168.4.133:7860" --ipathd "${inputPhotosDir}" --opathd "${outputAiPhotosDir}" --rpath "${cloudOutputDir}" --promptlist "${promptList}"`;
        console.log(`making api request to AI server with command: ${command}`);
        const { stdout, stderr } = await execPromise(command);
        console.log("AI server response:", stdout, stderr);
        return cloudOutputDir;
    } catch (error) {
        console.error("Error during AI server request:", error);
        throw error;
    }
}
async function copyAiImagesToCloud(dir) {
    try {
        const command = `rclone copy ${dir} GooglePhotosTest02:album/PhotoboothAI`;
        console.log(`copying output images in ${dir} to google photos`);
        const { stdout, stderr } = await execPromise(command);
        console.log("Cloud copy response:", stdout, stderr);
    } catch (error) {
        console.error("Error during cloud copy:", error);
        throw error;
    }
}


// Function to process an AI task
async function processAiTask(taskData) {
    activeJobs++;
    console.log(`Processing AI task. Active jobs: ${activeJobs}`);
    try {
      const {
        input_dirname,
        ai_output_dirname,
        combined_output_cloud_dirname,
        promptList,
        socket,
      } = taskData;
      // Run AI processing and wait for it to complete
      const cloudOutputDir = await sendImagesToAiServer(
        input_dirname,
        ai_output_dirname,
        combined_output_cloud_dirname,
        promptList
      );
      // After AI processing, copy the images to the cloud
      await copyAiImagesToCloud(cloudOutputDir);
      // Optionally notify the client
      if (socket) {
        socket.emit('ai complete', { message: 'AI processing complete!' });
      }
    } catch (error) {
      console.error("Error in AI processing task: ", error);
    } finally {
      activeJobs--;
      console.log(`AI task finished. Active jobs: ${activeJobs}`);
      // If there are queued tasks, process the next one
      if (jobQueue.length > 0 && activeJobs < maxActiveJobs) {
        const nextTask = jobQueue.shift();
        processAiTask(nextTask);
      }
    }
  }

// Socket.IO integration
io.on('connection', (socket) => {
    socket.on('start capture', async () => {
        try {
          clearImageCache();
        } catch (error) {
          console.error("Error capturing images:", error);
        }
      
        try {
            // Create a unique directory name
            const dirname = `image_set_${Date.now()}`;
            // Await the capture process; it resolves with the image paths
            const images = await capture_images(dirname);
            console.log("Dirname: " + dirname);
            // Emit the completed list of images to the client
            const lastCapturedImagesArray = images.map(image => `images2/${dirname}/${image}`);
            socket.emit('display all images', { images: lastCapturedImagesArray });
            console.log('lastCapturedImagesArray: ',lastCapturedImagesArray);
            // const ai_output_dirname = path.join(__dirname, `tmp/outputs`);
            // const input_dirname = path.join(__dirname, `public/images2/${dirname}`);
            // const combined_output_cloud_dirname = path.join(__dirname, `public/ai_images`);
            // const promptList = ["Anime,Medieval,Lego,Pixar"];


            // const taskData = {
            //     input_dirname,
            //     ai_output_dirname,
            //     combined_output_cloud_dirname,
            //     promptList,
            //     socket, // Pass the socket to notify the client later if needed
            //   };
        
            //   // If under the concurrency limit, process immediately; otherwise, queue the task.
            //   if (activeJobs < maxActiveJobs) {
            //     //processAiTask(taskData);
            //   } else {
            //     jobQueue.push(taskData);
            //     console.log("Max concurrency reached; task queued.");
            //     socket.emit('queue message', 'Your AI processing is queued.');
            //   }
            } catch (error) {
              console.error("Error capturing images:", error);
              socket.emit('error', 'Failed to capture images');
            }
          });
        });
