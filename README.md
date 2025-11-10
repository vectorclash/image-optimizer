# Image Optimizer

A powerful command-line tool for batch optimizing PNG and JPG images to meet specific file size targets. Perfect for web developers, designers, and anyone who needs to ensure images stay under a certain file size limit.

## Features

- Batch process multiple images at once
- Target specific file sizes (default: 40KB)
- Supports PNG and JPG/JPEG formats
- Smart quality adjustment using binary search algorithm
- Recursive directory processing
- In-place optimization option
- Detailed optimization reports
- Preserves original files by default

## Installation

```bash
npm install
```

To use globally:

```bash
npm link
```

## Usage

### Basic Usage

Optimize all PNG files in the current directory to 40KB:

```bash
node src/cli.js "*.png"
```

Optimize all JPG files to a specific size (e.g., 50KB):

```bash
node src/cli.js "*.jpg" --size-kb 50
```

### Advanced Usage

**Optimize images in a directory:**

```bash
node src/cli.js ./images --output ./optimized
```

**Recursive directory processing:**

```bash
node src/cli.js ./images --recursive --output ./optimized
```

**Optimize in place (overwrites originals):**

```bash
node src/cli.js "*.png" --in-place
```

**Custom target size in bytes:**

```bash
node src/cli.js "*.jpg" --size 51200
```

**Control quality range:**

```bash
node src/cli.js "*.png" --min-quality 20 --max-quality 90
```

### Command-Line Options

```
Usage: image-optimizer [options] <input>

Arguments:
  input                     Input file pattern (e.g., "*.png" or "images/*.jpg") or directory

Options:
  -V, --version            output the version number
  -o, --output <dir>       Output directory (default: "./optimized")
  -s, --size <bytes>       Target file size in bytes (default: "40960")
  -k, --size-kb <kb>       Target file size in kilobytes (overrides --size)
  --min-quality <number>   Minimum quality (1-100) (default: "10")
  --max-quality <number>   Maximum quality (1-100) (default: "95")
  --in-place              Optimize files in place (overwrites originals)
  --recursive             Process directories recursively
  -h, --help              display help for command
```

## How It Works

The optimizer uses a binary search algorithm to find the optimal quality setting that gets your image as close to the target file size as possible while maintaining the highest quality.

1. **Initial Check**: If the image is already under the target size, it's simply copied
2. **Binary Search**: The tool iteratively adjusts the quality setting to find the best compromise
3. **Format-Specific Compression**:
   - PNG: Uses maximum compression level (9) with high effort (10)
   - JPG: Uses mozjpeg for superior compression

## Examples

### Example 1: Optimize all images in a folder for web use

```bash
node src/cli.js ./my-images --recursive --size-kb 40 --output ./web-ready
```

### Example 2: Optimize product photos to exactly 50KB

```bash
node src/cli.js "./products/*.jpg" --size-kb 50 --output ./optimized-products
```

### Example 3: Quick optimization with default settings

```bash
node src/cli.js "screenshot*.png"
```

## Output Example

```
Found 5 image(s) to optimize
Target size: 40 KB (40960 bytes)

Optimizing images...

Optimization Results:

✓ image1.png
  150.5 KB → 38.2 KB (-74.62%) quality: 75

✓ image2.jpg
  200.3 KB → 39.8 KB (-80.13%) quality: 68

⚠ image3.png
  500.2 KB → 45.3 KB (-90.94%) quality: 10
  Warning: Could not reach target size of 40 KB

Summary:
  Total images: 5
  Successful: 5
  Total savings: 850.5 KB

  Output directory: ./optimized
```

## Requirements

- Node.js 14 or higher
- npm or yarn

## Dependencies

- **sharp**: High-performance image processing
- **commander**: CLI framework
- **chalk**: Terminal styling
- **ora**: Elegant terminal spinners
- **glob**: File pattern matching

## Limitations

- Very high-resolution images might not reach extremely small target sizes while maintaining acceptable quality
- The tool will use minimum quality settings if the target size cannot be reached
- Processing very large batches may take time depending on your system

## Tips

- Start with default quality settings (10-95) and adjust if needed
- For web images, 40KB is a good balance between quality and file size
- Use `--recursive` for processing entire folder structures
- Always test a few images first before batch processing in-place
- Keep originals if you're unsure about the results

## License

MIT
