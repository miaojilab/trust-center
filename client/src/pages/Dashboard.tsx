import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Chip, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { kycAPI } from '../services/api';
import { KYCScheme, KYCSubmission } from '../types';
import MainLayout from '../components/layout/MainLayout';

const statusLabels = { approved: '已通过', pending: '待审核', rejected: '需重新提交' };
const statusColors = { approved: 'success', pending: 'warning', rejected: 'error' } as const;

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [schemes, setSchemes] = useState<KYCScheme[]>([]);
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false);
    kycAPI.getInitialData().then(response => {
      if (!response.success || !response.data) throw new Error('Unable to load certification data');
      if (!active) return;
      setSchemes(response.data.schemes);
      const ordered = response.data.userStatus.map(sub => ({...sub, schemeId: sub.KYCScheme?.id || sub.schemeId}))
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      setSubmissions(ordered.filter((sub, index) => ordered.findIndex(item => item.schemeId === sub.schemeId) === index));
    }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  return <MainLayout>
    <div className="workspace-welcome"><div><span className="portal-kicker">MY TRUST</span><h1>你好，{user?.username || '朋友'}。</h1><p>认证进度、审核反馈和下一步，在这里一目了然。</p></div><img src="/models/trust-floating-core.png" alt=""/></div>
    {loading ? <div role="status" style={{padding:60,textAlign:'center'}}><CircularProgress/><p>正在加载你的认证记录…</p></div> : error ? <Alert severity="error" action={<Button onClick={() => setRetry(n => n + 1)}>重试</Button>}>暂时无法获取认证记录，请稍后重试。</Alert> : <>
      <div className="workspace-stats">{(['approved', 'pending', 'rejected'] as const).map(status => <Link key={status} to="/status" className="workspace-stat"><span>{statusLabels[status]}</span><strong>{submissions.filter(item => item.status === status).length}</strong></Link>)}</div>
      <div className="workspace-intro">Trust 为你记录认证结果。E时代 ID 会在相关申请中查询这些状态，作为核验依据。<a href="https://neweid.emoera.com/"> 访问 E时代 ID ↗</a></div>
      <div className="portal-section-heading"><div><span className="portal-kicker">YOUR CERTIFICATIONS</span><h2>我的认证</h2></div><Link className="portal-text-link" to="/status">查看申请记录 →</Link></div>
      {schemes.length === 0 ? <div className="workspace-record"><h3>暂时没有可用的认证方案</h3><p>新的认证方案开放后会出现在这里。已有申请可以在申请记录中查看。</p><Link className="portal-text-link" to="/status">查看申请记录 →</Link></div> : <div className="workspace-records">{schemes.map(scheme => {
        const submission = submissions.find(item => item.schemeId === scheme.id);
        const status = submission?.status;
        const needsAction = !status || status === 'rejected';
        const updatedAt = submission && new Date(submission.updatedAt || submission.createdAt);
        return <article className="workspace-record" key={scheme.id}>
          <div className="workspace-record-heading"><h3>{scheme.name}</h3><Chip size="small" variant="outlined" color={status ? statusColors[status] : 'default'} label={status ? statusLabels[status] : '尚未申请'}/></div>
          {scheme.description && <p>{scheme.description}</p>}
          <p>{status === 'approved' ? '认证已通过。你可以查看结果，或前往相关服务继续办理。' : status === 'pending' ? '材料已提交，请等待审核。在申请记录中可以查看当前进度。' : status === 'rejected' ? submission?.rejectReason || '请查看审核反馈，完善材料后重新提交。' : '先了解认证要求，再按方案准备和提交材料。'}</p>
          {updatedAt && !Number.isNaN(updatedAt.getTime()) && <time dateTime={updatedAt.toISOString()}>最近更新 · {updatedAt.toLocaleDateString('zh-CN')}</time>}
          <div className="workspace-record-actions"><Link to={needsAction ? `/submit/${scheme.id}` : `/submission/${submission!.id}`}>{!status ? '开始认证' : status === 'rejected' ? '重新提交' : '查看申请'} →</Link><Link to={`/schemes/${scheme.id}`}>方案详情</Link></div>
        </article>;
      })}</div>}
    </>}
  </MainLayout>;
}
