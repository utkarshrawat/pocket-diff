const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const overlay = document.getElementById('cropOverlay');

// State
let originalImage = null; 
let currentImage = null;
let fileName = "image";
let isCropping = false;

// Drag State
let dragAction = null; 
let startX, startY;
let startRect = { left: 0, top: 0, width: 0, height: 0 };

// --- 1. INITIALIZATION ---

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); });
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if(e.dataTransfer.files.length) loadImage(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => {
    if(fileInput.files.length) loadImage(fileInput.files[0]);
});

function loadImage(file) {
    if(!file.type.startsWith('image/')) { alert("Not an image file."); return; }
    fileName = file.name.split('.')[0];
    document.getElementById('fileInfo').innerText = file.name;
    document.getElementById('placeholderText').style.display = 'none';

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img; 
            updateCanvas(img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    // Reset State
    originalImage = null;
    currentImage = null;
    fileName = "image";
    isCropping = false;
    
    // Clear UI
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0; 
    canvas.height = 0;
    
    document.getElementById('fileInput').value = "";
    document.getElementById('fileInfo').innerText = "No file selected";
    document.getElementById('placeholderText').style.display = 'block';
    
    document.getElementById('imgWidth').value = "";
    document.getElementById('imgHeight').value = "";
    document.getElementById('aspectRatioDisplay').innerText = "";
    document.getElementById('estSize').innerText = "Est: -";
    
    cancelCrop();
}

function updateCanvas(img) {
    currentImage = img;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    document.getElementById('imgWidth').value = img.width;
    document.getElementById('imgHeight').value = img.height;
    updateAspectRatio(img.width, img.height);
    calculateSize();
}

// --- 2. UTILS ---
function updateAspectRatio(w, h) {
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const divisor = gcd(w, h);
    document.getElementById('aspectRatioDisplay').innerText = `(${w/divisor}:${h/divisor})`;
}

function calculateSize() {
    if(!currentImage) return;
    const format = document.getElementById('exportFormat').value;
    const quality = parseFloat(document.getElementById('imgQuality').value);
    
    canvas.toBlob((blob) => {
        if(blob) {
            const kb = (blob.size/1024).toFixed(1);
            const mb = (blob.size/1024/1024).toFixed(2);
            document.getElementById('estSize').innerText = blob.size > 1048576 ? `Est: ${mb} MB` : `Est: ${kb} KB`;
        }
    }, format, quality);
}

function updateQualityLabel() {
    const q = document.getElementById('imgQuality').value;
    document.getElementById('qualityVal').innerText = Math.round(q*100) + '%';
    calculateSize();
}

// --- 3. CROP LOGIC ---
function toggleCropMode() {
    if(!currentImage) return;
    isCropping = !isCropping;
    const btn = document.getElementById('btnStartCrop');
    const controls = document.getElementById('cropControls');
    
    if(isCropping) {
        btn.classList.add('hidden');
        controls.classList.remove('hidden');
        controls.style.display = 'flex';
        dropZone.classList.add('cropping');
        document.getElementById('cropInfo').innerText = "Drag to select area";
    } else {
        cancelCrop();
    }
}

function cancelCrop() {
    isCropping = false;
    overlay.style.display = 'none';
    dropZone.classList.remove('cropping');
    document.getElementById('btnStartCrop').classList.remove('hidden');
    document.getElementById('cropControls').classList.add('hidden');
    document.getElementById('cropInfo').innerText = "";
}

// --- MOUSE INTERACTION ---
dropZone.addEventListener('mousedown', (e) => {
    if(!isCropping || e.target.closest('button')) return;
    e.preventDefault();
    e.stopPropagation();

    if (e.target.classList.contains('crop-handle')) {
        dragAction = e.target.dataset.handle;
    } else if (e.target === overlay) {
        dragAction = 'move';
    } else {
        dragAction = 'create';
        overlay.style.display = 'block';
        const zone = dropZone.getBoundingClientRect();
        const mx = e.clientX - zone.left + dropZone.scrollLeft;
        const my = e.clientY - zone.top + dropZone.scrollTop;
        overlay.style.left = mx + 'px';
        overlay.style.top = my + 'px';
        overlay.style.width = '0px';
        overlay.style.height = '0px';
    }

    const zone = dropZone.getBoundingClientRect();
    startX = e.clientX - zone.left + dropZone.scrollLeft;
    startY = e.clientY - zone.top + dropZone.scrollTop;

    startRect = {
        left: parseFloat(overlay.style.left) || 0,
        top: parseFloat(overlay.style.top) || 0,
        width: parseFloat(overlay.style.width) || 0,
        height: parseFloat(overlay.style.height) || 0
    };
});

window.addEventListener('mousemove', (e) => {
    if(!isCropping || !dragAction) return;
    e.preventDefault();

    const zone = dropZone.getBoundingClientRect();
    const currX = e.clientX - zone.left + dropZone.scrollLeft;
    const currY = e.clientY - zone.top + dropZone.scrollTop;
    const dx = currX - startX;
    const dy = currY - startY;

    if (dragAction === 'create') {
        const w = Math.abs(dx);
        const h = Math.abs(dy);
        const l = dx < 0 ? startRect.left + dx : startRect.left;
        const t = dy < 0 ? startRect.top + dy : startRect.top;
        overlay.style.width = w + 'px'; overlay.style.height = h + 'px'; overlay.style.left = l + 'px'; overlay.style.top = t + 'px';
    } 
    else if (dragAction === 'move') {
        overlay.style.left = (startRect.left + dx) + 'px';
        overlay.style.top = (startRect.top + dy) + 'px';
    } 
    else {
        let newW = startRect.width, newH = startRect.height, newL = startRect.left, newT = startRect.top;
        if (dragAction.includes('e')) newW = startRect.width + dx;
        if (dragAction.includes('s')) newH = startRect.height + dy;
        if (dragAction.includes('w')) { newW = startRect.width - dx; newL = startRect.left + dx; }
        if (dragAction.includes('n')) { newH = startRect.height - dy; newT = startRect.top + dy; }
        
        if(newW > 10) { overlay.style.width = newW + 'px'; overlay.style.left = newL + 'px'; }
        if(newH > 10) { overlay.style.height = newH + 'px'; overlay.style.top = newT + 'px'; }
    }
});

window.addEventListener('mouseup', () => { dragAction = null; });

function applyCrop() {
    const overlayRect = overlay.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;
    
    let x = Math.round((overlayRect.left - canvasRect.left) * scaleX);
    let y = Math.round((overlayRect.top - canvasRect.top) * scaleY);
    let w = Math.round(overlayRect.width * scaleX);
    let h = Math.round(overlayRect.height * scaleY);
    
    x = Math.max(0, x); y = Math.max(0, y);
    w = Math.min(w, canvas.width - x); h = Math.min(h, canvas.height - y);
    
    if(w <= 1 || h <= 1) { alert("Selection invalid."); return; }
    
    const data = ctx.getImageData(x, y, w, h);
    canvas.width = w; canvas.height = h;
    ctx.putImageData(data, 0, 0);
    
    const newImg = new Image();
    newImg.src = canvas.toDataURL();
    newImg.onload = () => {
        currentImage = newImg;
        updateCanvas(newImg);
        cancelCrop();
    };
}

// --- 4. RESIZE & FILTER ---
function handleResize(source) {
    if(!currentImage) return;
    const wIn = document.getElementById('imgWidth');
    const hIn = document.getElementById('imgHeight');
    const ratio = currentImage.width / currentImage.height;
    if(document.getElementById('lockRatio').checked) {
        if(source === 'w') hIn.value = Math.round(wIn.value / ratio);
        else wIn.value = Math.round(hIn.value * ratio);
    }
}

function applyFilter(type) {
    if(!currentImage) return;
    canvas.width = currentImage.width; canvas.height = currentImage.height;
    ctx.drawImage(currentImage, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
        const r=d[i], g=d[i+1], b=d[i+2];
        if(type === 'grayscale') { const v = 0.2126*r + 0.7152*g + 0.0722*b; d[i]=d[i+1]=d[i+2]=v; }
        else if(type === 'sepia') { d[i] = r*0.393+g*0.769+b*0.189; d[i+1] = r*0.349+g*0.686+b*0.168; d[i+2] = r*0.272+g*0.534+b*0.131; }
        else if(type === 'invert') { d[i]=255-r; d[i+1]=255-g; d[i+2]=255-b; }
        else if(type === 'vintage') { const f = 1.2; let tr=r*0.393+g*0.769+b*0.189; d[i]=f*(tr-128)+128; d[i+1]=f*((r*0.349+g*0.686+b*0.168)-128)+128; d[i+2]=f*((r*0.272+g*0.534+b*0.131)-128)+128; }
    }
    ctx.putImageData(imgData, 0, 0);
    calculateSize();
}

function resetImage() {
    if(originalImage) {
        currentImage = originalImage;
        cancelCrop();
        updateCanvas(originalImage);
    }
}

function downloadImage() {
    if(!currentImage) return;
    const w = parseInt(document.getElementById('imgWidth').value);
    const h = parseInt(document.getElementById('imgHeight').value);
    const format = document.getElementById('exportFormat').value;
    const quality = parseFloat(document.getElementById('imgQuality').value);
    
    const tCanvas = document.createElement('canvas');
    tCanvas.width = w; tCanvas.height = h;
    const tCtx = tCanvas.getContext('2d');
    tCtx.drawImage(canvas, 0, 0, w, h);
    
    const link = document.createElement('a');
    link.download = `${fileName}_edited.${format.split('/')[1]}`;
    link.href = tCanvas.toDataURL(format, quality);
    link.click();
}