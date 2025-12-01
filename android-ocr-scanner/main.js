import Tesseract from 'tesseract.js';

const video = document.getElementById('camera');
const canvas = document.getElementById('ocrCanvas');
const ctx = canvas.getContext('2d');
const highlightLayer = document.getElementById('highlightLayer');
const statusDot = document.getElementById('connection-status');
const settingsModal = document.getElementById('settings-modal');
const ipInput = document.getElementById('ip-input');
const saveIpBtn = document.getElementById('save-ip');

let desktopIp = localStorage.getItem('desktop_ip');
let isProcessing = false;

// Setup Camera
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            startOCR();
        };
    } catch (err) {
        console.error("Camera error:", err);
        alert("Camera access denied or not available.");
    }
}

// OCR Loop
async function startOCR() {
    setInterval(async () => {
        if (isProcessing) return;
        isProcessing = true;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Recognize text
        try {
            const { data: { words } } = await Tesseract.recognize(canvas, 'eng', {
                // logger: m => console.log(m) // Optional logging
            });

            updateHighlights(words);
        } catch (e) {
            console.error("OCR Error:", e);
        } finally {
            isProcessing = false;
        }
    }, 2000); // Run every 2 seconds to save battery
}

function updateHighlights(words) {
    highlightLayer.innerHTML = ''; // Clear old highlights

    // Calculate scale factors (video vs screen size)
    const scaleX = highlightLayer.clientWidth / canvas.width;
    const scaleY = highlightLayer.clientHeight / canvas.height;

    words.forEach(word => {
        if (word.confidence < 70) return; // Filter low confidence

        const div = document.createElement('div');
        div.className = 'highlight';
        div.style.left = `${word.bbox.x0 * scaleX}px`;
        div.style.top = `${word.bbox.y0 * scaleY}px`;
        div.style.width = `${(word.bbox.x1 - word.bbox.x0) * scaleX}px`;
        div.style.height = `${(word.bbox.y1 - word.bbox.y0) * scaleY}px`;

        div.onclick = () => sendText(word.text);

        highlightLayer.appendChild(div);
    });
}

async function sendText(text) {
    if (!desktopIp) {
        settingsModal.style.display = 'flex';
        return;
    }

    try {
        // Use standard fetch. If CORS is an issue, we might need tauri-plugin-http.
        // Assuming Desktop server allows CORS (we set it).
        const res = await fetch(`http://${desktopIp}:3000/phrase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (res.ok) {
            statusDot.className = 'connected';
            // Flash effect
            document.body.style.backgroundColor = '#003300';
            setTimeout(() => document.body.style.backgroundColor = '#000000', 200);
        } else {
            throw new Error('Send failed');
        }
    } catch (e) {
        console.error("Send error:", e);
        statusDot.className = 'disconnected';
        settingsModal.style.display = 'flex'; // Show settings on failure
    }
}

// Settings Logic
if (desktopIp) {
    statusDot.className = 'connected'; // Assume connected until proven otherwise
} else {
    settingsModal.style.display = 'flex';
}

saveIpBtn.onclick = () => {
    const ip = ipInput.value.trim();
    if (ip) {
        desktopIp = ip;
        localStorage.setItem('desktop_ip', ip);
        settingsModal.style.display = 'none';
        statusDot.className = 'connected'; // Optimistic update
    }
};

statusDot.onclick = () => {
    settingsModal.style.display = 'flex';
};

setupCamera();
