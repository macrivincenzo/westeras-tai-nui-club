#!/usr/bin/env python3
"""
Konverterar JPG-bilder till WebP-format för bättre prestanda
"""
import os
from PIL import Image

def convert_jpg_to_webp(input_path, output_path, quality=85):
    """Konverterar en JPG-bild till WebP-format"""
    try:
        img = Image.open(input_path)
        # Konvertera till RGB om bilden har alpha-kanal
        if img.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = rgb_img
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Spara som WebP med optimerad kvalitet
        img.save(output_path, 'WEBP', quality=quality, method=6)
        print(f"✓ Konverterad: {os.path.basename(input_path)} -> {os.path.basename(output_path)}")
        return True
    except Exception as e:
        print(f"✗ Fel vid konvertering av {input_path}: {e}")
        return False

def main():
    """Huvudfunktion som konverterar alla bilder i träningsschema-mappen"""
    schema_dir = "public/träningsschema"
    
    if not os.path.exists(schema_dir):
        print(f"Fel: Mappen {schema_dir} finns inte!")
        return
    
    # Lista alla JPG-filer
    jpg_files = [f for f in os.listdir(schema_dir) if f.lower().endswith(('.jpg', '.jpeg'))]
    
    if not jpg_files:
        print("Inga JPG-bilder hittades!")
        return
    
    print(f"Hittade {len(jpg_files)} bilder att konvertera...\n")
    
    converted = 0
    for jpg_file in jpg_files:
        input_path = os.path.join(schema_dir, jpg_file)
        # Skapa WebP-filnamn
        webp_file = os.path.splitext(jpg_file)[0] + '.webp'
        output_path = os.path.join(schema_dir, webp_file)
        
        # Konvertera om WebP-filen inte redan finns
        if not os.path.exists(output_path):
            if convert_jpg_to_webp(input_path, output_path):
                converted += 1
        else:
            print(f"⊘ Hoppar över (finns redan): {webp_file}")
    
    print(f"\n✅ Klart! {converted} bilder konverterade till WebP.")

if __name__ == "__main__":
    main()

