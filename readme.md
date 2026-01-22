# README

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
