import { createCanvas, loadImage } from 'canvas';
import fs from 'fs-extra';
import * as path from 'path';

// 主题色
const RETRO_ORANGE = '#ff5500';
const RETRO_AMBER = '#ffb000';
const RETRO_LIGHT = '#e0e0e0';
const RETRO_BLACK = '#121212'; // 不一定是纯黑，使用retro-black

// 软件名称
const APP_NAME = 'Chronos';

async function generateSplash() {
  const outputDir = path.join(process.cwd(), 'assets');
  const logoPath = path.join(outputDir, 'logo-transparent.png');
  const namePath = path.join(outputDir, 'app-name.png');

  // 检查文件是否存在
  if (!(await fs.pathExists(logoPath))) {
    console.error(`❌ Logo文件不存在: ${logoPath}`);
    console.log('请先运行导出logo脚本: npm run export-logo');
    process.exit(1);
  }

  if (!(await fs.pathExists(namePath))) {
    console.error(`❌ 软件名称文件不存在: ${namePath}`);
    console.log('请先运行导出logo脚本: npm run export-logo');
    process.exit(1);
  }

  // 加载logo和软件名称图片
  const logoImage = await loadImage(logoPath);
  const nameImage = await loadImage(namePath);

  // 创建开屏图片画布（使用常见的开屏尺寸，如1080x1920或更高）
  // 可以根据需要调整尺寸
  const width = 1080;
  const height = 1920;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 绘制黑色背景（不一定是纯黑）
  ctx.fillStyle = RETRO_BLACK;
  ctx.fillRect(0, 0, width, height);

  // 计算logo和文字的位置（居中）
  const logoScale = 0.4; // logo缩放比例
  const logoWidth = logoImage.width * logoScale;
  const logoHeight = logoImage.height * logoScale;
  const logoX = (width - logoWidth) / 2;
  const logoY = height * 0.35; // logo在垂直方向35%的位置

  // 绘制logo
  ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);

  // 计算软件名称的位置（logo下方）
  const nameScale = 0.6; // 软件名称缩放比例
  const nameWidth = nameImage.width * nameScale;
  const nameHeight = nameImage.height * nameScale;
  const nameX = (width - nameWidth) / 2;
  const nameY = logoY + logoHeight + 80; // logo下方80px

  // 绘制软件名称
  ctx.drawImage(nameImage, nameX, nameY, nameWidth, nameHeight);

  // 保存开屏图片
  const splashPath = path.join(outputDir, 'splash-screen.png');
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(splashPath, buffer);
  console.log(`✅ 开屏占位图片已生成: ${splashPath}`);
  console.log(`   尺寸: ${width}x${height}`);
}

async function main() {
  try {
    console.log('开始生成开屏占位图片...');
    await generateSplash();
    console.log('✅ 开屏占位图片生成完成！');
  } catch (error) {
    console.error('❌ 生成失败:', error);
    process.exit(1);
  }
}

main();

