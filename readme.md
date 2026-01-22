# README

## 工程结构
- **app.js**：基于Express框架的Web服务器，提供文件上传接口和健康检查接口
- **services/analysis.js**：核心代码分析逻辑，使用Anthropic API进行AI代码分析
- **utils.js**：包含文件处理、模板渲染、异步控制等工具函数
- **consts.js**：定义系统常量和提示模板映射
- **prompt/**：存放AI分析用的Nunjucks模板，用于生成高质量的分析请求

## 技术栈
- Node.js + Express：Web服务框架
- Multer：文件上传中间件
- Adm-Zip：ZIP文件处理
- Nunjucks：模板引擎
- Anthropic API：AI代码分析
- Zod：数据验证

## 准备
在工程中添加 .env 文件，内容如下：
```
ANTHROPIC_API_BASE_URL=xxx
ANTHROPIC_API_KEY=xxx
```

备注: 如果用的是 Anthropic 官方原生的 API，则不用单独设定 ANTHROPIC_API_BASE_URL

## 启动
docker build -t ai-reviewer-ls .
docker run -p 6200:3000 ai-reviewer-ls

## 测试验证
curl -X POST http://localhost:6200/upload \
  -F "problem_description=$(cat example/examination.md)" \
  -F "code_zip=@example/nestjs-channel-messenger-demo-main.zip"

## 其他说明
- 目前先只处理了基础分析任务  
- 运行测试部分先做简要沟通后再确认推进处理
