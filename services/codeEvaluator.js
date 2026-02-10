/**
 * Code Evaluation Service
 * Evaluates submitted code against test cases
 */

/**
 * Evaluate code submission
 * @param {string} code - The submitted code
 * @param {string} language - Programming language
 * @param {Array} testCases - Test cases to run
 * @returns {Object} Evaluation result
 */
exports.evaluateCode = async (code, language, testCases) => {
  try {
    let passedTests = 0;
    const results = [];

    for (const testCase of testCases) {
      try {
        const output = await runCode(code, language, testCase.input);
        const passed = normalizeOutput(output) === normalizeOutput(testCase.expectedOutput);
        
        if (passed) passedTests++;

        results.push({
          input: testCase.isHidden ? 'Hidden' : testCase.input,
          expectedOutput: testCase.isHidden ? 'Hidden' : testCase.expectedOutput,
          actualOutput: testCase.isHidden ? 'Hidden' : output,
          passed
        });
      } catch (error) {
        results.push({
          input: testCase.isHidden ? 'Hidden' : testCase.input,
          expectedOutput: testCase.isHidden ? 'Hidden' : testCase.expectedOutput,
          actualOutput: 'Error: ' + error.message,
          passed: false
        });
      }
    }

    const allPassed = passedTests === testCases.length;
    const score = (passedTests / testCases.length) * 10; // Assuming 10 points per coding question

    return {
      allPassed,
      passedTests,
      totalTests: testCases.length,
      score: Math.round(score),
      results
    };
  } catch (error) {
    console.error('Code evaluation error:', error);
    throw error;
  }
};

/**
 * Run code in specified language
 * This is a simplified version. In production, use Docker containers or sandboxed environments
 */
const runCode = async (code, language, input) => {
  // WARNING: This is a simplified implementation for demonstration
  // In production, you should use:
  // 1. Docker containers for isolation
  // 2. Resource limits (CPU, memory, time)
  // 3. Sandboxed execution environment
  // 4. Services like Judge0, Sphere Engine, or custom Docker setup

  return new Promise((resolve, reject) => {
    const { VM } = require('vm2');
    
    try {
      if (language === 'javascript') {
        const vm = new VM({
          timeout: 5000, // 5 seconds timeout
          sandbox: {}
        });

        // Prepare code with input
        const wrappedCode = `
          const input = ${JSON.stringify(input)};
          const lines = input.split('\\n');
          let lineIndex = 0;
          
          // Mock console.log to capture output
          let output = '';
          const originalLog = console.log;
          console.log = (...args) => {
            output += args.join(' ') + '\\n';
          };
          
          // Mock readline or input functions
          const readline = () => {
            return lines[lineIndex++] || '';
          };
          
          try {
            ${code}
            output = output.trim();
          } catch (e) {
            throw e;
          }
          
          output;
        `;

        const result = vm.run(wrappedCode);
        resolve(result || '');
      } else {
        // For other languages, you would need to:
        // 1. Write code to file
        // 2. Compile (if needed)
        // 3. Execute with input
        // 4. Capture output
        // This requires proper sandboxing and is beyond this simplified example
        reject(new Error(`Language ${language} not supported in this simplified version`));
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Normalize output for comparison
 */
const normalizeOutput = (output) => {
  return output.toString().trim().replace(/\r\n/g, '\n');
};

/**
 * Install vm2 package for safe code execution
 * Note: In production, use Docker or dedicated code execution services
 */
