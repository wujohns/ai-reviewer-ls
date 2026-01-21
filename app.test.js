const request = require('supertest');
const app = require('./app');
const fs = require('fs');
const path = require('path');

describe('File Upload API', () => {
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

  test('上传zip文件和problem_description应该成功', async () => {
    const problemDescription = '这是一个测试项目，需要实现文件上传功能';
    
    const res = await request(app)
      .post('/upload')
      .field('problem_description', problemDescription)
      .attach('code_zip', path.join(__dirname, 'package.json'));
    
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('File uploaded successfully');
    expect(res.body.file).toHaveProperty('name', 'package.json');
    expect(res.body.file).toHaveProperty('path');
    expect(res.body.file).toHaveProperty('size');
    expect(res.body.file).toHaveProperty('mimetype');
    expect(res.body.problem_description).toBe(problemDescription);
    
    // 验证文件是否实际保存
    expect(fs.existsSync(res.body.file.path)).toBe(true);
  });

  test('没有文件上传应该返回400', async () => {
    const res = await request(app)
      .post('/upload')
      .field('problem_description', '这是一个测试项目');
    
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('No zip file uploaded');
  });
});