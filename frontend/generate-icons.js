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

    // Creative "Job Pulse" mark: briefcase + pulse line + upward trend
    const createIconSVG = (width, height, { maskable = false } = {}) => {
      const base = Math.min(width, height);
      const pad = maskable ? Math.round(base * 0.17) : Math.round(base * 0.1);
      const inner = base - pad * 2;
      const x = pad;
      const y = pad;

      const handleW = inner * 0.34;
      const handleH = inner * 0.16;
      const handleX = x + (inner - handleW) / 2;
      const handleY = y + inner * 0.22;

      const bodyX = x + inner * 0.12;
      const bodyY = y + inner * 0.36;
      const bodyW = inner * 0.76;
      const bodyH = inner * 0.5;
      const bodyR = inner * 0.09;

      const pulseY = bodyY + bodyH * 0.55;
      const pulseStartX = bodyX + bodyW * 0.16;
      const pulseEndX = bodyX + bodyW * 0.84;

      const p1 = `${pulseStartX} ${pulseY}`;
      const p2 = `${bodyX + bodyW * 0.3} ${pulseY}`;
      const p3 = `${bodyX + bodyW * 0.38} ${pulseY - bodyH * 0.18}`;
      const p4 = `${bodyX + bodyW * 0.47} ${pulseY + bodyH * 0.15}`;
      const p5 = `${bodyX + bodyW * 0.56} ${pulseY - bodyH * 0.08}`;
      const p6 = `${pulseEndX} ${pulseY - bodyH * 0.08}`;

      const arrowX = bodyX + bodyW * 0.72;
      const arrowY = bodyY + bodyH * 0.26;
      const arrow = `
        M ${arrowX} ${arrowY + bodyH * 0.11}
        L ${arrowX + bodyW * 0.12} ${arrowY - bodyH * 0.01}
        M ${arrowX + bodyW * 0.05} ${arrowY - bodyH * 0.01}
        L ${arrowX + bodyW * 0.12} ${arrowY - bodyH * 0.01}
        L ${arrowX + bodyW * 0.12} ${arrowY + bodyH * 0.06}
      `;

      return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0B132B;stop-opacity:1" />
            <stop offset="45%" style="stop-color:#1E3A8A;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0EA5E9;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="pulse" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#67E8F9;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#22D3EE;stop-opacity:1" />
          </linearGradient>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="${base * 0.02}" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <rect width="${width}" height="${height}" rx="${base * 0.22}" fill="url(#bg)"/>
        <circle cx="${x + inner / 2}" cy="${y + inner / 2}" r="${inner * 0.46}" fill="#FFFFFF" fill-opacity="0.08"/>

        <path d="M ${handleX} ${handleY + handleH}
                 Q ${handleX} ${handleY} ${handleX + handleW * 0.22} ${handleY}
                 L ${handleX + handleW * 0.78} ${handleY}
                 Q ${handleX + handleW} ${handleY} ${handleX + handleW} ${handleY + handleH}"
              fill="none"
              stroke="#E2E8F0"
              stroke-width="${inner * 0.06}"
              stroke-linecap="round"
              stroke-linejoin="round"/>

        <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="${bodyR}"
              fill="#E2E8F0" fill-opacity="0.16"
              stroke="#F8FAFC" stroke-opacity="0.82"
              stroke-width="${inner * 0.03}"/>

        <polyline points="${p1}, ${p2}, ${p3}, ${p4}, ${p5}, ${p6}"
                  fill="none"
                  stroke="url(#pulse)"
                  stroke-width="${inner * 0.055}"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  filter="url(#glow)"/>

        <path d="${arrow}"
              fill="none"
              stroke="#BAE6FD"
              stroke-width="${inner * 0.05}"
              stroke-linecap="round"
              stroke-linejoin="round"/>
      </svg>
    `;
    };

    // Define icon configurations
    const icons = [
      { name: 'favicon.png', width: 64, height: 64 },
      { name: 'icon-192.png', width: 192, height: 192 },
      { name: 'icon-512.png', width: 512, height: 512 },
      { name: 'icon-maskable-192.png', width: 192, height: 192, maskable: true },
      { name: 'icon-maskable-512.png', width: 512, height: 512, maskable: true },
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
        const svg = createIconSVG(icon.width, icon.height, { maskable: !!icon.maskable });
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


