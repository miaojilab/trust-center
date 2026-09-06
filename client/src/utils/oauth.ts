// OAuth/OIDC配置（E时代通行证，授权码模式 + PKCE S256）
const oauthConfig = {
  clientId: process.env.REACT_APP_OAUTH_CLIENT_ID || 'trust-center',
  redirectUri: process.env.REACT_APP_OAUTH_REDIRECT_URI || 'http://localhost:3001/oauth/callback',
  authorizationEndpoint: process.env.REACT_APP_OAUTH_AUTHORIZATION_ENDPOINT || 'https://account.emoera.com/api/oauth2/authorize',
  scope: 'openid profile email'
};

// base64url 编码
const base64UrlEncode = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * 生成 PKCE code_verifier / code_challenge（S256）
 */
export const generatePkceChallenge = async (): Promise<{ verifier: string; challenge: string }> => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = base64UrlEncode(array);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: base64UrlEncode(digest) };
};

/**
 * 生成OAuth授权URL（authorization code flow + PKCE）
 * @param state 状态值，用于防止CSRF攻击
 * @param codeChallenge PKCE S256 的 code_challenge
 * @returns 授权URL
 */
export const getAuthorizationUrl = (state: string, codeChallenge?: string): string => {
  const params = new URLSearchParams({
    client_id: oauthConfig.clientId,
    response_type: 'code',
    redirect_uri: oauthConfig.redirectUri,
    scope: oauthConfig.scope,
    state: state,
    nonce: Math.random().toString(36).substring(2, 18)
  });

  if (codeChallenge) {
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
  }

  return `${oauthConfig.authorizationEndpoint}?${params.toString()}`;
};

/**
 * 从URL query中提取授权码
 * @returns 授权码信息
 */
export const extractAuthCodeFromQuery = (): {
  code: string;
  state: string;
  error?: string;
  errorDescription?: string;
} => {
  const params = new URLSearchParams(window.location.search);

  if (params.has('error')) {
    return {
      code: '',
      state: params.get('state') || '',
      error: params.get('error') || 'unknown_error',
      errorDescription: params.get('error_description') || ''
    };
  }

  return {
    code: params.get('code') || '',
    state: params.get('state') || ''
  };
};

/**
 * 验证状态值
 * @param state 回调中的状态值
 * @returns 是否验证通过
 */
export const validateState = (state: string): boolean => {
  const savedState = localStorage.getItem('oauth_state');

  // 验证完成后清除状态
  localStorage.removeItem('oauth_state');

  return savedState === state;
};
