const axios = require('axios');

/**
 * Group robot notifications for WeCom / Feishu.
 * Webhook URLs must come from environment variables — never hardcode secrets.
 *
 * Supported env:
 *   WECOM_WEBHOOK_URL
 *   FEISHU_WEBHOOK_URL
 *   NOTIFY_WEBHOOK_URLS  (comma-separated; type inferred from URL)
 */

const TIMEOUT_MS = 5000;

function splitUrls(value) {
  if (!value || typeof value !== 'string') return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

function detectProvider(url) {
  const u = url.toLowerCase();
  if (u.includes('qyapi.weixin.qq.com') || u.includes('weixin.qq.com')) return 'wecom';
  if (u.includes('feishu.cn') || u.includes('larksuite.com') || u.includes('open.feishu')) return 'feishu';
  return 'unknown';
}

function collectTargets() {
  const targets = [];
  for (const url of splitUrls(process.env.WECOM_WEBHOOK_URL)) {
    targets.push({ url, provider: 'wecom' });
  }
  for (const url of splitUrls(process.env.FEISHU_WEBHOOK_URL)) {
    targets.push({ url, provider: 'feishu' });
  }
  for (const url of splitUrls(process.env.NOTIFY_WEBHOOK_URLS)) {
    targets.push({ url, provider: detectProvider(url) });
  }
  // de-dupe by URL
  const seen = new Set();
  return targets.filter((t) => {
    if (seen.has(t.url)) return false;
    seen.add(t.url);
    return true;
  });
}

function buildPayload(provider, text) {
  if (provider === 'feishu') {
    return { msg_type: 'text', content: { text } };
  }
  // WeCom default (also used for unknown providers that accept WeCom-style body)
  return { msgtype: 'text', text: { content: text } };
}

async function postWebhook(target, text) {
  const payload = buildPayload(target.provider, text);
  try {
    const res = await axios.post(target.url, payload, {
      timeout: TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true,
    });
    if (res.status >= 400) {
      console.error(`[notify] ${target.provider} HTTP ${res.status}`);
      return false;
    }
    // WeCom returns {errcode, errmsg}; Feishu returns {code, msg}
    const body = res.data || {};
    if (typeof body.errcode === 'number' && body.errcode !== 0) {
      console.error(`[notify] wecom errcode=${body.errcode}`);
      return false;
    }
    if (typeof body.code === 'number' && body.code !== 0) {
      console.error(`[notify] feishu code=${body.code}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[notify] ${target.provider} failed:`, err.message);
    return false;
  }
}

/**
 * Fire-and-forget text notification. Never throws; never logs webhook URLs.
 */
function notifyText(text) {
  const message = String(text || '').trim();
  if (!message) return Promise.resolve([]);

  const targets = collectTargets();
  if (targets.length === 0) return Promise.resolve([]);

  return Promise.all(targets.map((t) => postWebhook(t, message)));
}

function safe(value, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

/**
 * KYC lifecycle notifications. Avoid including form field values / PII payloads.
 */
function notifyKycEvent({ event, submissionId, schemeName, username, status, reason }) {
  const lines = [
    '【信任中心】',
    `事件: ${safe(event)}`,
    `提交ID: ${safe(submissionId)}`,
    `方案: ${safe(schemeName)}`,
    `用户: ${safe(username)}`,
  ];
  if (status) lines.push(`状态: ${safe(status)}`);
  if (reason) lines.push(`备注: ${safe(reason).slice(0, 200)}`);
  lines.push(`时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  return notifyText(lines.join('\n'));
}

module.exports = {
  notifyText,
  notifyKycEvent,
  collectTargets,
};
