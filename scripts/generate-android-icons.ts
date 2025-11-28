import { createCanvas, loadImage } from 'canvas';
import fs from 'fs-extra';
import * as path from 'path';

// Android图标尺寸定义
const ANDROID_ICON_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Android foreground图标尺寸（用于adaptive icon）
const FOREGROUND_SIZE = 1024;

async function generateAndroidIcons() {
  const sourceIconPath = path.join(process.cwd(), 'assets', 'Chronos-iOS-Default-1024x1024@1x.png');
  const androidResPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');

  // 检查源图标是否存在
  if (!(await fs.pathExists(sourceIconPath))) {
    console.error(`❌ 源图标文件不存在: ${sourceIconPath}`);
    process.exit(1);
  }

  // 加载源图标
  const sourceImage = await loadImage(sourceIconPath);
  console.log(`✅ 已加载源图标: ${sourceIconPath}`);

  // 生成各个尺寸的launcher图标
  for (const [mipmapDir, size] of Object.entries(ANDROID_ICON_SIZES)) {
    const outputDir = path.join(androidResPath, mipmapDir);
    await fs.ensureDir(outputDir);

    // 创建画布并绘制图标
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // 绘制图标（缩放并居中）
    ctx.drawImage(sourceImage, 0, 0, size, size);

    // 保存ic_launcher.png
    const launcherPath = path.join(outputDir, 'ic_launcher.png');
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(launcherPath, buffer);
    console.log(`✅ 已生成: ${launcherPath} (${size}x${size})`);

    // 同时生成ic_launcher_round.png（圆形图标）
    const roundPath = path.join(outputDir, 'ic_launcher_round.png');
    await fs.writeFile(roundPath, buffer);
    console.log(`✅ 已生成: ${roundPath} (${size}x${size})`);
  }

  // 生成foreground图标（用于adaptive icon）
  const foregroundDir = path.join(androidResPath, 'mipmap-xxxhdpi');
  await fs.ensureDir(foregroundDir);

  const foregroundCanvas = createCanvas(FOREGROUND_SIZE, FOREGROUND_SIZE);
  const foregroundCtx = foregroundCanvas.getContext('2d');

  // 绘制foreground图标（保持1024x1024）
  foregroundCtx.drawImage(sourceImage, 0, 0, FOREGROUND_SIZE, FOREGROUND_SIZE);

  const foregroundPath = path.join(foregroundDir, 'ic_launcher_foreground.png');
  const foregroundBuffer = foregroundCanvas.toBuffer('image/png');
  await fs.writeFile(foregroundPath, foregroundBuffer);
  console.log(`✅ 已生成foreground图标: ${foregroundPath} (${FOREGROUND_SIZE}x${FOREGROUND_SIZE})`);

  // 为其他mipmap目录也生成foreground图标（使用对应尺寸）
  for (const [mipmapDir, size] of Object.entries(ANDROID_ICON_SIZES)) {
    if (mipmapDir === 'mipmap-xxxhdpi') continue; // 已经生成过了

    const outputDir = path.join(androidResPath, mipmapDir);
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sourceImage, 0, 0, size, size);

    const foregroundPath = path.join(outputDir, 'ic_launcher_foreground.png');
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(foregroundPath, buffer);
    console.log(`✅ 已生成foreground图标: ${foregroundPath} (${size}x${size})`);
  }

  console.log('✅ 所有Android图标生成完成！');
}

async function main() {
  try {
    console.log('开始生成Android应用图标...');
    await generateAndroidIcons();
  } catch (error) {
    console.error('❌ 生成失败:', error);
    process.exit(1);
  }
}

main();


