#!/usr/bin/env node
/**
 * Konverterar bilder till WebP-format med Sharp för bättre prestanda
 */
import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { existsSync } from 'fs';

const QUALITY = 85;
const MAX_WIDTH = 1920; // Max bredd för hero-bilder
const MAX_HEIGHT = 1080; // Max höjd för hero-bilder

async function convertToWebP(inputPath, outputPath, options = {}) {
  try {
    const stats = await stat(inputPath);
    const outputStats = existsSync(outputPath) ? await stat(outputPath) : null;
    
    // Hoppa över om output-filen är nyare
    if (outputStats && outputStats.mtime > stats.mtime) {
      console.log(`⊘ Hoppar över (redan uppdaterad): ${basename(outputPath)}`);
      return false;
    }

    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Optimera bildstorlek för hero-bilder
    let pipeline = image;
    
    if (options.isHero && (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT)) {
      pipeline = pipeline.resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    await pipeline
      .webp({ 
        quality: QUALITY,
        effort: 6 // Max komprimering
      })
      .toFile(outputPath);

    const inputSize = stats.size;
    const outputSize = (await stat(outputPath)).size;
    const savings = ((1 - outputSize / inputSize) * 100).toFixed(1);
    
    console.log(`✓ ${basename(inputPath)} → ${basename(outputPath)} (${(inputSize / 1024).toFixed(0)}KB → ${(outputSize / 1024).toFixed(0)}KB, -${savings}%)`);
    return true;
  } catch (error) {
    console.error(`✗ Fel vid konvertering av ${inputPath}:`, error.message);
    return false;
  }
}

async function processDirectory(dir, options = {}) {
  try {
    const files = await readdir(dir);
    const imageFiles = files.filter(f => 
      /\.(jpg|jpeg|JPG|JPEG|png|PNG)$/i.test(f)
    );

    if (imageFiles.length === 0) {
      return 0;
    }

    let converted = 0;
    for (const file of imageFiles) {
      const inputPath = join(dir, file);
      const webpName = file.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      const outputPath = join(dir, webpName);

      if (await convertToWebP(inputPath, outputPath, options)) {
        converted++;
      }
    }

    return converted;
  } catch (error) {
    console.error(`Fel vid läsning av ${dir}:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('🖼️  Konverterar bilder till WebP-format...\n');

  const imagesToConvert = [
    { path: 'public/hero/Mohammedfrontpage.JPG', output: 'public/hero/Mohammedfrontpage.webp', isHero: true },
    { path: 'public/hero/Submissionfrontpage.JPG', output: 'public/hero/Submissionfrontpage.webp', isHero: true },
    { path: 'public/LucianoColloseum.JPG', output: 'public/LucianoColloseum.webp', isHero: false },
    { path: 'public/Google5stjärnigreview.jpg', output: 'public/Google5stjärnigreview.webp', isHero: false },
  ];

  let totalConverted = 0;

  // Konvertera specifika bilder
  for (const { path, output, isHero } of imagesToConvert) {
    if (existsSync(path)) {
      if (await convertToWebP(path, output, { isHero })) {
        totalConverted++;
      }
    } else {
      console.log(`⚠️  Filen finns inte: ${path}`);
    }
  }

  // Konvertera alla bilder i hero-mappen
  const heroConverted = await processDirectory('public/hero', { isHero: true });
  totalConverted += heroConverted;

  console.log(`\n✅ Klart! ${totalConverted} bilder konverterade till WebP.`);
}

main().catch(console.error);

