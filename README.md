# Image Optimizer

A powerful command-line tool for batch optimizing PNG and JPG images with quality-based or size-based optimization. Perfect for web developers, designers, and anyone who needs to compress images while maintaining excellent visual quality.

## Features

- **Quality-First Optimization**: Default mode compresses images at 70-80 quality for aggressive compression with good visual quality
- **Optional Size Targeting**: Specify a target file size when needed (e.g., 40KB) with binary search algorithm
- **Smart Compression**: Uses MozJPEG for JPGs and lossy palette compression for PNGs
- **Batch Processing**: Process multiple images at once with wildcard patterns
- **Format Support**: PNG and JPG/JPEG with format-specific optimization
- **Aggressive Fallback**: When size-targeting, automatically tries lower quality levels and metadata stripping
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

After running `npm link`, optimize all images in a folder with quality-based optimization (default):

```bash
image-optimizer ~/Desktop/statics/*
```

This creates `~/Desktop/statics/optimized/` with all images optimized at quality 70-80 for aggressive compression with good visual quality.

Banner ad backup mode (quick 40KB optimization):

```bash
image-optimizer ~/Desktop/statics/* --backup
```

Optimize to a specific size (e.g., 50KB):

```bash
image-optimizer ~/Desktop/statics/* --size-kb 50
```

Adjust the quality range for more or less compression:

```bash
# Higher quality, larger files
image-optimizer ~/Desktop/statics/* --min-quality 85 --max-quality 95

# Even more aggressive compression, smaller files
image-optimizer ~/Desktop/statics/* --min-quality 60 --max-quality 70
```

### Without npm link

If you haven't run `npm link`, use:

```bash
node src/cli.js ~/Desktop/statics/*
```

### Advanced Usage

**Banner ad backup mode (40KB target):**

```bash
image-optimizer ./images --backup
# Quick shortcut for --size-kb 40 with optimized settings
```

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

**Adjust safety margin when size-targeting (default 1KB):**

```bash
image-optimizer ~/Desktop/statics/* --size-kb 40 --safety-margin 2048
```

**Control quality range (default 70-80 for quality mode, 10-80 for size mode):**

```bash
# Quality mode with custom range (higher quality)
image-optimizer ~/Desktop/statics/* --min-quality 85 --max-quality 95

# Size mode with custom quality range
image-optimizer ~/Desktop/statics/* --size-kb 40 --min-quality 20 --max-quality 90
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
  -s, --size <bytes>       Target file size in bytes (optional, uses quality mode if not set)
  -k, --size-kb <kb>       Target file size in kilobytes (overrides --size)
  --backup                Banner ad backup mode: targets 40KB with optimized settings
  --min-quality <number>   Minimum quality 1-100 (default: 70 for quality mode, 10 for size mode)
  --max-quality <number>   Maximum quality 1-100 (default: 80)
  --safety-margin <bytes>  Safety margin in bytes to stay under target (default: 1024, only for size mode)
  --in-place              Optimize files in place (overwrites originals)
  --recursive             Process directories recursively
  -h, --help              display help for command
```

## How It Works

The optimizer has two modes:

### Quality-Based Optimization (Default)

When no target size is specified, the tool optimizes for visual quality:

1. **Quality Range**: Uses quality 70-80 (configurable) for aggressive compression with good visual quality
2. **Single Pass**: Compresses each image once at the maximum quality setting
3. **Format-Specific Compression**:
   - **PNG**: Palette-based lossy compression with maximum compression level (9)
   - **JPG**: MozJPEG for superior compression quality
4. **Predictable Results**: Consistent quality across all images while achieving good file size reduction

This mode is ideal when you want to compress images as much as possible while maintaining high visual quality, without worrying about specific file size limits.

### Size-Based Optimization (Optional)

When you specify `--size` or `--size-kb`, the tool targets a specific file size:

