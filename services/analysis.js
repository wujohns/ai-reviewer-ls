/**
 * 代码分析封装
 *
 * @author nobody
 * @date 26/01/21
 */
const path = require('path');
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
      feature_description: z.string().describe('完成核心目标需要关注的功能描述(使用中文描述)'),
      implementation_location: z.array(
        z.object({
          file_path: z.string().describe('文件路径'),
          function: z.string().describe('函数名称'),
          lines: z.string().describe('代码行数范围, 格式为 start-end')
        })
      ).describe('完成核心目标的功能位置信息列表'),
    })
  ).describe('功能分析列表'),
  execution_plan_suggestion: z.string().describe('完成核心目标的操作建议')
}).toJSONSchema();

// 子 analysis json input schema
const subAnalysisInputSchema = z.object({
  focus_file_list: z.array(
    z.object({
      focus_feature: z.string().describe('关注的功能点描述'),
      code_path: z.string().describe('对应的代码文件路径, 必须是项目结构中的文件路径')
    }).describe('关注功能点相关文件信息')
  ),
})

// 子 analysis json output schema
const subAnalysisOutputSchema = z.object({
  feature_analysis: z.array(
    z.object({
      feature_description: z.string().describe('功能描述，必须是和核心目标相关的功能描述或是关注的功能点中的功能描述'),
      function: z.string().describe('函数名称，必须是代码文件中的具体的函数名称'),
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

  console.log('prompt:', prompt)

  // 定义子分析工具
  const subCodeTool = betaZodTool({
    name: 'code_file_analysis',
    description: '分析关注功能点相关的代码',
    inputSchema: subAnalysisInputSchema,
    run: async (input) => {
      const { focus_file_list } = input

      // 并行处理每个关注功能点相关文件
      const func = async (item) => {
        try {
          const { focus_feature, code_path } = item;
          const result = await analysisSubCode(
            {
              code_repo_structure: markdownTree,
              problem_description,
              focus_feature,
              code_root_dir: extractedDir,
              code_path
            }
          );

          console.log('subCodeTool result:', result)

          return {
            code_path,
            feature_analysis: result.feature_analysis
          }
        } catch (err) {
          console.log(err)
          return null
        }
      }

      const results = await parallelLimit(focus_file_list, func, 5);
      const validResults = results.filter(item => !!item);

      return JSON.stringify(validResults)
    }
  })

  // 调用 chatWithTool，包含工程文件分析处理
  const result = await chatWithTool(
    prompt,
    [subCodeTool],
    analysisOutputSchema
  );
  return JSON.parse(result[0].text);
}

/**
 * 子分析函数
 * @param {string} options - 子分析参数
 * @param {Object} options.code_repo_structure - 代码仓库目录树结构
 * @param {string} options.problem_description - 问题描述
 * @param {string} options.focus_feature - 关注功能点
 * @param {string} options.code_root_dir - 代码根目录
 * @param {string} options.code_path - 代码路径(相对路径)
 * @returns {Promise<any>} - 分析结果
 */
async function analysisSubCode(options) {
  const { code_repo_structure, problem_description, focus_feature, code_root_dir, code_path } = options
  const code_content = readFileWithLineNumbers(path.join(code_root_dir, code_path));

  const template = PromptTplMap.analysisSub;
  const prompt = render(template, {
    problem_description,
    focus_feature,
    code_repo_structure,
    code_path,
    code_content
  });

  // 3. 调用 chatWithTool，tool 部分留空
  const result = await chatWithTool(prompt, [], subAnalysisOutputSchema);
  return JSON.parse(result[0].text)
}

module.exports = {
  analysisCode
};