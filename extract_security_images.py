#!/usr/bin/env python3
"""
Extract security images from the profile picture grid.
The source image contains a 3x4 grid of 12 security images.
"""

from PIL import Image
import os

def extract_security_images():
    # Load the source image
    source_path = "profile picture.jpeg"
    output_dir = "public/images/security"

    print(f"Loading source image: {source_path}")
    img = Image.open(source_path)

    # Get image dimensions
    width, height = img.size
    print(f"Source image dimensions: {width}x{height}")

    # The grid layout is 3 columns x 4 rows
    # Precise measurements from the actual image layout

    # Grid dimensions
    cols = 3
    rows = 4

    # Measurements based on actual image analysis
    # More precise measurements for exact cropping

    # Starting position of first image (top-left)
    start_x = 137
    start_y = 182

    # Image dimensions (from source)
    img_width = 119
    img_height = 82

    # Spacing between images (calculated from equal distribution)
    h_spacing = 153  # horizontal distance between left edges of adjacent images
    v_spacing = 108  # vertical distance between top edges of adjacent images

    print(f"Grid: {cols}x{rows}")
    print(f"Image dimensions: {img_width}x{img_height}")
    print(f"Spacing: {h_spacing}x{v_spacing}")

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Extract each image
    image_id = 1
    for row in range(rows):
        for col in range(cols):
            # Calculate position using spacing
            x = start_x + (col * h_spacing)
            y = start_y + (row * v_spacing)

            # Define crop box (left, upper, right, lower)
            crop_box = (
                x,
                y,
                x + img_width,
                y + img_height
            )

            # Crop and save
            cropped = img.crop(crop_box)

            # Convert RGBA to RGB if necessary
            if cropped.mode == 'RGBA':
                rgb_cropped = Image.new('RGB', cropped.size, (255, 255, 255))
                rgb_cropped.paste(cropped, mask=cropped.split()[3])
                cropped = rgb_cropped

            output_path = os.path.join(output_dir, f"security-{image_id}.jpg")
            cropped.save(output_path, "JPEG", quality=95)

            print(f"Extracted image {image_id}: {output_path} (position: {x},{y})")
            image_id += 1

    print(f"\nSuccessfully extracted {image_id - 1} security images!")

if __name__ == "__main__":
    try:
        extract_security_images()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
