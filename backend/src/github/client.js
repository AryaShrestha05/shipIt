const octokitRest = require('@octokit/rest');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const os = require('os');

function createOctokit(token) {
  return new octokitRest.Octokit({ auth: token });
}

async function cloneRepo(repoUrl, token) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shipit-'));
  const authenticatedUrl = repoUrl.replace('https://', `https://x-access-token:${token}@`);
  const git = simpleGit();
  await git.clone(authenticatedUrl, tmpDir, ['--depth', '1']);
  return tmpDir;
}

async function getRepoInfo(repoUrl) {
  const match = repoUrl.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/)?$/);
  if (!match) throw new Error('Invalid GitHub repo URL');
  return { owner: match[1], repo: match[2] };
}

// options: token, owner, repo, branchName, title, body, baseBranch (default 'main')
async function createPR(options) {
  const octokit = createOctokit(options.token);
  const response = await octokit.pulls.create({
    owner: options.owner,
    repo: options.repo,
    title: options.title,
    body: options.body,
    head: options.branchName,
    base: options.baseBranch || 'main',
  });
  return response.data.html_url;
}

// options: repoPath, branchName, token, owner, repo, commitMessage
async function pushBranch(options) {
  const git = simpleGit(options.repoPath);
  await git.checkoutLocalBranch(options.branchName);
  await git.add('.');
  await git.commit(options.commitMessage);
  const remote = `https://x-access-token:${options.token}@github.com/${options.owner}/${options.repo}.git`;
  await git.push(remote, options.branchName);
}

module.exports = {
  cloneRepo: cloneRepo,
  getRepoInfo: getRepoInfo,
  createPR: createPR,
  pushBranch: pushBranch,
};
