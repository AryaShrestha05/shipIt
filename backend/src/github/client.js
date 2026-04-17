const { Octokit } = require('@octokit/rest');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const os = require('os');

function createOctokit(token) {
  return new Octokit({ auth: token });
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

async function createPR({ token, owner, repo, branchName, title, body, baseBranch = 'main' }) {
  const octokit = createOctokit(token);
  const { data } = await octokit.pulls.create({
    owner,
    repo,
    title,
    body,
    head: branchName,
    base: baseBranch,
  });
  return data.html_url;
}

async function pushBranch({ repoPath, branchName, token, owner, repo, commitMessage }) {
  const git = simpleGit(repoPath);
  await git.checkoutLocalBranch(branchName);
  await git.add('.');
  await git.commit(commitMessage);
  const remote = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
  await git.push(remote, branchName);
}

module.exports = { cloneRepo, getRepoInfo, createPR, pushBranch };
