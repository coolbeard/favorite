// functions/api/handleIconProxy.ts
import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  CLOUDNAV_KV?: KVNamespace;
  ALLOWED_ORIGIN?: string;
  USE_DEFAULT_IMGAPI?: string;
  DEFAULT_IMGAPI?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing URL', { status: 400 });
  }

  const cacheKey = new Request(url.toString(), request);
  const cache = caches.default;

  let response = await cache.match(cacheKey);

  if (response) {
    response = new Response(response.body, response);
    response.headers.set('X-Icon-Cache-Status', 'HIT');
  } else {
    let upstreamResponse: Response | null = null;

    if (env.USE_DEFAULT_IMGAPI) {
      const upstreamApi = `${env.DEFAULT_IMGAPI}${encodeURIComponent(targetUrl)}`;
      upstreamResponse = await fetch(upstreamApi, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      });
    } else {
      upstreamResponse = await fetchBestIcon(targetUrl);
    }

    if (upstreamResponse) {
      response = new Response(upstreamResponse.body, upstreamResponse);
      response.headers.set('Cache-Control', 'public, max-age=604800, s-maxage=604800');
      response.headers.set('X-Icon-Cache-Status', 'MISS');
      context.waitUntil(cache.put(cacheKey, response.clone()));
    } else {
      const defaultSVG = `<svg t="1792956179337" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5678" width="30" height="30"><path d="M852.6 367.6c16.3-36.9 32.1-90.7 32.1-131.8 0-109.1-119.5-147.6-314.5-57.9-161.4-10.8-316.8 110.5-355.6 279.7 46.3-52.3 117.4-123.4 183-151.7C316.1 378.3 246.7 470 194 565.6c-31.1 56.9-66 148.8-66 217.5 0 147.9 139.3 129.8 270.4 63 47.1 23.1 99.8 23.4 152.5 23.4 145.7 0 276.4-81.4 325.2-219H694.9c-78.8 132.9-295.2 79.5-295.2-71.2h493.2c9.6-65.4-2.5-143.6-40.3-211.7zM224.8 648.3c26.6 76.7 80.6 143.8 150.4 185-133.1 73.4-259.9 43.6-150.4-185z m174-163.3c3-82.7 75.4-142.3 156-142.3 80.1 0 153 59.6 156 142.3h-312z m276.8-281.4c32.1-15.4 72.8-33 108.8-33 47.1 0 81.4 32.6 81.4 80.6 0 30-11.1 73.5-21.9 101.8-39.3-63.5-98.9-122.4-168.3-149.4z" fill="#1296DB" p-id="5679"></path></svg>`;
      response = new Response(defaultSVG, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
      response.headers.set('X-Icon-Cache-Status', 'DEFAULT');
      // 兜底响应也写入缓存，避免每次请求都重新抓取目标站
      context.waitUntil(cache.put(cacheKey, response.clone()));
    }
    // 统一设置 CORS，避免重复
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  return response;
}

/**
 * 从目标网站 HTML 中解析最佳图标地址
 * 使用 Cloudflare Workers 的 HTMLRewriter 流式解析
 */
async function fetchBestIcon(targetUrl: string): Promise<Response | null> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(targetUrl, {
      headers,
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('Site unreachable');

    let iconUrl: string | null = null;

    const rewriter = new HTMLRewriter()
      .on('link[rel="apple-touch-icon"]', {
        element(e) {
          if (!iconUrl) {
            const href = e.getAttribute('href');
            if (href) iconUrl = href;
          }
        },
      })
      .on('link[rel~="icon"]', {
        element(e) {
          if (!iconUrl) {
            const href = e.getAttribute('href');
            if (href) iconUrl = href;
          }
        },
      });

    await rewriter.transform(response).text();

    let finalUrl: string;
    if (iconUrl) {
      finalUrl = new URL(iconUrl, targetUrl).toString();
    } else {
      finalUrl = new URL('/favicon.ico', targetUrl).toString();
    }

    const iconResponse = await fetch(finalUrl, { headers });

    if (iconResponse.ok && iconResponse.headers.get('content-type')?.includes('image')) {
      return iconResponse;
    }

    throw new Error('Icon fetch failed');
  } catch (e) {
    console.error('fetchBestIcon error:', e);
    return null;
  }
}