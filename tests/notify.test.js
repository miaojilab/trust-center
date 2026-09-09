const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const { buildKycPayload } = require('../utils/notification-payload');
const { notifyKycEvent, notifyText } = require('../utils/notify');
const originalPost = axios.post;
const originalError = console.error;
const names = ['WECOM_WEBHOOK_URL', 'FEISHU_WEBHOOK_URL', 'NOTIFY_WEBHOOK_URLS', 'WECOM_NOTIFY_FORMAT', 'FEISHU_NOTIFY_FORMAT', 'NOTIFY_PUBLIC_BASE_URL'];
const originalEnv = Object.fromEntries(names.map(n => [n, process.env[n]]));
afterEach(() => { axios.post = originalPost; console.error = originalError; for (const n of names) { if (originalEnv[n] === undefined) delete process.env[n]; else process.env[n] = originalEnv[n]; } });
const event = { event: '新认证提交', submissionId: 123, schemeName: '核心成员报名', username: '测试用户', status: 'pending' };
const now = new Date('2026-09-09T00:00:00Z');

// These tests never contact the configured webhooks.
test('both providers render all lifecycle states with protected review links and Chinese status', () => {
  delete process.env.WECOM_NOTIFY_FORMAT; delete process.env.FEISHU_NOTIFY_FORMAT;
  for (const [status,label,title] of [['pending','待审核','新认证提交'],['pending','待审核','认证重新提交'],['approved','已通过','认证已通过'],['rejected','未通过','认证已拒绝']]) {
    for (const provider of ['wecom','feishu']) {
      const p = buildKycPayload(provider, {...event,event:title,status,data:{secret:'do-not-include'},email:'hidden@example.org'},now);
      const s = JSON.stringify(p);
      assert(s.includes(label)); assert(s.includes('/admin/review/123')); assert(s.includes('8:00:00') || s.includes('08:00:00'));
      assert(!s.includes('do-not-include')); assert(!s.includes('hidden@example.org'));
      if (provider === 'wecom') { assert.equal(p.msgtype, 'template_card'); assert.equal(p.template_card.card_action.type, 1); }
      else assert.equal(p.msg_type, 'interactive');
    }
  }
});
test('WeCom Markdown escapes user-controlled formatting and mentions', () => {
  process.env.WECOM_NOTIFY_FORMAT='markdown';
  const p=buildKycPayload('wecom',{...event,username:'<@all> [点我](https://evil.example)',reason:'**伪造标题**\n>内容'},now);
  assert.equal(p.msgtype,'markdown'); assert(!p.markdown.content.includes('<@all>')); assert(!p.markdown.content.includes('[点我](https://evil.example)'));
  assert(Buffer.byteLength(p.markdown.content)<4096);
});
test('text override remains available and Feishu uses plain text for user fields', () => {
  process.env.WECOM_NOTIFY_FORMAT='text'; process.env.FEISHU_NOTIFY_FORMAT='text';
  assert.equal(buildKycPayload('wecom',event,now).msgtype,'text');
  assert.equal(buildKycPayload('feishu',event,now).msg_type,'text');
  delete process.env.FEISHU_NOTIFY_FORMAT;
  const p=buildKycPayload('feishu',{...event,username:'<at id=all></at>'},now);
  assert.equal(p.card.elements[0].fields[1].text.tag,'plain_text');
});
test('safe public URL fallback and bounded values', () => {
  process.env.NOTIFY_PUBLIC_BASE_URL='javascript:alert(1)';
  delete process.env.WECOM_NOTIFY_FORMAT;
  const p=buildKycPayload('wecom',{...event,schemeName:'长'.repeat(5000),reason:'长'.repeat(5000)},now);
  assert(p.template_card.card_action.url.startsWith('https://trust.emoera.com/'));
  assert(Buffer.byteLength(JSON.stringify(p))<4096);
});
test('configured targets are deduplicated; generic text calls remain text', async () => {
  process.env.WECOM_WEBHOOK_URL='https://qyapi.weixin.qq.com/test-placeholder';
  process.env.FEISHU_WEBHOOK_URL='https://open.feishu.cn/test-placeholder';
  process.env.NOTIFY_WEBHOOK_URLS=process.env.WECOM_WEBHOOK_URL;
  delete process.env.WECOM_NOTIFY_FORMAT; delete process.env.FEISHU_NOTIFY_FORMAT;
  const sent=[];axios.post=async(url,payload)=>{sent.push(payload);return {status:200,data:{errcode:0,code:0}}};
  assert.deepEqual(await notifyKycEvent(event),[true,true]); assert.equal(sent.length,2);
  assert.equal(sent[0].msgtype,'template_card'); assert.equal(sent[1].msg_type,'interactive');
  sent.length=0; await notifyText('普通通知'); assert.equal(sent[0].msgtype,'text'); assert.equal(sent[1].msg_type,'text');
});
test('timeouts and provider rejection do not throw or leak webhook URLs; no automatic retry', async () => {
  process.env.WECOM_WEBHOOK_URL='https://qyapi.weixin.qq.com/private-key-placeholder';
  delete process.env.FEISHU_WEBHOOK_URL; delete process.env.NOTIFY_WEBHOOK_URLS;
  let calls=0;const logs=[];console.error=(...args)=>logs.push(args.join(' '));
  axios.post=async()=>{calls++;throw Object.assign(new Error(process.env.WECOM_WEBHOOK_URL),{code:'ETIMEDOUT'})};
  assert.deepEqual(await notifyKycEvent(event),[false]); assert.equal(calls,1); assert(!logs.join(' ').includes('private-key-placeholder'));
  axios.post=async()=>({status:200,data:{errcode:40058}});
  assert.deepEqual(await notifyKycEvent(event),[false]);
});