1. **Safety Margin**: Targets 1KB below your specified limit (e.g., 39KB for 40KB target) to account for filesystem overhead
2. **Initial Check**: If image is already under the adjusted target, it's simply copied
3. **Binary Search**: Uses quality levels 10-95 to find optimal compression while staying under target
4. **Format-Specific Compression**: Same as quality mode
5. **Aggressive Fallback**: If target isn't reached, tries:
   - Lower quality levels (down to quality 1)
   - Metadata stripping
   - Aggressive chroma subsampling (4:2:0)

This ensures virtually all images reach your target size while maintaining the highest quality possible.

## Examples

### Example 1: Quality-based optimization (default)

```bash
image-optimizer ~/Desktop/statics/*
# Creates ~/Desktop/statics/optimized/ with all images compressed at quality 70-80
# Aggressive compression with good visual quality - great for web use
```

### Example 2: Higher quality optimization

```bash
image-optimizer ~/Desktop/statics/* --min-quality 85 --max-quality 95
# Larger files with better quality retention
# Use when quality is more important than file size
```

### Example 3: Banner ad backup mode

```bash
image-optimizer ~/Desktop/banner-ads/* --backup
# Quick shortcut for banner ad backups - targets 40KB
# Perfect for ad platform backup images
```

### Example 4: Size-based optimization for specific target

```bash
image-optimizer ~/Desktop/statics/* --size-kb 50
# Targets 50KB per file (actually 49KB with safety margin)
# Uses binary search to find optimal quality for each image
```

### Example 5: Process entire directory recursively

```bash
image-optimizer ~/Projects/website/images --recursive
# Processes all images in images/ and subdirectories using quality mode
```

### Example 6: Custom output location

```bash
image-optimizer ~/Desktop/statics/* -o ~/Desktop/production-ready
# Outputs to ~/Desktop/production-ready/ instead
```

## Output Example

### Quality Mode Output

```
Found 17 image(s) to optimize
Mode: Quality-based optimization (quality 70-80)

Optimizing images...

Optimization Results:

✓ banner-1.jpg
  156.2 KB → 32.1 KB (-79.45%) quality: 80

✓ hero-image.jpg
  1.2 MB → 58.7 KB (-95.11%) quality: 80

✓ logo.png
  89.3 KB → 38.2 KB (-57.22%) quality: 80

✓ thumbnail-small.jpg
  25.4 KB → 12.8 KB (-49.61%) quality: 80

Summary:
  Total images: 17
  Successful: 17
  Total savings: 2.5 MB

  Output directory: /Users/you/Desktop/statics/optimized
```

### Size Mode Output

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

## Choosing Between Modes

### Use Quality Mode (default) when:
- You want consistent, high-quality compression across all images
- File size limits aren't critical but you want good compression
- You're preparing images for general web use
- You want faster processing (single-pass optimization)

### Use Size Mode when:
- You have strict file size requirements (e.g., API limits, platform restrictions)
- Different images need different quality levels to meet the same size target
- You need to ensure all images stay under a specific threshold

## Why the Safety Margin?

When using size-targeting mode, the tool uses a 1KB safety margin by default (targets 39KB for 40KB limit) because:

- **Filesystem overhead**: File sizes on disk vs. actual file sizes can differ slightly
- **Edge case protection**: Ensures files that are close to the limit get processed and optimized
- **Consistent results**: Provides a small buffer for compression variations

You can adjust this with `--safety-margin` if needed (e.g., `--safety-margin 2048` for 2KB).

## Tips

- **Start with quality mode**: The default quality-based optimization (70-80) provides aggressive compression with good visual quality for most use cases
- **Banner ad backups**: Use `--backup` for quick 40KB optimization - perfect for ad platform backup images
- **Adjust quality for your needs**: Use `--min-quality` and `--max-quality` to dial in the perfect balance
- **For even smaller files**: Try `--min-quality 60 --max-quality 70` for maximum compression
- **For higher quality**: Try `--min-quality 85 --max-quality 95` when quality is more important than file size
- **Keep originals**: Default behavior creates `optimized` folder - originals stay safe
- **Test first**: Process a few images before doing large batches
- **Use recursive mode**: Process entire project directories at once with `--recursive`

## License

MIT
