import sharp from 'sharp';

const sizes = [192, 512, 1024];

function iconSvg(size) {
  const r = size === 1024 ? 60 : size === 512 ? 50 : 40;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1E40AF"/>
        <stop offset="100%" stop-color="#2563EB"/>
      </linearGradient>
    </defs>
    <rect width="200" height="200" rx="${r}" fill="url(#g)"/>
    <rect x="16" y="16" width="168" height="168" rx="${r-10}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
    <rect x="89" y="45" width="22" height="115" rx="6" fill="white"/>
    <rect x="35" y="45" width="130" height="30" rx="8" fill="white"/>
    <path d="M50 152 C 75 170, 125 170, 150 152" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="6" stroke-linecap="round"/>
  </svg>`;
}

const svg180 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E40AF"/>
      <stop offset="100%" stop-color="#2563EB"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="40" fill="url(#g)"/>
  <rect x="20" y="20" width="160" height="160" rx="30" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
  <rect x="90" y="40" width="20" height="120" rx="6" fill="white"/>
  <rect x="30" y="40" width="140" height="32" rx="8" fill="white"/>
</svg>`;

async function main() {
  for (const size of sizes) {
    await sharp(Buffer.from(iconSvg(size))).resize(size, size).png().toFile(`public/icon-${size}.png`);
    console.log(`Generated icon-${size}.png`);
  }
  await sharp(Buffer.from(svg180)).resize(180, 180).png().toFile('public/apple-touch-icon.png');
  console.log('Generated apple-touch-icon.png');
  // Favicon 32
  await sharp(Buffer.from(svg180)).resize(32, 32).png().toFile('public/favicon-32.png');
  console.log('Generated favicon-32.png');
  // Favicon 16
  await sharp(Buffer.from(svg180)).resize(16, 16).png().toFile('public/favicon-16.png');
  console.log('Generated favicon-16.png');
}

main().catch(console.error);
