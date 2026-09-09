import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PortalHeader from '../components/brand/PortalHeader';
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import HubOutlined from '@mui/icons-material/HubOutlined';

export default function Home() {
  const { isAuthenticated } = useAuth();
  return <div className="portal"><PortalHeader/><main className="portal-home">
    <section className="portal-hero">
      <div className="portal-hero-copy"><span className="portal-kicker">E ERA · TRUST CENTER</span><h1>身份有凭据，<br/><em>信任有依据。</em></h1><p>从提交材料到审核完成，让每一步认证都清晰可见。通过 Trust 完成认证，让 E时代 ID 在相关服务中核验你的认证状态。</p><div className="portal-hero-actions"><Link className="portal-button" to={isAuthenticated ? '/dashboard' : '/login'}>{isAuthenticated ? '查看我的认证' : '开启我的认证'} <span aria-hidden="true">→</span></Link><a className="portal-text-link" href="#how-it-works">了解认证流程 ↘</a></div><div className="portal-assurance"><VerifiedUserOutlined fontSize="small"/>统一登录 · 认证审核 · 状态查询</div></div>
      <div className="portal-core"><div className="portal-core-ring"/><img src="/models/trust-floating-core.png" width="560" height="560" alt="E时代分层金属 E 安全核心" fetchPriority="high"/><span className="portal-core-caption"><i/> E ERA / TRUST CORE</span></div>
    </section>
    <section id="how-it-works" className="portal-section"><div className="portal-section-heading"><div><span className="portal-kicker">YOUR NEXT STEP</span><h2>你的认证，从这里开始。</h2></div><p>无需了解复杂规则，跟随所选方案完成申请。</p></div><div className="portal-step-grid">
      <article className="portal-step"><AssignmentOutlined/><span className="portal-step-index">01</span><h3>选择方案，提交材料</h3><p>查看认证要求，按方案填写信息并上传所需材料。</p></article>
      <article className="portal-step"><VerifiedUserOutlined/><span className="portal-step-index">02</span><h3>跟进审核，查看结果</h3><p>在工作台查看待审核、已通过或未通过状态；需要时根据反馈重新提交。</p></article>
      <article className="portal-step"><HubOutlined/><span className="portal-step-index">03</span><h3>关联身份，核验状态</h3><p>E时代 ID 会在相关申请中向 Trust 查询认证状态，作为后续核验依据。</p></article>
    </div></section>
    <section id="connected" className="portal-connected"><div><span className="portal-kicker">CONNECTED BY TRUST</span><h2>一次认证，<br/>连接身份与服务。</h2><p>Trust 管理认证方案和审核结果，E时代 ID 在需要时查询结果。你可以随时回到个人工作台，了解申请当前走到了哪一步。</p><a className="portal-text-link" href="https://neweid.emoera.com/">访问 E时代 ID ↗</a></div><div className="portal-flow"><div><span>01 / IDENTITY</span><h3>E时代 ID</h3><p>身份与社团服务</p></div><b aria-hidden="true">⇄</b><div className="portal-flow-core"><span>02 / VERIFICATION</span><h3>Trust</h3><p>认证方案与审核状态</p></div></div></section>
    <footer className="portal-footer"><span>E时代 · 科技创新，连接未来</span><Link to={isAuthenticated ? '/dashboard' : '/login'}>进入我的工作台 →</Link></footer>
  </main></div>;
}
