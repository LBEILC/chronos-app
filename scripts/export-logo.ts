import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs-extra';
import * as path from 'path';

// 软件名称
const APP_NAME = 'Chronos';

// 主题色
const RETRO_ORANGE = '#ff5500';
const RETRO_AMBER = '#ffb000';
const RETRO_LIGHT = '#e0e0e0';

// lucide-react Disc图标的SVG（base64编码）
const DISC_SVG_BASE64 = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWRpc2MtaWNvbiBsdWNpZGUtZGlzYyI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIyIi8+PC9zdmc+';

async function exportLogo() {
  // 创建logo画布（无背景，透明）
  const logoSize = 512;
  const canvas = createCanvas(logoSize, logoSize);
  const ctx = canvas.getContext('2d');

  // 设置透明背景
  ctx.clearRect(0, 0, logoSize, logoSize);

  // 解码SVG并替换颜色和尺寸
  const svgString = Buffer.from(DISC_SVG_BASE64, 'base64').toString('utf-8');
  // 替换currentColor为主题色，并放大尺寸
  const coloredSvg = svgString
    .replace('stroke="currentColor"', `stroke="${RETRO_ORANGE}"`)
    .replace('width="24" height="24"', `width="${logoSize}" height="${logoSize}"`);

  // 使用canvas加载SVG
  const img = await loadImage(`data:image/svg+xml;base64,${Buffer.from(coloredSvg).toString('base64')}`);
  ctx.drawImage(img, 0, 0, logoSize, logoSize);

  // 保存logo（PNG，透明背景）
  const outputDir = path.join(process.cwd(), 'assets');
  await fs.ensureDir(outputDir);
  const logoPath = path.join(outputDir, 'logo-transparent.png');
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(logoPath, buffer);
  console.log(`✅ Logo已导出: ${logoPath}`);
}

async function exportAppName() {
  // 创建文本画布
  const canvas = createCanvas(800, 200);
  const ctx = canvas.getContext('2d');

  // 设置透明背景
  ctx.clearRect(0, 0, 800, 200);

  // 设置字体样式（使用Share Tech Mono字体，如果没有则使用monospace）
  ctx.fillStyle = RETRO_LIGHT;
  ctx.font = 'bold 120px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 绘制软件名称
  ctx.fillText(APP_NAME, 400, 100);

  // 保存软件名称图片
  const outputDir = path.join(process.cwd(), 'assets');
  await fs.ensureDir(outputDir);
  const namePath = path.join(outputDir, 'app-name.png');
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(namePath, buffer);
  console.log(`✅ 软件名称已导出: ${namePath}`);
}

async function main() {
  try {
    console.log('开始导出logo和软件名称...');
    await exportLogo();
    await exportAppName();
    console.log('✅ 所有资源导出完成！');
  } catch (error) {
    console.error('❌ 导出失败:', error);
    process.exit(1);
  }
}

main();

