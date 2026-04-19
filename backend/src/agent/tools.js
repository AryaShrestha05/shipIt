const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ===== Tool descriptions (the "menu" we give Gemini) =====
const toolDeclarations = [
  {
    name: 'read_file',
    description: 'Reads the contents of a file from the repository.',
    parameters: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Path relative to repo root' },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'write_file',
    description: 'Overwrites a file with new content. Use this to make code changes.',
    parameters: {
      type: 'object',
      properties: {
        file_path: { type: 'string' },
        content: { type: 'string', description: 'Full new contents of the file' },
      },
      required: ['file_path', 'content'],
    },
  },
  {
    name: 'run_command',
    description: 'Runs a shell command in the repo and returns its output.',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to run, e.g. "node app.js"' },
      },
      required: ['command'],
    },
  },
];

// ===== Factory: builds a dispatcher bound to a specific folder =====
// We use a factory so the same tools can work on different repos (the sandbox
// for testing, or a cloned GitHub repo later). The "hands" always know which
// folder they're operating in.
function createToolRunner(rootPath) {
  function readFile(args) {
    return fs.readFileSync(path.join(rootPath, args.file_path), 'utf8');
  }

  function writeFile(args) {
    const fullPath = path.join(rootPath, args.file_path);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, args.content, 'utf8');
    return `Wrote ${args.file_path} (${args.content.length} chars)`;
  }

  function runCommand(args) {
    try {
      const output = execSync(args.command, {
        cwd: rootPath,
        timeout: 15000,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return `SUCCESS:\n${output || '(no output)'}`;
    } catch (err) {
      return `FAILED (exit ${err.status}):\nSTDOUT: ${err.stdout || ''}\nSTDERR: ${err.stderr || ''}`;
    }
  }

  return function runTool(call) {
    if (call.name === 'read_file') return readFile(call.args);
    if (call.name === 'write_file') return writeFile(call.args);
    if (call.name === 'run_command') return runCommand(call.args);
    throw new Error(`Unknown tool: ${call.name}`);
  };
}

module.exports = { toolDeclarations, createToolRunner };
