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
    const countDownEl = document.getElementById('countdown');

    function resetToInitialState() {
        preview.style.display = 'none';
        imageContainer.style.display = 'none';
        startButton.style.display = 'block';
        backButton.style.display = 'none';
        startOverButton.style.display = 'none';
        iframe.style.display = 'inline'
        countDownEl.style.display = 'none'
        cameraStream.style.display = 'inline';
        iframe.style.display = 'inline';
    }

    function showGrid() {
        preview.style.display = 'none';
        imageContainer.style.display = 'grid';
        backButton.style.display = 'none'; // Only show when an image is clicked
        startOverButton.style.display = 'block';
        iframe.style.display = 'none';
        cameraStream.style.display = 'none';
    }

    // function startCountDown() {
    //     let countDownValue = 3;
    //     let NumberOfPhotosLeft = 4;
    //     countDownEl.textContent = countDownValue;

    //     const intervalId = setInterval(() => {
    //         countDownEl.style.display = "inline"; // show the countdown element on screen
    //         // if we still have photos left, reset the timer

    //         if (countDownValue < 1) {
    //             if (NumberOfPhotosLeft > 0) {
    //                 flashScreen() // make the screen flash!!!
    //                 NumberOfPhotosLeft--
    //                 countDownValue=3
    //                 console.log("Resetting countdown. photo #%d", NumberOfPhotosLeft)
    //             } else {
    //                 console.log("Done!")
    //                 countDownEl.style.display = "none"; // hide the coundown element
    //                 clearInterval(intervalId)
    //             }
    //             console.log("Resetting countdown. photo #%d", NumberOfPhotosLeft)

    //         } else {
    //             countDownValue--
    //         }
    //         countDownEl.textContent = countDownValue;

    //     }, 1000);
        
    // }
    
    // function flashScreen() {

    // }

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

    socket.on('display all images', data => {
        // startButton.style.display = 'none'
        console.log('Received images:', data);
        imageContainer.innerHTML = '';
        data.images.forEach(imgPath => {
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
    });

    backButton.onclick = showGrid; // When back button is clicked, return to grid view
    startOverButton.onclick = resetToInitialState; // When start over is clicked, reset



    startButton.onclick = () => {
        socket.emit('start capture');
        //startCountDown()
        startButton.style.display = 'none'; // Hide start button after sequence starts
        startOverButton.style.display = 'none'; // Hide start over during sequence

    };

    // Detect clicks on the body but not on the image
    body.addEventListener('click', (event) => {
        if (event.target === body || event.target === imageContainer) {
            //showGrid(); // If clicked outside of an image, show the grid
        }
    });

    resetToInitialState(); // Initialize to initial state
});
