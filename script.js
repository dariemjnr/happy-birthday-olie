document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const photos = [
        'photos/1.jpeg', 'photos/2.jpeg', 'photos/3.jpeg', 'photos/4.jpeg',
        'photos/5.jpeg', 'photos/6.jpeg', 'photos/7.jpeg', 'photos/8.jpeg',
        'photos/9.jpeg', 'photos/10.jpeg'
    ];

    // --- DOM ELEMENTS ---
    const startBtn = document.getElementById('start-btn');
    const candleSetup = document.getElementById('candle-setup');
    const flame = document.getElementById('flame');
    const messageWrapper = document.getElementById('message-container');
    const ecgLine = document.querySelector('.ecg-line');
    const photoArea = document.getElementById('photo-area');

    // --- AUDIO VARS ---
    let audioContext;
    let analyser;
    let microphone;
    let isBlowing = false;

    // --- CHECK IF ELEMENTS EXIST ---
    if (!startBtn || !candleSetup) {
        console.error("Error: Could not find HTML elements. Check your IDs.");
        return;
    }

    // --- STEP 1: INITIALIZE ---
    startBtn.addEventListener('click', async () => {
        // 1. Instant Visual Feedback
        startBtn.innerText = "Requesting Access... 🎤";
        startBtn.style.background = "#ccc";

        try {
            // 2. Check Browser Support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Your browser doesn't support microphone access. Try Chrome or Safari!");
                return;
            }

            // 3. Initialize Audio Context (Mobile Requirement: Must be inside click)
            audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // 4. iOS Fix: Resume if suspended
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // 5. Request Mic Access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // 6. Transition UI
            startBtn.style.transition = 'opacity 0.5s ease';
            startBtn.style.opacity = '0';

            setTimeout(() => {
                startBtn.style.display = 'none';
                candleSetup.style.display = 'flex';
                // Small delay to allow display:flex to apply
                setTimeout(() => { candleSetup.style.opacity = '1'; }, 50);
            }, 500);

            // 7. Connect Audio
            analyser = audioContext.createAnalyser();
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            analyser.fftSize = 256;

            detectBlow();

        } catch (err) {
            console.error(err);
            startBtn.innerText = "Tap to Start Celebration 💊"; // Reset text
            startBtn.style.background = ""; // Reset color

            if (window.location.protocol === 'file:') {
                alert("Microphone access is blocked! You are opening the file directly. You MUST host this on GitHub Pages for it to work.");
            } else {
                alert("Please click 'Allow' when asked for microphone permission! It's needed for the magic trick.");
            }
        }
    });

    // --- STEP 2: BLOW DETECTION ---
    function detectBlow() {
        if (!analyser) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function checkVolume() {
            if (isBlowing) return;

            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            let average = sum / bufferLength;

            // Sensitivity Threshold
            if (average > 45) {
                blowOutCandle();
            } else {
                requestAnimationFrame(checkVolume);
            }
        }
        checkVolume();
    }

    // --- STEP 3: ANIMATION SEQUENCE ---
    function blowOutCandle() {
        isBlowing = true;

        flame.style.transition = 'opacity 0.2s';
        flame.style.opacity = '0';

        if (audioContext) audioContext.close();

        setTimeout(() => {
            candleSetup.style.opacity = '0';
            setTimeout(() => {
                candleSetup.style.display = 'none';
                messageWrapper.style.opacity = '1';
                if (ecgLine) ecgLine.style.width = '100%';
                triggerPhotoBurst();
            }, 1000);
        }, 500);
    }

    // --- STEP 4: PHOTO EXPLOSION ---
    function triggerPhotoBurst() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const totalPhotos = photos.length;
        const angleStep = (Math.PI * 2) / totalPhotos;

        photos.forEach((src, index) => {
            const img = document.createElement('img');
            img.src = src;
            img.className = 'burst-photo';
            photoArea.appendChild(img);

            // Position Logic: Evenly distributed oval
            let currentAngle = index * angleStep;

            const radiusX = width * 0.40; // Push to 40% of screen width
            const radiusY = height * 0.40; // Push to 40% of screen height

            const x = Math.cos(currentAngle) * radiusX;
            const y = Math.sin(currentAngle) * radiusY;

            const rotate = (Math.random() - 0.5) * 30;

            setTimeout(() => {
                img.style.opacity = '1';
                img.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rotate}deg) scale(1)`;
            }, 100 * index);
        });
    }
});