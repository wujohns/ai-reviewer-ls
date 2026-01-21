const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
const async = require('async');

const njkEnv = new nunjucks.Environment(null, { autoescape: false })

/**
 * 解压 zip 文件到同目录并获取完整目录树结构
 * @param {string} zipFilePath - zip 文件的完整路径
 * @returns {Promise<Object>} 解压后的目录树结构
 */
async function unzipAndGetDirectoryTree(zipFilePath) {
  try {
    // 验证 zip 文件是否存在
    if (!fs.existsSync(zipFilePath)) {
      throw new Error(`Zip file not found: ${zipFilePath}`);
    }

    // 获取 zip 文件所在目录
    const zipDir = path.dirname(zipFilePath);
    
    // 获取 zip 文件名（不含扩展名）
    const zipFileName = path.parse(zipFilePath).name;
    
    // 获取解压后的目录路径（与 zip 文件同名）
    const extractedDir = path.join(zipDir, zipFileName);
    
    // 创建 AdmZip 实例
    const zip = new AdmZip(zipFilePath);
    
    // 解压所有文件到同目录
    zip.extractAllTo(zipDir, true);
    
    // 获取解压后的目录树结构
    const directoryTree = getDirectoryTree(extractedDir);
    
    // 将目录树转换为 README 友好的 Markdown 格式
    const markdownTree = convertDirectoryTreeToMarkdown(directoryTree);
    
    return { directoryTree, extractedDir, markdownTree };
  } catch (error) {
    console.error('Error unzipping file:', error);
    throw error;
  }
}

/**
 * 递归获取目录树结构
 * @param {string} dirPath - 目录路径
 * @returns {Object} 目录树结构
 */
function getDirectoryTree(dirPath) {
  // 保存初始的根路径
  const rootPath = dirPath;
  
  // 内部递归函数
  function buildTree(currentPath) {
    const stats = fs.statSync(currentPath);
    // 计算相对路径
    const relativePath = path.relative(rootPath, currentPath);
    
    const item = {
      path: relativePath || '.', // 如果是根目录本身，使用 '.'
      // name: path.basename(currentPath),
      // size: stats.size,
      // mtime: stats.mtime,
      type: 'directory',
      children: []
    };

    try {
      const files = fs.readdirSync(currentPath);
      
      for (const file of files) {
        const filePath = path.join(currentPath, file);
        const fileStats = fs.statSync(filePath);
        
        if (fileStats.isDirectory()) {
          // 递归处理子目录
          item.children.push(buildTree(filePath));
        } else {
          // 处理文件
          item.children.push({
            path: path.relative(rootPath, filePath),
            // name: file,
            // size: fileStats.size,
            // mtime: fileStats.mtime,
            type: 'file'
          });
        }
      }
    } catch (error) {
      console.error('Error reading directory:', error);
    }

    return item;
  }
  
  // 调用内部函数开始构建树
  return buildTree(dirPath);
}

/**
 * 将目录树结构转换为 README 友好的 Markdown 格式
 * @param {Object} tree - 目录树结构
 * @returns {string} Markdown 格式的目录树
 */
function convertDirectoryTreeToMarkdown(tree) {
  // 内部递归函数
  function buildMarkdown(item, indent = '', isLast = true) {
    // 获取完整的相对路径
    const fullPath = item.path === '.' ? '.' : item.path;
    
    // 确定项目前缀
    const prefix = item.type === 'directory' ? '📁 ' : '📄 ';
    
    // 确定连接线
    const connector = isLast ? '└── ' : '├── ';
    
    // 构建当前行，使用完整的相对路径
    let line = `${indent}${connector}${prefix}${fullPath}\n`;
    
    // 处理子项
    if (item.children && item.children.length > 0) {
      // 确定下一级的缩进
      const nextIndent = indent + (isLast ? '    ' : '│   ');
      
      // 遍历子项
      for (let i = 0; i < item.children.length; i++) {
        const child = item.children[i];
        const isLastChild = i === item.children.length - 1;
        line += buildMarkdown(child, nextIndent, isLastChild);
      }
    }
    
    return line;
  }
  
  // 调用内部函数开始构建 Markdown
  return '# 项目结构\n\n```\n' + buildMarkdown(tree).trim() + '\n```';
}

function render (tpl, data) {
  return njkEnv.renderString(tpl, data).trim()
}

async function parallelLimit (dataList, func, limit) {
  const funcList = dataList.map((item) => (callback) => {
    console.log('item------------', item)
    func(item)
      .then((res) => callback(null, res))
      .catch((err) => callback(err, null))
  })
  return await async.parallelLimit(funcList, limit)
}

/**
 * 读取文件内容并在每一行前添加行号
 * @param {string} filePath - 文件路径
 * @returns {string} 添加了行号的文件内容
 */
function readFileWithLineNumbers(filePath) {
  try {
    // 验证文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 按行分割内容
    const lines = content.split('\n');
    
    // 为每一行添加行号
    const linesWithNumbers = lines.map((line, index) => `${index + 1}:  ${line}`);
    
    // 合并行并返回
    return linesWithNumbers.join('\n');
  } catch (error) {
    console.error('Error reading file with line numbers:', error);
    throw error;
  }
}


module.exports = {
  unzipAndGetDirectoryTree,
  render,
  parallelLimit,
  readFileWithLineNumbers,
  convertDirectoryTreeToMarkdown
};