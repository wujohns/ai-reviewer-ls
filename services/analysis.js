/**
 * 代码分析封装
 *
 * @author nobody
 * @date 26/01/21
 */
const {
  unzipAndGetDirectoryTree, render,
  parallelLimit, readFileWithLineNumbers
} = require('../utils');
const { PromptTplMap } = require('../consts');
const { chatWithTool } = require('./common');
const { z } = require('zod');
const { betaZodTool } = require('@anthropic-ai/sdk/helpers/beta/zod')

// 主 analysis json output schema
const analysisOutputSchema = z.object({
  feature_analysis: z.array(
    z.object({
      feature_description: z.string().describe('核心分析目标中的功能描述(使用中文描述)'),
      implementation_location: z.array(
        z.object({
          file_path: z.string().describe('文件路径'),
          function: z.string().describe('函数名称'),
          lines: z.string().describe('代码行数范围, 格式为 start-end')
        })
      ).describe('实现该功能的位置信息列表'),
    })
  ).describe('功能分析列表'),
  execution_plan_suggestion: z.string().describe('启动代码工程的操作建议，不用包含解说，直接描述最终结果')
}).toJSONSchema();

// 子 analysis json input schema
const subAnalysisInputSchema = z.object({
  focus_file_list: z.array(
    z.object({
      focus_feature: z.string().describe('关注的功能点描述'),
      code_path: z.string().describe('代码路径')
    }).describe('关注功能点相关文件信息')
  ),
})

// 子 analysis json output schema
const subAnalysisOutputSchema = z.object({
  feature_analysis: z.array(
    z.object({
      feature_description: z.string().describe('功能描述'),
      function: z.string().describe('函数名称'),
      lines: z.string().describe('代码行数范围, 格式为 start-end')
    })
  ).describe('功能分析列表'),
}).toJSONSchema();

/**
 * 主分析函数
 * @param {string} problem_description - 问题描述
 * @param {string} zip_file_path - 代码仓库压缩包路径
 * @returns {Promise<any>} - 分析结果
 */
async function analysisCode(problem_description, zip_file_path) {
  // 解压代码仓库压缩包并获取目录树结构
  const { markdownTree, extractedDir } = await unzipAndGetDirectoryTree(zip_file_path);

  // 渲染模板
  const template = PromptTplMap.analysis;
  const prompt = render(template, {
    problem_description,
    code_repo_structure: markdownTree
  });

  // 定义子分析工具
  const subCodeTool = betaZodTool({
    name: 'code_file_analysis',
    description: '分析关注功能点相关的代码',
    inputSchema: subAnalysisInputSchema,
    run: async (input) => {
      const { focus_file_list } = input
      console.log('------------工具调用', focus_file_list)

      // 并行处理每个关注功能点相关文件
      const results = await parallelLimit(focus_file_list, async (item) => {
        const { focus_feature, code_path } = item;
        return analysisSubCode(problem_description, focus_feature, extractedDir, code_path);
      }, 5);

      console.log('------------工具调用结果:', results)
      return results;
    }
  })

  // 调用 chatWithTool，包含工程文件分析处理
  const result = await chatWithTool(
    prompt,
    [subCodeTool],
    analysisOutputSchema
  );
  return result;
}

/**
 * 子分析函数
 * @param {string} problem_description - 问题描述
 * @param {string} focus_feature - 关注功能点
 * @param {string} code_root_dir - 代码根目录
 * @param {string} code_path - 代码路径(相对路径)
 * @returns {Promise<any>} - 分析结果
 */
async function analysisSubCode(
  problem_description, focus_feature,
  code_root_dir, code_path
) {
  const code_content = readFileWithLineNumbers(path.join(code_root_dir, code_path));

  const template = PromptTplMap.analysisSub;
  const prompt = render(template, {
    problem_description,
    focus_feature,
    code_repo_structure,
    code_path,
    code_content
  });

  // 2. 定义输出格式 schema
  const schema = z.object({
    feature_analysis: subAnalysisOutputSchema,
    key_components: z.array(z.string()).describe('关键实现点列表'),
    explanation: z.string().describe('分析说明')
  });

  // 3. 调用 chatWithTool，tool 部分留空
  const result = await chatWithTool(prompt, [], schema.toJSONSchema());
  return result[0].text
}

module.exports = {
  analysisCode
};