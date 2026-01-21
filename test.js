const path = require('path');
const fs = require('fs');
const { analysisCode } = require('./services/analysis');

/**
 * 测试分析代码功能
 */
async function testAnalysisCode() {
  try {
    // 1. 读取问题描述
    const problemDescriptionPath = path.join(__dirname, 'example', 'examination.md');
    const problemDescription = fs.readFileSync(problemDescriptionPath, 'utf8');
    
    // 2. 定义代码仓库压缩包路径
    const zipFilePath = path.join(__dirname, 'example', 'nestjs-channel-messenger-demo-main.zip');
    
    console.log('开始分析代码...');
    console.log('问题描述:', problemDescription.substring(0, 100) + '...');
    console.log('代码仓库路径:', zipFilePath);
    
    // 3. 调用分析函数
    const result = await analysisCode(problemDescription, zipFilePath);
    
    // 4. 输出结果
    console.log('\n分析结果:');
    console.log(JSON.stringify(JSON.parse(result[0].text), null, 2));
    
  } catch (error) {
    console.error('分析过程中出错:', error);
  }
}

// 执行测试
testAnalysisCode();