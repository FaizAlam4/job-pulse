#!/usr/bin/env node

/**
 * Generate PWA icons with proper sizes using Sharp
 * Creates properly-sized PNG files for PWA manifest
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  try {
    // Dynamic import of sharp
    const sharp = (await import('sharp')).default;
    const publicDir = path.join(__dirname, 'public');

    // SVG template for icon
    const createSVG = (width, height, text = 'JP') => `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1E40AF;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#grad)"/>
        <text x="50%" y="50%" font-size="${Math.max(width, height) * 0.35}" font-weight="bold" font-family="Arial, sans-serif" fill="white" text-anchor="middle" dominant-baseline="central">${text}</text>
      </svg>
    `;

    // Define icon configurations
    const icons = [
      { name: 'icon-192.png', width: 192, height: 192 },
      { name: 'icon-512.png', width: 512, height: 512 },
      { name: 'icon-maskable-192.png', width: 192, height: 192 },
      { name: 'icon-maskable-512.png', width: 512, height: 512 },
      { name: 'screenshot-1.png', width: 540, height: 720, bgColor: '#0f1419' },
      { name: 'screenshot-2.png', width: 1280, height: 720, bgColor: '#0f1419' },
    ];

    for (const icon of icons) {
      let buffer;
      
      if (icon.name.includes('screenshot')) {
        // Screenshots: simple gradient background
        buffer = await sharp({
          create: {
            width: icon.width,
            height: icon.height,
            channels: 3,
            background: { r: 15, g: 20, b: 25 },
          },
        })
          .png()
          .toBuffer();
      } else {
        // Icons: convert SVG to PNG
        const svg = createSVG(icon.width, icon.height);
        buffer = await sharp(Buffer.from(svg))
          .png()
          .resize(icon.width, icon.height, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          })
          .toBuffer();
      }

      fs.writeFileSync(path.join(publicDir, icon.name), buffer);
      console.log(`✓ Created ${icon.name} (${icon.width}x${icon.height})`);
    }

    console.log('\n✅ All PWA icons created successfully!');
    console.log('   Icons are now properly sized PNG files.');
    console.log('   For production, replace with your actual brand icons.');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();


