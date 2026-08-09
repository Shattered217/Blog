/// <reference types="@cloudflare/workers-types" />

interface Env {
	R2_ACCESS_KEY_ID?: string;
	REQUIRE_ACCESS?: string;
}

const CMS_VERSION = "0.181.1";
const CMS_SCRIPT_INTEGRITY =
	"sha384-56C5raxd/5XdH4pb8zeqvfejo4JFZEVSmBt5/IqeNDxSrjUve6rHPOl3fz1LXHWf";
const ACCOUNT_ID = "58c21b8aebc2e669f4f20138ee567341";
const EDITOR_HOST = "editor.nvcc-v.com";

const commonHeaders = {
	"Cache-Control": "private, no-store",
	"Referrer-Policy": "no-referrer",
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"X-Robots-Tag": "noindex, nofollow, noarchive",
};

const contentSecurityPolicy = [
	"default-src 'none'",
	"base-uri 'self'",
	"connect-src 'self' blob: data: https://unpkg.com https://api.github.com https://www.githubstatus.com https://58c21b8aebc2e669f4f20138ee567341.r2.cloudflarestorage.com",
	"font-src 'self' https://cdn.jsdelivr.net",
	"form-action 'self' https://github.com",
	"frame-ancestors 'none'",
	"frame-src blob:",
	"img-src 'self' blob: data: https://nvcc-v.com https://*.githubusercontent.com",
	"manifest-src blob:",
	"media-src blob:",
	"script-src 'self' https://unpkg.com",
	"style-src 'self' 'unsafe-inline'",
	"worker-src blob:",
].join("; ");

function textResponse(
	body: string,
	contentType: string,
	init: ResponseInit = {},
): Response {
	const headers = new Headers(init.headers);
	for (const [name, value] of Object.entries(commonHeaders)) {
		headers.set(name, value);
	}
	headers.set("Content-Type", contentType);
	return new Response(body, { ...init, headers });
}

function htmlResponse(body: string, status = 200): Response {
	const response = textResponse(body, "text/html; charset=utf-8", { status });
	response.headers.set("Content-Security-Policy", contentSecurityPolicy);
	return response;
}

function isLocalRequest(url: URL): boolean {
	return url.hostname === "localhost" || url.hostname === "127.0.0.1";
}

function hasAccessIdentity(request: Request): boolean {
	return Boolean(request.headers.get("Cf-Access-Jwt-Assertion"));
}

async function proxyMedia(request: Request, url: URL): Promise<Response> {
	const target = new URL(`${url.pathname}${url.search}`, "https://nvcc-v.com");
	const requestHeaders = new Headers();
	for (const name of ["If-Modified-Since", "If-None-Match", "Range"]) {
		const value = request.headers.get(name);
		if (value) requestHeaders.set(name, value);
	}

	const upstream = await fetch(target, {
		method: request.method,
		headers: requestHeaders,
		redirect: "manual",
	});
	const headers = new Headers(upstream.headers);
	headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
	headers.set("Cross-Origin-Resource-Policy", "same-site");
	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers,
	});
}

function accessRequiredPage(): Response {
	return htmlResponse(
		`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>需要 Cloudflare Access</title>
  <style>
    :root { color-scheme: light dark; font-family: ui-sans-serif, sans-serif; }
    body { min-height: 100vh; margin: 0; display: grid; place-items: center; background: #f6f5f2; color: #25242b; }
    main { width: min(34rem, calc(100% - 3rem)); padding: 2rem; border: 1px solid #dedce8; border-radius: 1.25rem; background: #fff; box-shadow: 0 1rem 3rem #34305b14; }
    h1 { margin-top: 0; color: #65619c; }
    p { line-height: 1.7; }
    code { background: #efedf7; padding: .15rem .4rem; border-radius: .35rem; }
    @media (prefers-color-scheme: dark) { body { background: #19191e; color: #eceaf3; } main { background: #222228; border-color: #3c3948; } code { background: #33313d; } }
  </style>
</head>
<body><main><h1>编辑器尚未通过 Access</h1><p>该 Worker 只接受经过 Cloudflare Access 的请求。请先为 <code>${EDITOR_HOST}</code> 创建 Access Self-hosted 应用。</p></main></body>
</html>`,
		403,
	);
}

