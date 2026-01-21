const request = require('supertest');
const app = require('./app');
const fs = require('fs');
const path = require('path');

describe('File Upload API', () => {
  // 读取example目录中的问题描述
  const problemDescription = fs.readFileSync(
    path.join(__dirname, 'example', 'examination.md'), 
    'utf8'
  );

  // 测试前清理上传目录
  // beforeEach(() => {
  //   const uploadDir = path.join(__dirname, 'file_upload');
  //   if (fs.existsSync(uploadDir)) {
  //     const files = fs.readdirSync(uploadDir);
  //     for (const file of files) {
  //       fs.unlinkSync(path.join(uploadDir, file));
  //     }
  //   }
  // });

  test('健康检查接口应该返回200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('使用example数据测试完整的上传和分析流程', async () => {
    const res = await request(app)
      .post('/upload')
      .field('problem_description', problemDescription)
      .attach('code_zip', path.join(__dirname, 'example', 'nestjs-channel-messenger-demo-main.zip'));
    
    expect(res.statusCode).toBe(200);
    
    // 验证分析结果的基本结构
    expect(res.body).toHaveProperty('feature_analysis');
    expect(res.body).toHaveProperty('execution_plan_suggestion');
    expect(Array.isArray(res.body.feature_analysis)).toBe(true);
  }, 120000); // 设置120秒超时，因为分析可能需要较长时间

  test('没有文件上传应该返回400', async () => {
    const res = await request(app)
      .post('/upload')
      .field('problem_description', '这是一个测试项目');
    
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('No zip file uploaded');
  });
});