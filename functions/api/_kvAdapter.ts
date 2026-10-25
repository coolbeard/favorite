// 跨平台 KV 适配层
// 支持 EdgeOne Pages (全局变量) / Cloudflare Workers (env 绑定)
declare global {
  const CLOUDNAV_KV: KVNamespace;
}

/**
 * 获取 KV 实例，自动检测运行平台
 * @param {object} env - 函数 context.env
 * @returns {object} KV 实例
 */
interface Env {
  CLOUDNAV_KV?: KVNamespace;
  PASSWORD?: string;
  ALLOWED_ORIGIN?: string;
}

export function getKV(env: Env): KVNamespace {
  if (env?.CLOUDNAV_KV) return env.CLOUDNAV_KV;
  if (typeof CLOUDNAV_KV !== "undefined") return CLOUDNAV_KV;
  throw new Error('KV binding "CLOUDNAV_KV" not found.');
}

/**
 * 获取 CORS 头，支持配置化
 * @param {object} env - 函数 context.env
 * @returns {object} CORS headers
 */
export function getCorsHeaders(env: Env): Record<string, string> {
  const origin = env?.ALLOWED_ORIGIN || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-auth-password',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * 认证检查：验证密码或 Token
 * @param {object} params
 * @param {string} params.providedPassword - 客户端提供的密码或 Token
 * @param {string} params.serverPassword - 环境变量中的密码
 * @param {object} params.kv - KV 实例
 * @returns {Promise<boolean>}
 */
export async function verifyAuth({
  providedPassword,
  serverPassword,
  kv,
}: {
  providedPassword: string;
  serverPassword?: string;
  kv: KVNamespace;
}): Promise<boolean> {
  if (!providedPassword) return false;
  if (serverPassword && providedPassword === serverPassword) return true;
  if (providedPassword.length !== 64 || !/^[0-9a-f]{64}$/i.test(providedPassword))
    return false;
  try {
    return (await kv.get(`auth_token:${providedPassword}`)) === "valid";
  } catch {
    return false;
  }
}

/**
 * 创建标准 JSON 响应
 * @param {any} data - 响应数据
 * @param {number} status - HTTP 状态码
 * @param {object} extraHeaders - 额外响应头
 * @returns {Response}
 */
export function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}
