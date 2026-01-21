const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analysisCode } = require('./services/analysis');

const app = express();
const PORT = process.env.PORT || 3000;

// 创建上传目录
const uploadDir = path.join(__dirname, 'file_upload');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 健康检查接口
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// 文件上传接口
app.post('/upload', upload.single('code_zip'), async (req, res) => {
  // 输出problem_description到控制台
  if (req.body.problem_description) {
    console.log('Problem Description:', req.body.problem_description);
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No zip file uploaded' });
  }
  
  try {
    // 调用分析代码的方法
    const analysisResult = await analysisCode(req.body.problem_description, req.file.path);
    
    res.status(200).json(analysisResult);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'An error occurred during code analysis',
      details: error.message 
    });
  }
});

// 启动服务器
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;