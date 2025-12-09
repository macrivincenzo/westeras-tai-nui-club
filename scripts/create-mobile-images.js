#!/usr/bin/env node
/**
 * Skapar mobil-optimerade bilder (mindre storlek för snabbare laddning på mobil)
 */
import sharp from 'sharp';
import { stat } from 'fs/promises';
import { existsSync } from 'fs';
import { basename } from 'path';

const MOBILE_MAX_WIDTH = 768; // Max bredd för mobil-bilder
const MOBILE_MAX_HEIGHT = 1024; // Max höjd för mobil-bilder
const QUALITY = 80; // Lite lägre kvalitet för mobil (snabbare laddning)

async function createMobileImage(inputPath, outputPath) {
  try {
    if (!existsSync(inputPath)) {
      console.log(`⚠️  Filen finns inte: ${inputPath}`);
      return false;
    }

    const stats = await stat(inputPath);
    const outputStats = existsSync(outputPath) ? await stat(outputPath) : null;
    
    // Hoppa över om output-filen är nyare
    if (outputStats && outputStats.mtime > stats.mtime) {
      console.log(`⊘ Hoppar över (redan uppdaterad): ${basename(outputPath)}`);
      return false;
    }

    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Resize för mobil om bilden är större än max-storlek
    let pipeline = image;
    
    if (metadata.width > MOBILE_MAX_WIDTH || metadata.height > MOBILE_MAX_HEIGHT) {
      pipeline = pipeline.resize(MOBILE_MAX_WIDTH, MOBILE_MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    await pipeline
      .webp({ 
        quality: QUALITY,
        effort: 6
      })
      .toFile(outputPath);

    const inputSize = stats.size;
    const outputSize = (await stat(outputPath)).size;
    const savings = ((1 - outputSize / inputSize) * 100).toFixed(1);
    
    console.log(`✓ Mobil: ${basename(inputPath)} → ${basename(outputPath)} (${(inputSize / 1024).toFixed(0)}KB → ${(outputSize / 1024).toFixed(0)}KB, -${savings}%)`);
    return true;
  } catch (error) {
    console.error(`✗ Fel vid skapande av mobil-bild ${inputPath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('📱 Skapar mobil-optimerade bilder...\n');

  const mobileImages = [
    { 
      input: 'public/hero/Mohammedfrontpage.JPG', 
      output: 'public/hero/Mohammedfrontpage-mobile.webp' 
    },
    { 
      input: 'public/hero/Submissionfrontpagemobile.JPG', 
      output: 'public/hero/Submissionfrontpagemobile-mobile.webp' 
    },
    { 
      input: 'public/LucianoColloseum.JPG', 
      output: 'public/LucianoColloseum-mobile.webp' 
    },
    { 
      input: 'public/Google5stjärnigreview.jpg', 
      output: 'public/Google5stjärnigreview-mobile.webp' 
    },
  ];

  let totalCreated = 0;

  for (const { input, output } of mobileImages) {
    if (await createMobileImage(input, output)) {
      totalCreated++;
    }
  }

  console.log(`\n✅ Klart! ${totalCreated} mobil-optimerade bilder skapade.`);
}

main().catch(console.error);

