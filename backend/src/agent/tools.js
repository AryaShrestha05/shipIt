const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

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
    name: 'edit_file',
    description: 'Replaces one exact piece of text in a file. old_text must appear exactly once. Prefer this over write_file for small changes.',
    parameters: {
      type: 'object',
      properties: {
        file_path: { type: 'string' },
        old_text: { type: 'string', description: 'The exact text to find (copy it from read_file)' },
        new_text: { type: 'string', description: 'What to put in its place' },
      },
      required: ['file_path', 'old_text', 'new_text'],
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
  const root = path.resolve(rootPath);

  // Turns a model-supplied path into an absolute one, refusing anything that
  // escapes the workspace (e.g. "../../etc/passwd").
  function resolveInside(filePath) {
    const fullPath = path.resolve(root, filePath);
    if (fullPath !== root && !fullPath.startsWith(root + path.sep)) {
      throw new Error(`Path is outside the workspace: ${filePath}`);
    }
    return fullPath;
  }

  function readFile(args) {
    return fs.readFileSync(resolveInside(args.file_path), 'utf8');
  }

  function writeFile(args) {
    const fullPath = resolveInside(args.file_path);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, args.content, 'utf8');
    return `Wrote ${args.file_path} (${args.content.length} chars)`;
  }

  // Small, safe edits: the AI copies the exact text it wants to change, so it
  // never has to re-type (and possibly cut short) a whole long file.
  function editFile(args) {
    const fullPath = resolveInside(args.file_path);
    const content = fs.readFileSync(fullPath, 'utf8');
    const count = content.split(args.old_text).length - 1;
    if (!args.old_text || count === 0) throw new Error('old_text not found in ' + args.file_path);
    if (count > 1) throw new Error('old_text appears ' + count + ' times in ' + args.file_path + '; include more surrounding text');
    fs.writeFileSync(fullPath, content.replace(args.old_text, function () { return args.new_text; }), 'utf8');
    return 'Edited ' + args.file_path;
  }

  function runCommand(args) {
    try {
      const output = childProcess.execSync(args.command, {
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

  // Failures come back as text so the model can read them and try again,
  // instead of crashing the whole run.
  return function (call) {
    try {
      if (call.name === 'read_file') return readFile(call.args);
      if (call.name === 'write_file') return writeFile(call.args);
      if (call.name === 'edit_file') return editFile(call.args);
      if (call.name === 'run_command') return runCommand(call.args);
      throw new Error(`Unknown tool: ${call.name}`);
    } catch (err) {
      return `ERROR: ${err.message}`;
    }
  };
}

module.exports = {
  toolDeclarations: toolDeclarations,
  createToolRunner: createToolRunner,
};
