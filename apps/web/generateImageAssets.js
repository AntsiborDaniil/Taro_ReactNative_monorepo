const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets/images');
const outputFile = path.join(__dirname, 'src/assets/imageAssets.ts');

const ensureDirectoryExists = (filePath) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }

  fs.mkdirSync(dirname, { recursive: true });
};

const scanDirectory = (dir, basePath = '') => {
  const result = {};
  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    const relativePath = basePath ? `${basePath}/${item}` : item;

    if (fs.statSync(fullPath).isDirectory()) {
      result[item] = scanDirectory(fullPath, relativePath);
    } else if (/\.(png|jpg|jpeg|gif|webp|webm|mp4)$/.test(item)) {
      result[item.replace(/\.\w+$/, '')] =
        `require('../../assets/images/${relativePath}')`;
    }
  });

  return result;
};

const generateTypeDefinition = (obj, level = 0) => {
  const indent = '  '.repeat(level);
  const lines = [];

  if (level === 0) {
    lines.push(`export type ImageStructure = {`);
  } else {
    lines.push(`{`);
  }

  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (typeof value === 'string' && value.startsWith('require(')) {
      // Если это уровень с изображениями, используем Record<string, string>
      lines.push(`${indent}  ${key}: any,`);
    } else {
      // Если это вложенный объект, рекурсивно генерируем тип
      lines.push(`${indent}  ${key}: {`);
      const subTypeLines = generateTypeDefinition(value, level + 1)
        .split('\n')
        .slice(1, -1); // Убираем внешние { и }
      subTypeLines.forEach((line) => lines.push(line));
      lines.push(`${indent}  },`);
    }
  });

  lines.push(`${indent}}`);
  return lines.join('\n');
};

const generateImageAssets = () => {
  const imageStructure = scanDirectory(assetsDir);
  const typeDefinition = generateTypeDefinition(imageStructure);

  const content = `// Auto-generated file\n${typeDefinition};\n\nconst imageAssets: ImageStructure = ${JSON.stringify(
    imageStructure,
    null,
    2
  )
    .replace(/"require\(/g, 'require(')
    .replace(/\)"/g, ')')};\n\nexport default imageAssets;\n`;

  ensureDirectoryExists(outputFile);
  fs.writeFileSync(outputFile, content, 'utf8');
  console.log('imageAssets.ts generated!');
};

generateImageAssets();