function setupRequiredPage(): Response {
	return htmlResponse(
		`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>编辑器配置未完成</title>
  <style>
    :root { color-scheme: light dark; font-family: ui-sans-serif, sans-serif; }
    body { min-height: 100vh; margin: 0; display: grid; place-items: center; background: #f6f5f2; color: #25242b; }
    main { width: min(34rem, calc(100% - 3rem)); padding: 2rem; border: 1px solid #dedce8; border-radius: 1.25rem; background: #fff; box-shadow: 0 1rem 3rem #34305b14; }
    h1 { margin-top: 0; color: #65619c; }
    p { line-height: 1.7; }
    @media (prefers-color-scheme: dark) { body { background: #19191e; color: #eceaf3; } main { background: #222228; border-color: #3c3948; } }
  </style>
</head>
<body><main><h1>还差 R2 凭据</h1><p>Access 已生效，但 Worker 尚未配置限定到 <strong>nvcc-v-media</strong> 的 R2 Access Key ID。完成后编辑器才会启动。</p></main></body>
</html>`,
		503,
	);
}

function editorHtml(): string {
	return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <meta name="theme-color" content="#aeade3">
  <link rel="icon" href="https://nvcc-v.com/favicon/favicon-32.png" sizes="32x32">
  <title>NVCC Blog Studio</title>
</head>
<body>
  <script src="/manual-init.js"></script>
  <script src="https://unpkg.com/@sveltia/cms@${CMS_VERSION}/dist/sveltia-cms.js" integrity="${CMS_SCRIPT_INTEGRITY}" crossorigin="anonymous"></script>
  <script src="/editor-hooks.js"></script>
</body>
</html>`;
}

function configYaml(accessKeyId: string): string {
	return `# yaml-language-server: $schema=https://unpkg.com/@sveltia/cms/schema/sveltia-cms.json
backend:
  name: github
  repo: Shattered217/Blog
  branch: migration/fuwari
  auth_methods: [token]
  commit_messages:
    create: "content: publish {{collection}} {{slug}}"
    update: "content: update {{collection}} {{slug}}"
    delete: "content: delete {{collection}} {{slug}}"

site_url: https://nvcc-v.com
display_url: https://nvcc-v.com
app_title: NVCC Blog Studio
logo:
  src: https://nvcc-v.com/favicon/favicon-512.png
  show_in_header: true

publish_mode: simple
slug:
  encoding: ascii
  clean_accents: true
  sanitize_replacement: "-"
  trim: true
  lowercase: true
  timezone: local
output:
  omit_empty_optional_fields: true
  yaml:
    quote: double
    indent_size: 2
    indent_sequences: false

media_libraries:
  all:
    max_file_size: 20971520
    slugify_filename: true
    transformations:
      jpeg: { format: webp, quality: 85, width: 2560, height: 2560 }
      png: { format: webp, quality: 85, width: 2560, height: 2560 }
  cloudflare_r2:
    access_key_id: "${accessKeyId}"
    bucket: nvcc-v-media
    account_id: ${ACCOUNT_ID}
    public_url: https://nvcc-v.com
    prefix: wp-content/uploads/editor/

collections:
  - name: posts
    label: 新文章
    label_singular: 文章
    description: 新文章默认保存为草稿。确认标题、英文 Slug、摘要和封面后再关闭草稿开关。
    folder: src/content/posts
    create: true
    delete: true
    extension: md
    format: yaml-frontmatter
    identifier_field: title
    slug: "{{fields.slug}}"
    path: "{{fields.slug}}"
    summary: "{{title}} · {{published}}"
    preview_path: "/{{year}}/{{month}}/{{day}}/{{fields.slug}}/"
    preview_path_date_field: published
    sortable_fields: [published, updated, title]
    fields:
      - { label: 标题, name: title, widget: string, minlength: 2, maxlength: 100 }
      - label: 英文 Slug
        name: slug
        widget: string
        hint: 只使用小写字母、数字和连字符；发布后不要修改，以免文章 URL 变化。
        pattern: ["^[a-z0-9]+(?:-[a-z0-9]+)*$", "请输入类似 jetson-r2-upload-guide 的英文 Slug"]
      - { label: 发布日期, name: published, widget: datetime, type: date, format: "YYYY-MM-DD", default: "{{now}}", input_timezone: Asia/Shanghai }
      - { label: 更新日期, name: updated, widget: datetime, type: date, format: "YYYY-MM-DD", input_timezone: Asia/Shanghai, required: false }
      - { label: 草稿, name: draft, widget: boolean, default: true, required: false, hint: 开启时不会出现在生产站点；关闭并保存后才正式发布。 }
      - { label: SEO 摘要, name: description, widget: text, minlength: 50, maxlength: 160, hint: 建议 80 到 140 个中文字符，准确概括文章内容。 }
      - { label: 封面图, name: image, widget: image, required: false, hint: 上传到 R2；建议 16:9 WebP，文件名保持唯一。 }
      - label: 标签
        name: tags
        widget: select
        multiple: true
        min: 1
        max: 2
        options: [AI, Jetson, CUDA, TensorRT, Docker, 网络, OpenWrt, NAS, 媒体服务, 安全, 系统运维, 开发工具, MCU, 智能家居]
      - label: 分类
        name: category
        widget: select
        options: [Linux, Jetson, Windows, Android, CTF, MCU]
      - label: 系列
        name: series
        widget: object
        required: false
        collapsed: true
        fields:
          - { label: 系列 Slug, name: slug, widget: string, pattern: ["^[a-z0-9]+(?:-[a-z0-9]+)*$", "只允许小写字母、数字和连字符"] }
          - { label: 系列名称, name: name, widget: string }
          - { label: 顺序, name: order, widget: number, value_type: int, min: 1 }
      - { name: lang, widget: hidden, default: zh_CN }
      - { name: tagPermalinks, widget: hidden, default: [] }
      - { name: categoryPermalink, widget: hidden, default: "" }
      - { name: permalink, widget: hidden, default: "" }
      - { label: 正文, name: body, widget: markdown, sanitize_preview: true }

  - name: imported_posts
    label: 已迁移文章
    label_singular: 已迁移文章
    description: 编辑从 WordPress 迁移的历史文章。永久链接会保持不变。
    folder: src/content/posts/imported
    create: false
    delete: false
    extension: md
    format: yaml-frontmatter
    identifier_field: title
    summary: "{{title}} · {{published}}"
    preview_path: "/{{year}}/{{month}}/{{day}}/{{filename}}/"
    preview_path_date_field: published
    sortable_fields: [published, updated, title]
    fields:
      - { label: 标题, name: title, widget: string, minlength: 2, maxlength: 100 }
      - { label: 发布日期, name: published, widget: datetime, type: date, format: "YYYY-MM-DD", input_timezone: Asia/Shanghai }
      - { label: 更新日期, name: updated, widget: datetime, type: date, format: "YYYY-MM-DD", input_timezone: Asia/Shanghai, required: false }
      - { label: 草稿, name: draft, widget: boolean, default: false, required: false }
      - { label: SEO 摘要, name: description, widget: text, minlength: 20, maxlength: 180 }
      - { label: 封面图, name: image, widget: image, required: false, hint: 可选择历史图片或上传新图片到 R2 媒体库。 }
      - label: 标签
        name: tags
        widget: select
        multiple: true
        min: 1
        max: 2
        options: [AI, Jetson, CUDA, TensorRT, Docker, 网络, OpenWrt, NAS, 媒体服务, 安全, 系统运维, 开发工具, MCU, 智能家居]
      - label: 分类
        name: category
        widget: select
        options: [Linux, Jetson, Windows, Android, CTF, MCU]
      - label: 系列
        name: series
        widget: object
        required: false
        collapsed: true
        fields:
          - { label: 系列 Slug, name: slug, widget: string, pattern: ["^[a-z0-9]+(?:-[a-z0-9]+)*$", "只允许小写字母、数字和连字符"] }
          - { label: 系列名称, name: name, widget: string }
          - { label: 顺序, name: order, widget: number, value_type: int, min: 1 }
      - { name: lang, widget: hidden, default: zh_CN }
      - { name: tagPermalinks, widget: hidden, default: [] }
      - { name: categoryPermalink, widget: hidden, default: "" }
      - { name: permalink, widget: hidden, default: "" }
      - { label: 正文, name: body, widget: markdown, sanitize_preview: true }
`;
}

const editorHooks = `(() => {
  const tagPermalinks = {
    AI: '/tag/ai/', Jetson: '/tag/jetson/', CUDA: '/tag/cuda/', TensorRT: '/tag/tensorrt/',
    Docker: '/tag/docker/', '网络': '/tag/network/', OpenWrt: '/tag/openwrt/', NAS: '/tag/nas/',
    '媒体服务': '/tag/media-server/', '安全': '/tag/security/', '系统运维': '/tag/sysadmin/',
    '开发工具': '/tag/dev-tools/', MCU: '/tag/mcu/', '智能家居': '/tag/smart-home/'
  };
  const categoryPermalinks = {
    Linux: '/linux/', Jetson: '/linux/jetson/', Windows: '/windows/', Android: '/android/', CTF: '/ctf/', MCU: '/mcu/'
  };
  const absoluteMedia = (value) => typeof value === 'string'
    ? value.replace(new RegExp('(^|[^A-Za-z0-9:/])/wp-content/uploads/', 'g'), '$1https://nvcc-v.com/wp-content/uploads/')
    : value;

  CMS.registerEventListener({
    name: 'preSave',
    handler: ({ entry }) => {
      let data = entry.get('data');
      const tagsValue = data.get('tags');
      const tags = tagsValue?.toJS ? tagsValue.toJS() : Array.isArray(tagsValue) ? tagsValue : [];
      const category = data.get('category');
      const published = String(data.get('published') || '').slice(0, 10);
      const slug = String(data.get('slug') || entry.get('slug') || '').trim();

      data = data
        .set('tagPermalinks', tags.map((tag) => tagPermalinks[tag]).filter(Boolean))
        .set('categoryPermalink', categoryPermalinks[category] || '')
        .set('image', absoluteMedia(data.get('image')))
        .set('body', absoluteMedia(data.get('body')));

      if (!data.get('permalink') && /^\\d{4}-\\d{2}-\\d{2}$/.test(published) && slug) {
        const [year, month, day] = published.split('-');
        data = data.set('permalink', '/' + year + '/' + month + '/' + day + '/' + slug + '/');
      }
      if (!entry.get('newRecord')) {
        data = data.set('updated', new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }));
      }
      return data;
    }
  });

  CMS.init();
})();
`;

const manualInitScript = `window.CMS_MANUAL_INIT = true;
(() => {
  let uploadSequence = 0;
  document.addEventListener('change', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'file' || !input.files?.length || typeof DataTransfer === 'undefined') return;

    const transfer = new DataTransfer();
    for (const file of input.files) {
      const uniqueName = Date.now() + '-' + uploadSequence++ + '-' + file.name;
      transfer.items.add(new File([file], uniqueName, { type: file.type, lastModified: file.lastModified }));
    }
    input.files = transfer.files;
  }, true);
})();
`;

const worker: ExportedHandler<Env> = {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (request.method !== "GET" && request.method !== "HEAD") {
			return textResponse("Method Not Allowed", "text/plain; charset=utf-8", {
				status: 405,
				headers: { Allow: "GET, HEAD" },
			});
		}

		if (
			env.REQUIRE_ACCESS !== "false" &&
			!isLocalRequest(url) &&
			!hasAccessIdentity(request)
		) {
			return accessRequiredPage();
		}

		if (url.pathname === "/health") {
			return textResponse(
				JSON.stringify({
					ok: true,
					cms: CMS_VERSION,
					r2: Boolean(env.R2_ACCESS_KEY_ID),
				}),
				"application/json; charset=utf-8",
			);
		}
		if (url.pathname === "/robots.txt") {
			return textResponse(
				"User-agent: *\nDisallow: /\n",
				"text/plain; charset=utf-8",
			);
		}
		if (!env.R2_ACCESS_KEY_ID) return setupRequiredPage();
		if (url.pathname.startsWith("/wp-content/uploads/")) {
			return proxyMedia(request, url);
		}

		if (url.pathname === "/" || url.pathname === "/index.html") {
			return htmlResponse(editorHtml());
		}
		if (url.pathname === "/config.yml") {
			return textResponse(
				configYaml(env.R2_ACCESS_KEY_ID),
				"text/yaml; charset=utf-8",
			);
		}
		if (url.pathname === "/manual-init.js") {
			return textResponse(manualInitScript, "text/javascript; charset=utf-8");
		}
		if (url.pathname === "/editor-hooks.js") {
			return textResponse(editorHooks, "text/javascript; charset=utf-8");
		}
		return textResponse("Not Found", "text/plain; charset=utf-8", {
			status: 404,
		});
	},
};

export default worker;
