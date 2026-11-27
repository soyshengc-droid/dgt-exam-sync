#!/usr/bin/env node
/*
 * 给朋友开一个"专属题库记录空间"：
 *   1. 在 owner 账号下创建私有仓库 dgt-data-<code>
 *   2. 初始化空的 sync.json
 *   3. 打印分享链接 + token 创建步骤 + 发给朋友的话术
 *
 * 用法：
 *   node tools/new_friend.js --months=3
 *   node tools/new_friend.js --months=3 --code=abc12345
 *   node tools/new_friend.js --months=3 --dry-run
 *
 * 重要：记录跟着仓库走，token 只是钥匙。
 * 续期时给同一个仓库重新生成 token 即可，题库记录不会丢。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const args = {};
process.argv.slice(2).forEach(a => {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  if (m) args[m[1]] = m[2] === undefined ? true : m[2];
});

const OWNER = args.owner || 'soyshengc-droid';
const PAGE = 'https://' + OWNER + '.github.io/dgt-exam-sync/';
const MONTHS = parseInt(args.months || '3', 10);
if (!(MONTHS >= 1 && MONTHS <= 12)) throw new Error('--months 请在 1-12 之间');

function pad(n) { return (n < 10 ? '0' : '') + n; }
function monthsLater(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
function randomCode(n) {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'; // 去掉容易看错的 0/o/1/l/i
  return Array.from({ length: n }, () => alphabet[crypto.randomInt(alphabet.length)]).join('');
}

const code = String(args.code || randomCode(8)).toLowerCase();
if (!/^[a-z0-9]{2,32}$/.test(code)) throw new Error('code 只能是小写字母和数字，2-32 位');
const repo = 'dgt-data-' + code;
const expires = monthsLater(MONTHS);
const dry = !!args['dry-run'];
const link = PAGE;

function gh(...argv) {
  return execFileSync('gh', argv, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

if (!dry) {
  // 1) 私有仓库（已存在则继续）
  try {
    gh('repo', 'view', OWNER + '/' + repo, '--json', 'name');
    console.log('· 仓库已存在，直接复用：' + OWNER + '/' + repo);
  } catch (e) {
    gh('repo', 'create', OWNER + '/' + repo, '--private',
      '--description', 'DGT sync data for license ' + code);
    console.log('· 已创建私有仓库：' + OWNER + '/' + repo);
  }
  // 2) 初始化空的 sync.json（也可以让 App 首次同步时自动创建）
  const empty = { h: {}, w: {}, d: {}, s: {} };
  const content = Buffer.from(JSON.stringify(empty), 'utf8').toString('base64');
  gh('api', '-X', 'PUT', 'repos/' + OWNER + '/' + repo + '/contents/sync.json',
    '-f', 'message=init sync.json', '-f', 'content=' + content);
  console.log('· 已写入空的 sync.json');
} else {
  console.log('· [dry-run] 将创建私有仓库：' + OWNER + '/' + repo);
}

console.log('\n================ 发给朋友 ================');
console.log('公共链接（谁都能打开，但没有 token 进不去）：');
console.log('  ' + link);
console.log('');
console.log('有效期：' + expires + '（' + MONTHS + ' 个月，由 token 的到期日控制）');
console.log('朋友专属数据仓库：' + OWNER + '/' + repo + '（私有，只有这个 token 能读写）');
console.log('');
console.log('请你在 GitHub 上给他生成一个 Fine-grained token：');
console.log('  GitHub → Settings → Developer settings → Personal access tokens');
console.log('  → Fine-grained tokens → Generate new token');
console.log('    · Resource owner：' + OWNER);
console.log('    · Repository access：Only select repositories → ' + repo);
console.log('    · Permissions：Contents = Read and write');
console.log('    · Expiration：Custom → ' + expires);
console.log('  生成后把 token（github_pat_ 开头）发给朋友。');
console.log('');
console.log('================ 发给朋友的话术 ================');
console.log('题库链接：' + link);
console.log('你的访问 token：<把刚生成的 github_pat_... 粘在这里>');
console.log('有效期到 ' + expires + '。打开链接后在首页粘贴 token 才能进入；进入后点 ☁️ Sync 即可同步。');
console.log('到期后找我续期，做题记录不会丢。');
console.log('================================================');
console.log('');
console.log('续期方法（记录不丢）：');
console.log('  1. 给同一个仓库 ' + OWNER + '/' + repo + ' 重新生成一个 Fine-grained token（新到期日）；');
console.log('  2. 把新 token 发给朋友（链接不变），他在进入页粘贴新 token；');
console.log('  3. 数据一直在仓库里，换 token 不影响。');
console.log('如果要彻底停用：不续期即可（token 到期后 GitHub 直接拒绝，进不去也同步不了）；也可以删除该仓库。');
console.log('');
console.log('注意：访问控制靠 token 到期（GitHub 服务端校验）；题库文件本身在公开的 GitHub Pages 上，懂技术的人仍可直接下载文件，无法 100% 阻止。');
