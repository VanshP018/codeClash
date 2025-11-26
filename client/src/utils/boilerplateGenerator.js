/**
 * Generate dynamic boilerplate code based on question structure and language
 * Extracts function signature from sample testcase
 */

export const generateBoilerplate = (question, language = 'python') => {
  if (!question || !question.sample_testcase) {
    return getDefaultBoilerplate(language);
  }

  const { input } = question.sample_testcase;
  
  if (language === 'python') {
    return generatePythonBoilerplate(input);
  } else if (language === 'cpp') {
    return generateCppBoilerplate(input);
  } else if (language === 'java') {
    return generateJavaBoilerplate(input);
  }
  
  return getDefaultBoilerplate(language);
};

// Python Boilerplate Generator
const generatePythonBoilerplate = (input) => {
  let functionSignature = 'def solution(';
  let functionBody = '';

  if (typeof input === 'object' && !Array.isArray(input)) {
    const params = Object.keys(input);
    functionSignature += params.join(', ') + '):\n';
    functionBody += `    # Write your code here\n`;
  } else if (Array.isArray(input)) {
    functionSignature += 'nums):\n';
    functionBody += `    # Write your code here\n`;
  } else if (typeof input === 'string') {
    functionSignature += 's):\n';
    functionBody += `    # Write your code here\n`;
  } else if (typeof input === 'number') {
    functionSignature += 'n):\n';
    functionBody += `    # Write your code here\n`;
  }

  return functionSignature + functionBody;
};

// C++ Boilerplate Generator
const generateCppBoilerplate = (input) => {
  let includes = '#include <iostream>\n#include <vector>\nusing namespace std;\n\n';
  let functionSignature = '';
  let functionBody = '    // Write your code here\n';

  if (typeof input === 'object' && !Array.isArray(input)) {
    const params = Object.keys(input);
    // For multiple parameters, assume first is int and second is vector
    if (params.length === 2) {
      functionSignature += `auto solution(int ${params[0]}, vector<int>& ${params[1]}) {\n`;
    } else {
      functionSignature += `auto solution(int ${params.join(', int ')}) {\n`;
    }
  } else if (Array.isArray(input)) {
    functionSignature += 'auto solution(vector<int>& nums) {\n';
  } else if (typeof input === 'string') {
    functionSignature += 'auto solution(string s) {\n';
  } else if (typeof input === 'number') {
    functionSignature += 'auto solution(int n) {\n';
  }

  return includes + functionSignature + functionBody + '}\n';
};

// Java Boilerplate Generator
const generateJavaBoilerplate = (input) => {
  let classStart = 'class Solution {\n';
  let functionSignature = '    public ';
  let functionBody = '        // Write your code here\n';

  if (typeof input === 'object' && !Array.isArray(input)) {
    const params = Object.keys(input);
    if (params.length === 2) {
      functionSignature += `Object solution(int ${params[0]}, int[] ${params[1]}) {\n`;
    } else {
      functionSignature += `Object solution(${params.map(p => `int ${p}`).join(', ')}) {\n`;
    }
  } else if (Array.isArray(input)) {
    functionSignature += 'Object solution(int[] nums) {\n';
  } else if (typeof input === 'string') {
    functionSignature += 'Object solution(String s) {\n';
  } else if (typeof input === 'number') {
    functionSignature += 'Object solution(int n) {\n';
  }

  return classStart + functionSignature + functionBody + '    }\n}\n';
};

const getDefaultBoilerplate = (language) => {
  if (language === 'python') {
    return `def solution():\n    # Write your code here\n`;
  } else if (language === 'cpp') {
    return `#include <iostream>\n#include <vector>\nusing namespace std;\n\nauto solution() {\n    // Write your code here\n}\n`;
  } else if (language === 'java') {
    return `class Solution {\n    public Object solution() {\n        // Write your code here\n    }\n}\n`;
  }
  return `def solution():\n    # Write your code here\n`;
};

