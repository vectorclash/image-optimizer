#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs').promises;
const { glob } = require('glob');
const chalk = require('chalk');
const ora = require('ora');
const { batchOptimize, formatBytes } = require('./optimizer');

const program = new Command();

program
  .name('image-optimizer')
  .description('Batch optimize PNG and JPG images with quality-based or size-based optimization')
  .version('1.0.0');

program
  .argument('<input...>', 'Input file(s), pattern (e.g., "*.png"), or directory')
  .option('-o, --output <dir>', 'Output directory', './optimized')
  .option('-s, --size <bytes>', 'Target file size in bytes (optional, uses quality-based optimization if not set)')
  .option('-k, --size-kb <kb>', 'Target file size in kilobytes (overrides --size)')
  .option('--backup', 'Banner ad backup mode: targets 40KB with optimized settings')
  .option('--min-quality <number>', 'Minimum quality (1-100, default: 70 for quality mode, 10 for size mode)', '70')
  .option('--max-quality <number>', 'Maximum quality (1-100)', '80')
  .option('--safety-margin <bytes>', 'Safety margin in bytes to stay under target (only used with size targeting)', '1024')
  .option('--in-place', 'Optimize files in place (overwrites originals)')
  .option('--recursive', 'Process directories recursively')
  .action(async (inputs, options) => {
    try {
      // Calculate target size (null means quality-based optimization)
      let targetSize = null;
      if (options.backup) {
        // Banner ad backup mode: 40KB target
        targetSize = 40 * 1024;
      } else if (options.sizeKb) {
        targetSize = parseInt(options.sizeKb) * 1024;
      } else if (options.size) {
        targetSize = parseInt(options.size);
      }

      // Adjust minQuality default based on mode
      let minQuality = parseInt(options.minQuality);
      if (targetSize !== null && options.minQuality === '70') {
        // Size-targeting mode with default minQuality - use lower default
        minQuality = 10;
      }

      // Resolve input paths
      let inputPaths = [];

      // Process each input (can be multiple files, directories, or patterns)
      for (const input of inputs) {
        const inputResolved = path.resolve(input);

        // Check if input is a directory
        try {
          const stats = await fs.stat(inputResolved);
          if (stats.isDirectory()) {
            const pattern = options.recursive ? '**/*.{png,jpg,jpeg,PNG,JPG,JPEG}' : '*.{png,jpg,jpeg,PNG,JPG,JPEG}';
            const globPattern = path.join(inputResolved, pattern);
            const found = await glob(globPattern, { nodir: true });
            inputPaths.push(...found);
          } else {
            inputPaths.push(inputResolved);
          }
        } catch (error) {
          // Input might be a glob pattern
          const found = await glob(input, { nodir: true });
          inputPaths.push(...found);
        }
      }

      if (inputPaths.length === 0) {
        console.log(chalk.yellow('No images found matching the input pattern.'));
        process.exit(1);
      }

      // Filter for supported formats
      inputPaths = inputPaths.filter(p => {
        const ext = path.extname(p).toLowerCase();
        return ['.png', '.jpg', '.jpeg'].includes(ext);
      });

      if (inputPaths.length === 0) {
        console.log(chalk.yellow('No PNG or JPG images found.'));
        process.exit(1);
      }

      console.log(chalk.cyan(`Found ${inputPaths.length} image(s) to optimize`));
      if (options.backup) {
        console.log(chalk.cyan(`Mode: Banner ad backup (target: ${formatBytes(targetSize)})`));
      } else if (targetSize !== null) {
        console.log(chalk.cyan(`Target size: ${formatBytes(targetSize)} (${targetSize} bytes)`));
      } else {
        console.log(chalk.cyan(`Mode: Quality-based optimization (quality ${minQuality}-${parseInt(options.maxQuality)})`));
      }
      console.log('');

      // Determine output directory
      let outputDir;
      if (options.inPlace) {
        outputDir = null;
      } else if (options.output === './optimized') {
        // Default case: create 'optimized' folder in the same directory as the input files
        const firstInputDir = path.dirname(inputPaths[0]);
        outputDir = path.join(firstInputDir, 'optimized');
      } else {
        // User specified a custom output directory
        outputDir = path.resolve(options.output);
      }

      // Start optimization
      const spinner = ora('Optimizing images...').start();

      const results = await batchOptimize(
        inputPaths,
        outputDir || path.dirname(inputPaths[0]),
        targetSize,
        {
          minQuality: minQuality,
          maxQuality: parseInt(options.maxQuality),
          safetyMargin: parseInt(options.safetyMargin),
          inPlace: options.inPlace
        }
      );

      spinner.stop();

      // If in-place, move optimized files back
      if (options.inPlace) {
        for (const result of results) {
          if (result.success && !result.error) {
            await fs.rename(result.outputPath, result.inputPath);
            result.outputPath = result.inputPath;
          }
        }
      }

      // Display results
      console.log(chalk.bold('\nOptimization Results:\n'));

      let successCount = 0;
      let failCount = 0;
      let totalSavings = 0;

      for (const result of results) {
        if (result.error) {
          console.log(chalk.red(`✗ ${result.filename}: ${result.error}`));
          failCount++;
        } else {
          const statusIcon = result.underTarget ? chalk.green('✓') : chalk.yellow('⚠');
          const sizeInfo = `${formatBytes(result.originalSize)} → ${formatBytes(result.optimizedSize)}`;
          const savingsInfo = chalk.gray(`(-${result.savingsPercent}%)`);
          const qualityInfo = chalk.gray(`quality: ${result.quality}`);

          console.log(`${statusIcon} ${result.filename}`);
          console.log(`  ${sizeInfo} ${savingsInfo} ${qualityInfo}`);

          if (targetSize !== null && !result.underTarget) {
            console.log(chalk.yellow(`  Warning: Could not reach target size of ${formatBytes(targetSize)}`));
          }

          if (result.success) successCount++;
          totalSavings += result.savings;
        }
        console.log('');
      }

      // Summary
      console.log(chalk.bold('Summary:'));
      console.log(`  Total images: ${results.length}`);
      console.log(`  ${chalk.green(`Successful: ${successCount}`)}`);
      if (failCount > 0) {
        console.log(`  ${chalk.red(`Failed: ${failCount}`)}`);
      }
      console.log(`  Total savings: ${formatBytes(totalSavings)}`);

      if (!options.inPlace) {
        console.log(`\n  Output directory: ${chalk.cyan(outputDir)}`);
      }

    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
