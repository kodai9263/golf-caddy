import sharp from 'sharp';

// 緑背景に白い円（ゴルフボール風）のSVGを各サイズで生成
const makeSvg = (size) => {
  const cx = size / 2;
  const r = size * 0.38;
  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="#2d6a4f"/>
      <circle cx="${cx}" cy="${cx}" r="${r}" fill="white"/>
      <circle cx="${cx - r*0.25}" cy="${cx - r*0.25}" r="${r*0.08}" fill="#ccc"/>
      <circle cx="${cx + r*0.3}" cy="${cx - r*0.1}" r="${r*0.08}" fill="#ccc"/>
      <circle cx="${cx}" cy="${cx + r*0.35}" r="${r*0.08}" fill="#ccc"/>
      <circle cx="${cx - r*0.1}" cy="${cx + r*0.1}" r="${r*0.08}" fill="#ccc"/>
      <circle cx="${cx + r*0.2}" cy="${cx + r*0.2}" r="${r*0.08}" fill="#ccc"/>
    </svg>
  `);
};

await sharp(makeSvg(192)).png().toFile('public/icon-192.png');
await sharp(makeSvg(512)).png().toFile('public/icon-512.png');
console.log('アイコン生成完了');