// Generate test code separately for backend execution
export const generateTestCode = (question, language = 'python') => {
  if (!question || !question.sample_testcase) {
    return getDefaultTestCode(language);
  }

  const { input } = question.sample_testcase;

  if (language === 'python') {
    return generatePythonTestCode(input);
  } else if (language === 'cpp') {
    return generateCppTestCode(input);
  } else if (language === 'java') {
    return generateJavaTestCode(input);
  }

  return getDefaultTestCode(language);
};

const generatePythonTestCode = (input) => {
  let testCode = '\nif __name__ == "__main__":\n';

  if (typeof input === 'object' && !Array.isArray(input)) {
    const params = Object.keys(input);
    testCode += `    result = solution(${params.map(p => `${JSON.stringify(input[p])}`).join(', ')})\n`;
  } else if (Array.isArray(input)) {
    testCode += `    result = solution(${JSON.stringify(input)})\n`;
  } else if (typeof input === 'string') {
    testCode += `    result = solution("${input}")\n`;
  } else if (typeof input === 'number') {
    testCode += `    result = solution(${input})\n`;
  } else {
    testCode += `    result = solution()\n`;
  }
  
  testCode += `    print(result)`;
  return testCode;
};

const generateCppTestCode = (input) => {
  let testCode = '\nint main() {\n';

  if (typeof input === 'object' && !Array.isArray(input)) {
    const params = Object.keys(input);
    if (params.length === 2) {
      const firstVal = input[params[0]];
      const secondVal = input[params[1]];
      testCode += `    vector<int> ${params[1]} = {${Array.isArray(secondVal) ? secondVal.join(', ') : secondVal}};\n`;
      testCode += `    auto result = solution(${firstVal}, ${params[1]});\n`;
    }
  } else if (Array.isArray(input)) {
    testCode += `    vector<int> nums = {${input.join(', ')}};\n`;
    testCode += `    auto result = solution(nums);\n`;
  } else if (typeof input === 'string') {
    testCode += `    auto result = solution("${input}");\n`;
  } else if (typeof input === 'number') {
    testCode += `    auto result = solution(${input});\n`;
  }

  testCode += `    cout << result << endl;\n`;
  testCode += `    return 0;\n}\n`;
  return testCode;
};

const generateJavaTestCode = (input) => {
  let testCode = '\npublic class Main {\n';
  testCode += '    public static void main(String[] args) {\n';
  testCode += '        Solution solution = new Solution();\n';

  if (typeof input === 'object' && !Array.isArray(input)) {
    const params = Object.keys(input);
    if (params.length === 2) {
      const firstVal = input[params[0]];
      const secondVal = input[params[1]];
      if (Array.isArray(secondVal)) {
        testCode += `        int[] ${params[1]} = {${secondVal.join(', ')}};\n`;
        testCode += `        Object result = solution.solution(${firstVal}, ${params[1]});\n`;
      }
    }
  } else if (Array.isArray(input)) {
    testCode += `        int[] nums = {${input.join(', ')}};\n`;
    testCode += `        Object result = solution.solution(nums);\n`;
  } else if (typeof input === 'string') {
    testCode += `        Object result = solution.solution("${input}");\n`;
  } else if (typeof input === 'number') {
    testCode += `        Object result = solution.solution(${input});\n`;
  }

  testCode += `        System.out.println(result);\n`;
  testCode += `    }\n}\n`;
  return testCode;
};

const getDefaultTestCode = (language) => {
  if (language === 'python') {
    return '\nif __name__ == "__main__":\n    result = solution()\n    print(result)';
  } else if (language === 'cpp') {
    return '\nint main() {\n    auto result = solution();\n    cout << result << endl;\n    return 0;\n}\n';
  } else if (language === 'java') {
    return '\npublic class Main {\n    public static void main(String[] args) {\n        Solution solution = new Solution();\n        Object result = solution.solution();\n        System.out.println(result);\n    }\n}\n';
  }
  return '\nif __name__ == "__main__":\n    result = solution()\n    print(result)';
};
