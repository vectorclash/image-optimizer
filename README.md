# Image Optimizer

A powerful command-line tool for batch optimizing PNG and JPG images to meet specific file size targets. Perfect for web developers, designers, and anyone who needs to ensure images stay under a certain file size limit.

## Features

- **Smart Optimization**: Binary search algorithm finds optimal quality settings
- **Safety Margin**: Built-in 1KB safety margin ensures files stay under target (accounts for filesystem overhead)
- **Batch Processing**: Process multiple images at once with wildcard patterns
- **Target File Sizes**: Default 40KB, fully customizable
- **Format Support**: PNG and JPG/JPEG with format-specific optimization
- **Aggressive Fallback**: Automatically tries lower quality levels and metadata stripping for stubborn files
- **Safe by Default**: Creates `optimized` folder in source directory, preserving originals
- **Recursive Processing**: Process entire directory trees
- **Detailed Reports**: See original vs optimized sizes, quality used, and savings

## Installation

```bash
npm install
```

To use globally (recommended):

```bash
npm link
```

After running `npm link`, you can use the tool from anywhere:

```bash
image-optimizer ~/Desktop/images/*
```

## Usage

### Basic Usage

After running `npm link`, optimize all images in a folder:

```bash
image-optimizer ~/Desktop/statics/*
```

This creates `~/Desktop/statics/optimized/` with all optimized images.

Optimize to a specific size (e.g., 50KB):

```bash
image-optimizer ~/Desktop/statics/* --size-kb 50
```

### Without npm link

If you haven't run `npm link`, use:

```bash
node src/cli.js ~/Desktop/statics/*
```

### Advanced Usage

**Process entire directory recursively:**

```bash
image-optimizer ./images --recursive
```

**Custom output location:**

```bash
image-optimizer ./images -o ~/Desktop/final
```

**Optimize in place (⚠️ overwrites originals):**

```bash
image-optimizer ~/Desktop/statics/* --in-place
```

**Adjust safety margin (default 1KB):**

```bash
image-optimizer ~/Desktop/statics/* --safety-margin 2048
```

**Control quality range:**

```bash
image-optimizer ~/Desktop/statics/* --min-quality 20 --max-quality 90
```

**Process directory (all supported files):**

```bash
image-optimizer ~/Desktop/statics
```

### Command-Line Options

```
Usage: image-optimizer [options] <input...>

Arguments:
  input...                  Input file(s), pattern (e.g., "*.png"), or directory

Options:
  -V, --version            output the version number
  -o, --output <dir>       Output directory (default: "optimized" folder in source directory)
  -s, --size <bytes>       Target file size in bytes (default: "40960")
  -k, --size-kb <kb>       Target file size in kilobytes (overrides --size)
  --min-quality <number>   Minimum quality (1-100) (default: "10")
  --max-quality <number>   Maximum quality (1-100) (default: "95")
  --safety-margin <bytes>  Safety margin in bytes to stay under target (default: "1024")
  --in-place              Optimize files in place (overwrites originals)
  --recursive             Process directories recursively
  -h, --help              display help for command
```

## How It Works

The optimizer uses a multi-stage approach to ensure images meet your target file size:

1. **Safety Margin**: Targets 1KB below your specified limit (e.g., 39KB for 40KB target) to account for filesystem overhead
2. **Initial Check**: If image is already under the adjusted target, it's simply copied
3. **Binary Search**: Uses quality levels 10-95 to find optimal compression while staying under target
4. **Format-Specific Compression**:
   - **PNG**: Palette-based lossy compression with maximum compression level (9)
   - **JPG**: MozJPEG for superior compression quality
5. **Aggressive Fallback**: If target isn't reached, tries:
   - Lower quality levels (down to quality 1)
   - Metadata stripping
   - Aggressive chroma subsampling (4:2:0)

This ensures virtually all images reach your target size while maintaining the highest quality possible.

## Examples

### Example 1: Basic usage - optimize all images in a folder

```bash
image-optimizer ~/Desktop/statics/*
# Creates ~/Desktop/statics/optimized/ with all images under 40KB
```

### Example 2: Optimize with different target size

```bash
image-optimizer ~/Desktop/statics/* --size-kb 50
# Targets 50KB (actually 49KB with safety margin)
```

### Example 3: Process entire directory recursively

```bash
image-optimizer ~/Projects/website/images --recursive
# Processes all images in images/ and subdirectories
```

### Example 4: Custom output location

```bash
image-optimizer ~/Desktop/statics/* -o ~/Desktop/production-ready
# Outputs to ~/Desktop/production-ready/ instead
```

## Output Example

```
Found 17 image(s) to optimize
Target size: 40 KB (40960 bytes)

Optimizing images...

Optimization Results:

✓ banner-1.jpg
  156.2 KB → 38.9 KB (-75.10%) quality: 75

✓ hero-image.jpg
  1.2 MB → 39.2 KB (-96.75%) quality: 48

✓ logo.png
  89.3 KB → 37.8 KB (-57.67%) quality: 85

✓ thumbnail-small.jpg
  25.4 KB → 25.4 KB (-0.00%) quality: 100

Summary:
  Total images: 17
  Successful: 17
  Total savings: 2.8 MB

  Output directory: /Users/you/Desktop/statics/optimized
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

## Why the Safety Margin?

The tool uses a 1KB safety margin by default (targets 39KB for 40KB limit) because:

- **Filesystem overhead**: File sizes on disk vs. actual file sizes can differ slightly
- **Edge case protection**: Ensures files that are close to the limit get processed and optimized
- **Consistent results**: Provides a small buffer for compression variations

You can adjust this with `--safety-margin` if needed (e.g., `--safety-margin 2048` for 2KB).

## Tips

- **For web images**: 40KB default is ideal for most use cases
- **For QA**: The 1KB safety margin ensures files stay under target while maximizing quality
- **Keep originals**: Default behavior creates `optimized` folder - originals stay safe
- **Test first**: Process a few images before doing large batches
- **Adjust safety margin**: Increase to 2-3KB if you need more buffer (e.g., `--safety-margin 2048`)
- **Use recursive mode**: Process entire project directories at once with `--recursive`

## License

MIT
