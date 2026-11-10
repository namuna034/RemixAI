export interface SampleImage {
  id: string;
  title: string;
  description: string;
  suggestedPrompt: string;
  getDataUrl: () => string;
}

// Generate native PNG Data URLs on canvas so they NEVER fail CORS or network restrictions
function createPortraitSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 750;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background gradient (warm studio backdrop)
  const bgGrad = ctx.createLinearGradient(0, 0, 600, 750);
  bgGrad.addColorStop(0, '#fde2e4');
  bgGrad.addColorStop(0.5, '#fad2e1');
  bgGrad.addColorStop(1, '#bee1e6');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 600, 750);

  // Soft studio bokeh circles in background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(120, 180, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(480, 220, 90, 0, Math.PI * 2);
  ctx.fill();

  // Subject: Silhouette / Portrait bust
  // Shoulders & torso
  ctx.fillStyle = '#2b2d42';
  ctx.beginPath();
  ctx.moveTo(120, 750);
  ctx.bezierCurveTo(150, 520, 450, 520, 480, 750);
  ctx.fill();

  // Neck
  ctx.fillStyle = '#ffb4a2';
  ctx.fillRect(260, 400, 80, 100);

  // Head
  ctx.fillStyle = '#ffcdb2';
  ctx.beginPath();
  ctx.ellipse(300, 320, 100, 130, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#4a2810';
  ctx.beginPath();
  ctx.arc(300, 260, 115, Math.PI, 0, false);
  ctx.bezierCurveTo(430, 350, 420, 500, 380, 520);
  ctx.bezierCurveTo(360, 420, 370, 320, 300, 300);
  ctx.bezierCurveTo(230, 320, 240, 420, 220, 520);
  ctx.bezierCurveTo(180, 500, 170, 350, 300, 260);
  ctx.fill();

  // Sunglasses / Features
  ctx.fillStyle = '#e5989b';
  ctx.beginPath();
  ctx.ellipse(300, 380, 25, 12, 0, 0, Math.PI);
  ctx.fill();

  // Stylish glasses
  ctx.fillStyle = '#1d3557';
  ctx.beginPath();
  ctx.roundRect(220, 310, 65, 35, 8);
  ctx.roundRect(315, 310, 65, 35, 8);
  ctx.fill();

  return canvas.toDataURL('image/png');
}

function createCatSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Clean studio background
  const bg = ctx.createRadialGradient(300, 300, 50, 300, 300, 400);
  bg.addColorStop(0, '#f8edeb');
  bg.addColorStop(1, '#e8e8e4');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 600, 600);

  // Cat Body
  ctx.fillStyle = '#f4a261';
  ctx.beginPath();
  ctx.ellipse(300, 450, 160, 130, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cat Head
  ctx.fillStyle = '#e76f51';
  ctx.beginPath();
  ctx.arc(300, 280, 120, 0, Math.PI * 2);
  ctx.fill();

  // Cat Ears
  ctx.fillStyle = '#e76f51';
  ctx.beginPath();
  ctx.moveTo(210, 210);
  ctx.lineTo(190, 110);
  ctx.lineTo(270, 180);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(390, 210);
  ctx.lineTo(410, 110);
  ctx.lineTo(330, 180);
  ctx.fill();

  // Inner ears (pink)
  ctx.fillStyle = '#f4a261';
  ctx.beginPath();
  ctx.moveTo(215, 195);
  ctx.lineTo(205, 135);
  ctx.lineTo(255, 180);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(385, 195);
  ctx.lineTo(395, 135);
  ctx.lineTo(345, 180);
  ctx.fill();

  // Cat Eyes
  ctx.fillStyle = '#2a9d8f';
  ctx.beginPath();
  ctx.ellipse(250, 270, 22, 30, 0, 0, Math.PI * 2);
  ctx.ellipse(350, 270, 22, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  ctx.fillStyle = '#1d3557';
  ctx.beginPath();
  ctx.ellipse(250, 270, 8, 25, 0, 0, Math.PI * 2);
  ctx.ellipse(350, 270, 8, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Snout & Nose
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(285, 335, 20, 15, 0, 0, Math.PI * 2);
  ctx.ellipse(315, 335, 20, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.moveTo(290, 320);
  ctx.lineTo(310, 320);
  ctx.lineTo(300, 332);
  ctx.fill();

  // Whiskers
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(230, 330);
  ctx.lineTo(150, 315);
  ctx.moveTo(230, 340);
  ctx.lineTo(145, 345);
  ctx.moveTo(370, 330);
  ctx.lineTo(450, 315);
  ctx.moveTo(370, 340);
  ctx.lineTo(455, 345);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

function createBlossomSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Soft sky background
  const bg = ctx.createLinearGradient(0, 0, 600, 600);
  bg.addColorStop(0, '#e0f2fe');
  bg.addColorStop(1, '#fce7f3');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 600, 600);

  // Branch
  ctx.strokeStyle = '#5c4033';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 500);
  ctx.quadraticCurveTo(250, 420, 600, 300);
  ctx.stroke();

  // Blossom flower center
  const centerX = 340;
  const centerY = 320;

  // 5 Petals
  const numPetals = 5;
  for (let i = 0; i < numPetals; i++) {
    const angle = (i * 2 * Math.PI) / numPetals;
    const px = centerX + Math.cos(angle) * 75;
    const py = centerY + Math.sin(angle) * 75;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);

    const petalGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 65);
    petalGrad.addColorStop(0, '#fbcfe8');
    petalGrad.addColorStop(0.7, '#f472b6');
    petalGrad.addColorStop(1, '#db2777');

    ctx.fillStyle = petalGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 55, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Flower center disk
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 32, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ca8a04';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 16, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL('image/png');
}

function createBlurryPortraitSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 750;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  const bg = ctx.createLinearGradient(0, 0, 600, 750);
  bg.addColorStop(0, '#c7d2fe');
  bg.addColorStop(1, '#fbcfe8');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 600, 750);

  // Intentional soft blur filter on canvas to simulate an out-of-focus phone shot
  ctx.filter = 'blur(6px)';

  // Subject
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.moveTo(100, 750);
  ctx.bezierCurveTo(140, 500, 460, 500, 500, 750);
  ctx.fill();

  // Neck & Head
  ctx.fillStyle = '#fbcfe8';
  ctx.fillRect(260, 390, 80, 100);

  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.ellipse(300, 310, 100, 130, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes, Brows, Lips
  ctx.fillStyle = '#431407';
  ctx.fillRect(235, 290, 35, 12);
  ctx.fillRect(330, 290, 35, 12);

  ctx.fillStyle = '#7c2d12';
  ctx.beginPath();
  ctx.arc(252, 315, 12, 0, Math.PI * 2);
  ctx.arc(348, 315, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e11d48';
  ctx.beginPath();
  ctx.ellipse(300, 380, 28, 12, 0, 0, Math.PI);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.arc(300, 260, 115, Math.PI, 0, false);
  ctx.bezierCurveTo(430, 350, 420, 500, 380, 520);
  ctx.bezierCurveTo(360, 420, 370, 320, 300, 300);
  ctx.bezierCurveTo(230, 320, 240, 420, 220, 520);
  ctx.bezierCurveTo(180, 500, 170, 350, 300, 260);
  ctx.fill();

  return canvas.toDataURL('image/png');
}

function createVintagePhotoSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 750;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1950s Faded washed-out sepia background
  ctx.fillStyle = '#d7c4a7';
  ctx.fillRect(0, 0, 600, 750);

  // Washed low-contrast portrait
  ctx.fillStyle = '#9b8b76';
  ctx.beginPath();
  ctx.moveTo(120, 750);
  ctx.bezierCurveTo(150, 520, 450, 520, 480, 750);
  ctx.fill();

  // Face
  ctx.fillStyle = '#e5d7c3';
  ctx.beginPath();
  ctx.ellipse(300, 330, 95, 125, 0, 0, Math.PI * 2);
  ctx.fill();

  // Features (faded soft sepia)
  ctx.fillStyle = '#8c7760';
  ctx.beginPath();
  ctx.arc(260, 320, 10, 0, Math.PI * 2);
  ctx.arc(340, 320, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(245, 300, 30, 5);
  ctx.fillRect(325, 300, 30, 5);

  ctx.beginPath();
  ctx.ellipse(300, 390, 22, 8, 0, 0, Math.PI);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#735f49';
  ctx.beginPath();
  ctx.arc(300, 270, 110, Math.PI, 0, false);
  ctx.bezierCurveTo(420, 360, 400, 520, 300, 310);
  ctx.bezierCurveTo(200, 520, 180, 360, 300, 270);
  ctx.fill();

  // Simulated film grain & scratches
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  for (let i = 0; i < 4000; i++) {
    const rx = Math.random() * 600;
    const ry = Math.random() * 750;
    ctx.fillRect(rx, ry, 1.5, 1.5);
  }

  // Vertical scratch line
  ctx.strokeStyle = 'rgba(240, 230, 210, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(210, 40);
  ctx.lineTo(215, 680);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'blurry-face',
    title: 'Blurry Portrait',
    description: 'Perfect for Remini De-blur & Enhance',
    suggestedPrompt: 'ultra high definition crystal clear sharpness',
    getDataUrl: createBlurryPortraitSample,
  },
  {
    id: 'vintage-photo',
    title: 'Faded 1950s Photo',
    description: 'Perfect for Old Photo Restoration',
    suggestedPrompt: 'archival silver restore',
    getDataUrl: createVintagePhotoSample,
  },
  {
    id: 'portrait',
    title: 'Studio Model',
    description: 'Ideal for AI Headshot & Toon filters',
    suggestedPrompt: 'Studio Headshot',
    getDataUrl: createPortraitSample,
  },
  {
    id: 'flower',
    title: 'Cherry Blossom',
    description: 'Great for Golden Hour Photoshoot',
    suggestedPrompt: 'Golden Hour Glow',
    getDataUrl: createBlossomSample,
  },
];
