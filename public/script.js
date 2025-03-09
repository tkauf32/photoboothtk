document.addEventListener('DOMContentLoaded', function () {
    const socket = io(); // Connect to the server
    const body = document.body;
    const preview = document.getElementById('preview');
    const imageContainer = document.getElementById('imageContainer');
    const startButton = document.getElementById('startButton');
    const backButton = document.getElementById('backButton');
    const startOverButton = document.getElementById('startOverButton');
    const cameraStream = document.getElementById('cameraStream');
    const iframe = document.getElementById("iframe");
    const countDown = document.getElementById('countdown');
    const showRecentImages = document.getElementById('showRecentImages');
    const bottomContainer = document.getElementById('bottomContainer');
    let capturedImagesArray = [];

    function resetToInitialState() {
        preview.style.display = 'none';
        imageContainer.style.display = 'none';
        startButton.style.display = 'block';
        backButton.style.display = 'none';
        startOverButton.style.display = 'none';
        iframe.style.display = 'inline'
        countDown.style.display = 'none'
        cameraStream.style.display = 'inline';
        iframe.style.display = 'inline';
        bottomContainer.style.display = 'inline';
    }

    function showGrid() {
        preview.style.display = 'none';
        imageContainer.style.display = 'grid';
        backButton.style.display = 'none'; // Only show when an image is clicked
        startOverButton.style.display = 'block';
        iframe.style.display = 'none';
        cameraStream.style.display = 'none';
        bottomContainer.style.display = 'none';
    }

    socket.on('reset countdown', () => {
        console.log('reset countdown');
        startCount();
    });

    async function startCount() {
        let count = 4;
        countDown.textContent = count;
        countDown.style.display = "inline";
        console.log("Count: ", count);
        const intervalId = setInterval(() => {
            if (count == 1) {
                countDown.style.display = "none";
                console.log("Count == 1");
                clearInterval(intervalId);
            } else {
                count--;
                console.log("Count: ", count);
                countDown.textContent = count;
                countDown.style.display = "inline";
            }
        }, 1000);
    }

    function startCountDown() {
        let countDownValue = 5;
        let NumberOfPhotosLeft = 4;
        countDown.textContent = countDownValue;

        const intervalId = setInterval(() => {
            // if we still have photos left, reset the timer

            if (countDownValue == 1) {
                if (NumberOfPhotosLeft > 0) {
                    NumberOfPhotosLeft--;
                    countDownValue=5;
                    console.log("Resetting countdown. photo #%d", NumberOfPhotosLeft);
                } else {
                    console.log("Done!");
                    countDown.style.display = "none"; // hide the coundown element
                    clearInterval(intervalId);
                }

            } else {
                countDownValue--;
            }
            countDown.textContent = countDownValue;

        }, 1000);
        
    }

    function makeMainImage(imgPath) {
        preview.src = imgPath;
        preview.style.display = 'block';
        imageContainer.style.display = 'none';
        backButton.style.display = 'none'; // Initially hidden, will be shown when an image is clicked
        startOverButton.style.display = 'none';
    }

    socket.on('new image', data => {
        makeMainImage(data.path);
    });

    function displayAllImages(images) {
        // if (images == null) {
        //     console.log("Passed image array is null, exiting");
        //     socket.emit("gimme images");
        //     return;
        // }

        console.log("Displaying all images: ", images);
        imageContainer.innerHTML = '';
        images.forEach(imgPath => {
            console.log("Image URL: ", imgPath);
            const img = document.createElement('img');
            img.src = imgPath;
            img.alt = "Captured Image";
            img.onclick = () => {
                makeMainImage(imgPath);
                backButton.style.display = 'block'; // Show back button only when an image is enlarged
                iframe.style.display = 'none'   // hide the iframe
            };
            imageContainer.appendChild(img);
        });
        showGrid();
    }

    socket.on('display all images', data => {
        // startButton.style.display = 'none'
        console.log('Received images:', data);
        capturedImagesArray = data.images;
        displayAllImages(capturedImagesArray);
    });

    backButton.onclick = showGrid; // When back button is clicked, return to grid view
    startOverButton.onclick = resetToInitialState; // When start over is clicked, reset

    showRecentImages.onclick = () => {
        console.log('show recents clicked');
        if (capturedImagesArray.length == 0) {
            socket.emit('fuck');
            console.log('here');
        } else { 
            displayAllImages(capturedImagesArray);
            console.log('here2');
        }
    }
    
    startButton.onclick = () => {
        socket.emit('start capture');
        countDown.style.display = "inline";
        // startCountDown();
        startCount();
        startButton.style.display = 'none'; // Hide start button after sequence starts
        startOverButton.style.display = 'none'; // Hide start over during sequence
        bottomContainer.style.display = 'none'; 
    };

    // Detect clicks on the body but not on the image
    body.addEventListener('click', (event) => {
        if (event.target === body || event.target === imageContainer) {
            //showGrid(); // If clicked outside of an image, show the grid
        }
    });

    resetToInitialState(); // Initialize to initial state

    function createClover() {
        const clover = document.createElement('div');
        clover.classList.add('falling-clover');
    
        // Random number between 0 and 1 to decide side
        const random = Math.random();
        let leftPos;
        if (random < 0.5) {
            // Left side: position anywhere from 0% to 25% of the window width
            leftPos = Math.random() * (window.innerWidth * 0.25);
        } else {
            // Right side: position anywhere from 75% to 100% of the window width
            leftPos = window.innerWidth * 0.80 + Math.random() * (window.innerWidth * 0.20);
        }
        clover.style.left = leftPos + 'px';
    
        // Random animation duration between 5 and 10 seconds
        const duration = 3 + Math.random() * 5;
        clover.style.animationDuration = duration + 's';
        // Optionally, add a random animation delay
        clover.style.animationDelay = Math.random() * 5 + 's';
    
        // Append the clover to the clovers container
        document.getElementById('clovers-container').appendChild(clover);
    
        // Remove the clover after its animation ends to keep the DOM clean
        setTimeout(() => {
          clover.remove();
        }, duration * 3000);
    }
    
    // Create a new clover every 500 milliseconds
    setInterval(createClover, 200);

});
