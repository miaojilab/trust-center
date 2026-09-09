/** Build group-robot payloads without credentials or network access. */
const STATUS = { pending: '待审核', approved: '已通过', rejected: '未通过' };
function short(value, limit = 80) {
  const s = String(value ?? '-').replace(/[\r\n\t]+/g, ' ').trim() || '-';
  return Array.from(s).length > limit ? Array.from(s).slice(0, limit - 1).join('') + '…' : s;
}
function markdown(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\`*_{}\[\]()#!|]/g, '\\$&');
}
function publicOrigin() {
  try {
    const u = new URL(process.env.NOTIFY_PUBLIC_BASE_URL || 'https://trust.emoera.com');
    if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password) throw new Error('Invalid origin');
    return u.origin;
  } catch { return 'https://trust.emoera.com'; }
}
function buildKycPayload(provider, event, now = new Date()) {
  const title = short(event.event || '认证状态更新', 26);
  const status = STATUS[event.status] || short(event.status || '状态更新', 20);
  const fields = [
    ['认证方案', short(event.schemeName)],
    ['申请人', short(event.username)],
    ['申请编号', short(event.submissionId, 64)],
    ['当前状态', status]
  ];
  const timestamp = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
  const origin = publicOrigin();
  const id = event.submissionId;
  // Use the existing admin route, with the same login and admin permission checks.
  const url = `${origin}/admin${id !== undefined && id !== null && id !== '' ? `/review/${encodeURIComponent(String(id))}` : '/pending'}`;
  const action = event.status === 'pending' ? '前往审核' : '查看记录';
  const note = event.reason ? `审核备注：${short(event.reason, 160)}` : '';
  const text = ['【E时代信任中心】', title, ...fields.map(([k,v]) => `${k}：${v}`), note, `时间：${timestamp}（北京时间）`, `${action}：${url}`].filter(Boolean).join('\n');
  if ((provider === 'wecom' && process.env.WECOM_NOTIFY_FORMAT === 'text') || provider === 'unknown') {
    return { msgtype: 'text', text: { content: text } };
  }
  if (provider === 'wecom' && process.env.WECOM_NOTIFY_FORMAT === 'markdown') {
    return { msgtype: 'markdown', markdown: { content: [
      `### E时代信任中心 · ${markdown(title)}`,
      ...fields.map(([k,v]) => `> **${k}**：${markdown(v)}`),
      note ? `> ${markdown(note)}` : '',
      `> 时间：${timestamp}（北京时间）`,
      `[${action}](${url})`
    ].filter(Boolean).join('\n') } };
  }
  if (provider === 'wecom') {
    return { msgtype: 'template_card', template_card: {
      card_type: 'text_notice',
      source: { icon_url: `${origin}/e-era-logo.png`, desc: 'E时代信任中心', desc_color: 1 },
      main_title: { title, desc: status },
      sub_title_text: [note, `时间：${timestamp}（北京时间）`].filter(Boolean).join('\n'),
      horizontal_content_list: fields.map(([keyname, value]) => ({ keyname, value: short(value, 26) })),
      jump_list: [{ type: 1, title: action, url }],
      card_action: { type: 1, url }
    } };
  }
  if (provider === 'feishu') {
    if (process.env.FEISHU_NOTIFY_FORMAT === 'text') return { msg_type: 'text', content: { text } };
    return { msg_type: 'interactive', card: {
      config: { wide_screen_mode: true },
      header: { template: event.status === 'approved' ? 'green' : event.status === 'rejected' ? 'red' : 'blue', title: { tag: 'plain_text', content: `E时代信任中心 · ${title}` } },
      elements: [
        { tag: 'div', fields: fields.map(([k,v]) => ({ is_short: true, text: { tag: 'plain_text', content: `${k}\n${v}` } })) },
        ...(note ? [{ tag: 'div', text: { tag: 'plain_text', content: note } }] : []),
        { tag: 'note', elements: [{ tag: 'plain_text', content: `时间：${timestamp}（北京时间）` }] },
        { tag: 'action', actions: [{ tag: 'button', text: { tag: 'plain_text', content: action }, type: 'primary', url }] }
      ]
    } };
  }
  return { msgtype: 'text', text: { content: text } };
}
module.exports = { buildKycPayload };
