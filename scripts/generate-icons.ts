import fs from 'fs';
import path from 'path';

// Clean vector SVG of the orange dumbbell on dark slate background
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb923c"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
  </defs>
  
  <!-- Solid Dark Theme Background (Maskable ready) -->
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)"/>
  
  <!-- Outer glowing border ring -->
  <rect width="504" height="504" x="4" y="4" rx="96" fill="none" stroke="#f97316" stroke-width="6" stroke-opacity="0.35"/>

  <!-- Iconic Dumbbell Graphic at 45 degree angle matching the app header logo -->
  <g transform="translate(256, 256) rotate(-45) translate(-256, -256)">
    <!-- Central Barbell Handle -->
    <rect x="176" y="242" width="160" height="28" rx="10" fill="#f8fafc"/>
    
    <!-- Left Inner Collar -->
    <rect x="156" y="200" width="22" height="112" rx="8" fill="url(#orangeGrad)"/>
    <!-- Left Main Heavy Plate -->
    <rect x="120" y="174" width="30" height="164" rx="12" fill="url(#orangeGrad)"/>
    <!-- Left Outer End Cap -->
    <rect x="98" y="228" width="18" height="56" rx="6" fill="#94a3b8"/>

    <!-- Right Inner Collar -->
    <rect x="334" y="200" width="22" height="112" rx="8" fill="url(#orangeGrad)"/>
    <!-- Right Main Heavy Plate -->
    <rect x="362" y="174" width="30" height="164" rx="12" fill="url(#orangeGrad)"/>
    <!-- Right Outer End Cap -->
    <rect x="396" y="228" width="18" height="56" rx="6" fill="#94a3b8"/>
  </g>
</svg>`;

const publicDir = path.resolve('public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIcon);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), svgIcon);
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.svg'), svgIcon);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.svg'), svgIcon);
fs.writeFileSync(path.join(iconsDir, 'maskable-icon-512x512.svg'), svgIcon);

console.log('App icons generated successfully');
