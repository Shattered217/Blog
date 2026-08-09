/// <reference types="@cloudflare/workers-types" />

export interface FriendAdminEnv {
	BLOG_DB: D1Database;
}

interface FriendApplication {
	id: number;
	name: string;
	site_url: string;
	avatar_url: string | null;
	description: string;
	status: "pending" | "approved" | "rejected";
	created_at: string;
	updated_at: string;
}

interface GitHubContent {
	content?: string;
	encoding?: string;
	sha?: string;
}

const REPOSITORY = "Shattered217/Blog";
const BRANCH = "migration/fuwari";
const FRIENDS_PATH = "src/data/friends.ts";
const GITHUB_API = "https://api.github.com";

function json(data: unknown, status = 200): Response {
	return Response.json(data, {
		status,
		headers: {
			"Cache-Control": "private, no-store",
			"Content-Type": "application/json; charset=utf-8",
			"X-Content-Type-Options": "nosniff",
			"X-Robots-Tag": "noindex, nofollow, noarchive",
		},
	});
}

function githubHeaders(token: string): Headers {
	return new Headers({
		Accept: "application/vnd.github+json",
		Authorization: `Bearer ${token}`,
		"User-Agent": "nvcc-v-blog-editor",
		"X-GitHub-Api-Version": "2022-11-28",
	});
}

function decodeBase64(value: string): string {
	const bytes = Uint8Array.from(atob(value.replace(/\s/g, "")), (character) =>
		character.charCodeAt(0),
	);
	return new TextDecoder().decode(bytes);
}

function encodeBase64(value: string): string {
	const bytes = new TextEncoder().encode(value);
	let binary = "";
	for (let offset = 0; offset < bytes.length; offset += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
	}
	return btoa(binary);
}

function comparableUrl(value: string): string {
	const url = new URL(value);
	url.hash = "";
	url.hostname = url.hostname.toLowerCase();
	if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
	return url.href;
}

function existingFriendUrls(source: string): string[] {
	return [...source.matchAll(/\burl:\s*("(?:[^"\\]|\\.)*")/g)]
		.map((match) => {
			try {
				return JSON.parse(match[1]) as string;
			} catch {
				return "";
			}
		})
		.filter(Boolean);
}

function friendSource(application: FriendApplication): string {
	const avatar =
		application.avatar_url ||
		new URL("/favicon.ico", application.site_url).href;
	const fields = [
		["name", application.name],
		["url", application.site_url],
		["avatar", avatar],
		["description", application.description],
	] as const;
	return [
		"\t{",
		...fields.map(([name, value]) => `\t\t${name}: ${JSON.stringify(value)},`),
		"\t},",
	].join("\n");
}

function addFriend(source: string, application: FriendApplication): string {
	const insertionPoint = source.lastIndexOf("\n];");
	if (insertionPoint === -1) {
		throw new Error("友链数据文件格式无法识别，未执行提交");
	}
	return `${source.slice(0, insertionPoint)}\n${friendSource(application)}${source.slice(insertionPoint)}`;
}

async function githubError(response: Response): Promise<string> {
	try {
		const result = await response.json<{ message?: string }>();
		return result.message || `GitHub API 返回 ${response.status}`;
	} catch {
		return `GitHub API 返回 ${response.status}`;
	}
}

async function publishToGitHub(
	application: FriendApplication,
	token: string,
): Promise<{ commitUrl?: string; alreadyPublished?: boolean }> {
	const endpoint = `${GITHUB_API}/repos/${REPOSITORY}/contents/${FRIENDS_PATH}`;
	const headers = githubHeaders(token);
	const currentResponse = await fetch(
		`${endpoint}?${new URLSearchParams({ ref: BRANCH })}`,
		{ headers },
	);
	if (!currentResponse.ok) throw new Error(await githubError(currentResponse));

	const current = await currentResponse.json<GitHubContent>();
	if (!current.content || current.encoding !== "base64" || !current.sha) {
		throw new Error("GitHub 返回的友链文件内容不完整");
	}

	const source = decodeBase64(current.content);
	const targetUrl = comparableUrl(application.site_url);
	if (
		existingFriendUrls(source).some((url) => {
			try {
				return comparableUrl(url) === targetUrl;
			} catch {
				return false;
			}
		})
	) {
		return { alreadyPublished: true };
	}

	const updateResponse = await fetch(endpoint, {
		method: "PUT",
		headers,
		body: JSON.stringify({
			message: `content: approve friend link ${application.name}`,
			content: encodeBase64(addFriend(source, application)),
			sha: current.sha,
			branch: BRANCH,
		}),
	});
	if (!updateResponse.ok) throw new Error(await githubError(updateResponse));

	const update = await updateResponse.json<{
		commit?: { html_url?: string };
	}>();
	return { commitUrl: update.commit?.html_url };
}

async function getApplication(
	database: D1Database,
	id: number,
): Promise<FriendApplication | null> {
	return database
		.prepare(
			`SELECT id, name, site_url, avatar_url, description, status, created_at, updated_at
			 FROM friend_applications WHERE id = ?`,
		)
		.bind(id)
		.first<FriendApplication>();
}

function bearerToken(request: Request): string {
	const authorization = request.headers.get("Authorization") || "";
	return authorization.startsWith("Bearer ")
		? authorization.slice(7).trim()
		: "";
}

function validAdminOrigin(request: Request): boolean {
	const requestUrl = new URL(request.url);
	const origin = request.headers.get("Origin");
	return (
		request.headers.get("X-Friend-Admin") === "1" &&
		Boolean(origin) &&
		origin === requestUrl.origin
	);
}

export async function handleFriendAdminApi(
	request: Request,
	env: FriendAdminEnv,
): Promise<Response> {
	if (request.method === "GET") {
		const status = new URL(request.url).searchParams.get("status");
		const validStatus = ["pending", "approved", "rejected"].includes(
			status || "",
		)
			? status
			: null;
		const statement = validStatus
			? env.BLOG_DB.prepare(
					`SELECT id, name, site_url, avatar_url, description, status, created_at, updated_at
					 FROM friend_applications WHERE status = ? ORDER BY created_at DESC LIMIT 100`,
				).bind(validStatus)
			: env.BLOG_DB.prepare(
					`SELECT id, name, site_url, avatar_url, description, status, created_at, updated_at
					 FROM friend_applications ORDER BY created_at DESC LIMIT 100`,
				);
		const { results } = await statement.all<FriendApplication>();
		return json({ applications: results });
	}

	if (request.method !== "POST") {
		return json({ error: "Method Not Allowed" }, 405);
	}
	if (!validAdminOrigin(request))
		return json({ error: "Invalid request origin" }, 403);

	let body: { id?: unknown; action?: unknown };
	try {
		body = await request.json<typeof body>();
	} catch {
		return json({ error: "请求格式无效" }, 400);
	}
	const id = typeof body.id === "number" ? body.id : Number(body.id);
	const action = typeof body.action === "string" ? body.action : "";
	if (
		!Number.isInteger(id) ||
		id < 1 ||
		!["approve", "reject", "delete"].includes(action)
	) {
		return json({ error: "操作参数无效" }, 400);
	}

	const application = await getApplication(env.BLOG_DB, id);
	if (!application) return json({ error: "未找到这条友链申请" }, 404);

	if (action === "delete") {
		await env.BLOG_DB.prepare("DELETE FROM friend_applications WHERE id = ?")
			.bind(id)
			.run();
		return json({ ok: true, message: "申请已删除" });
	}

	if (action === "reject") {
		await env.BLOG_DB.prepare(
			"UPDATE friend_applications SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		)
			.bind(id)
			.run();
		return json({ ok: true, message: "申请已拒绝" });
	}

	const token = bearerToken(request);
	if (!token) return json({ error: "请先在文章编辑器登录 GitHub" }, 401);

	try {
		const published = await publishToGitHub(application, token);
		await env.BLOG_DB.prepare(
			"UPDATE friend_applications SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		)
			.bind(id)
			.run();
		return json({
			ok: true,
			message: published.alreadyPublished
				? "该站点已在友链中，状态已同步"
				: "已批准并提交到 GitHub",
			commitUrl: published.commitUrl,
		});
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : "提交 GitHub 失败" },
			502,
		);
	}
}

export function friendAdminHtml(): string {
	return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <meta name="theme-color" content="#aeade3">
  <link rel="icon" href="https://nvcc-v.com/favicon/favicon-32.png" sizes="32x32">
  <title>友链审核 · NVCC Blog Studio</title>
  <style>
    :root { color-scheme: light; --ink: #25242b; --muted: #6f6d78; --line: #dedce8; --primary: #7774ad; --wash: #efedf8; --danger: #a34444; font-family: "Noto Sans SC", "PingFang SC", sans-serif; }
    * { box-sizing: border-box; }
    body { min-height: 100vh; margin: 0; color: var(--ink); background: radial-gradient(circle at 12% 0%, #e9e7ff 0, transparent 36rem), linear-gradient(145deg, #f8f7f3, #f0eff5); }
    a { color: inherit; }
    button { font: inherit; }
    .shell { width: min(72rem, calc(100% - 2rem)); margin: 0 auto; padding: 2rem 0 5rem; }
    header { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
    .eyebrow { margin: 0 0 .35rem; color: var(--primary); font-weight: 800; font-size: .76rem; letter-spacing: .18em; }
    h1 { margin: 0; font: 700 clamp(2rem, 5vw, 3.5rem)/1.05 Georgia, "Noto Serif SC", serif; }
    .sub { margin: .65rem 0 0; color: var(--muted); }
    nav { display: flex; gap: .6rem; flex-wrap: wrap; }
    nav a, .filter { border: 1px solid var(--line); border-radius: 999px; padding: .62rem .9rem; text-decoration: none; background: #ffffffb8; cursor: pointer; }
    .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem; margin-bottom: 1rem; border: 1px solid var(--line); border-radius: 1.2rem; background: #ffffffc9; backdrop-filter: blur(16px); }
    .filters { display: flex; gap: .45rem; flex-wrap: wrap; }
    .filter.active { color: #fff; background: var(--primary); border-color: var(--primary); }
    .auth { color: var(--muted); font-size: .88rem; }
    .auth.good { color: #377653; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 21rem), 1fr)); gap: 1rem; }
    .card { padding: 1.15rem; border: 1px solid var(--line); border-radius: 1.25rem; background: #fff; box-shadow: 0 1rem 2.5rem #34305b0a; animation: enter .35s both; }
    .card-head { display: flex; align-items: center; gap: .8rem; }
    .avatar { width: 3rem; height: 3rem; border-radius: .9rem; object-fit: cover; background: var(--wash); }
    .avatar-fallback { display: grid; place-items: center; color: var(--primary); font-weight: 800; }
    h2 { margin: 0; font-size: 1.05rem; }
    .url { display: block; margin-top: .22rem; max-width: 15rem; color: var(--primary); font-size: .82rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .description { min-height: 3rem; margin: 1rem 0; color: var(--muted); line-height: 1.55; }
    .meta { display: flex; justify-content: space-between; gap: .5rem; color: #918e99; font-size: .78rem; }
    .status { border-radius: 999px; padding: .18rem .55rem; background: var(--wash); color: var(--primary); }
    .actions { display: flex; gap: .5rem; margin-top: 1rem; }
    .action { flex: 1; border: 0; border-radius: .8rem; padding: .68rem .75rem; cursor: pointer; background: var(--wash); color: var(--ink); }
    .action.primary { color: #fff; background: var(--primary); }
    .action.danger { color: var(--danger); }
    .action:disabled { cursor: wait; opacity: .55; }
    .empty { grid-column: 1 / -1; padding: 4rem 1rem; text-align: center; color: var(--muted); }
    .notice { position: fixed; right: 1rem; bottom: 1rem; max-width: min(28rem, calc(100% - 2rem)); padding: .9rem 1rem; border-radius: .9rem; color: #fff; background: #25242b; box-shadow: 0 1rem 3rem #0003; transform: translateY(140%); transition: transform .25s; }
    .notice.show { transform: translateY(0); }
    @keyframes enter { from { opacity: 0; transform: translateY(8px); } }
    @media (max-width: 700px) { header, .toolbar { align-items: flex-start; flex-direction: column; } .shell { padding-top: 1.2rem; } }
    @media (prefers-color-scheme: dark) { :root { color-scheme: dark; --ink: #efedf6; --muted: #aaa7b5; --line: #403e49; --primary: #b7b5ec; --wash: #353341; } body { background: radial-gradient(circle at 12% 0%, #353359 0, transparent 35rem), #1b1a20; } .card, .toolbar, nav a, .filter { background: #25242ce8; } .filter.active { color: #24212e; background: var(--primary); } }
  </style>
</head>
<body>
  <main class="shell">
    <header>
      <div><p class="eyebrow">NVCC BLOG STUDIO</p><h1>友链审核</h1><p class="sub">批准后自动写入 GitHub，下一次 Worker 构建完成即上线。</p></div>
      <nav><a href="/">文章编辑器</a><a href="https://nvcc-v.com/friends/" target="_blank" rel="noreferrer">查看友链页 ↗</a></nav>
    </header>
    <section class="toolbar">
      <div class="filters">
        <button class="filter active" data-filter="pending">待审核</button>
        <button class="filter" data-filter="approved">已批准</button>
        <button class="filter" data-filter="rejected">已拒绝</button>
        <button class="filter" data-filter="all">全部</button>
      </div>
      <span class="auth" id="auth">正在检查 GitHub 登录…</span>
    </section>
    <section class="grid" id="applications"><p class="empty">正在读取申请…</p></section>
  </main>
  <div class="notice" id="notice" role="status"></div>
  <script src="/friends-admin.js"></script>
</body>
</html>`;
}

export const friendAdminScript = `(() => {
  const container = document.querySelector('#applications');
  const authLabel = document.querySelector('#auth');
  const notice = document.querySelector('#notice');
  let filter = 'pending';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  const githubToken = () => {
    try {
      const account = JSON.parse(localStorage.getItem('sveltia-cms.user') || 'null');
      return typeof account?.token === 'string' ? account.token : '';
    } catch { return ''; }
  };

  const updateAuth = () => {
    const connected = Boolean(githubToken());
    authLabel.textContent = connected ? 'GitHub 已连接，可直接批准' : '请先进入文章编辑器并登录 GitHub';
    authLabel.classList.toggle('good', connected);
  };

  const toast = (message) => {
    notice.textContent = message;
    notice.classList.add('show');
    window.setTimeout(() => notice.classList.remove('show'), 3200);
  };

  const formatTime = (value) => {
    const normalized = String(value).replace(' ', 'T') + 'Z';
    return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Shanghai' }).format(new Date(normalized));
  };

  const render = (applications) => {
    if (!applications.length) {
      container.innerHTML = '<p class="empty">这个列表目前是空的。</p>';
      return;
    }
    container.innerHTML = applications.map((item, index) => {
      const image = item.avatar_url
        ? '<img class="avatar" src="' + escapeHtml(item.avatar_url) + '" alt="" data-fallback="' + escapeHtml(String(item.name || '?').slice(0, 1)) + '" referrerpolicy="no-referrer">'
        : '<span class="avatar avatar-fallback">' + escapeHtml(String(item.name || '?').slice(0, 1)) + '</span>';
      const actions = item.status === 'pending'
        ? '<button class="action primary" data-action="approve">批准</button><button class="action" data-action="reject">拒绝</button><button class="action danger" data-action="delete">删除</button>'
        : '<button class="action danger" data-action="delete">删除记录</button>';
      return '<article class="card" data-id="' + item.id + '" style="animation-delay:' + index * 35 + 'ms">' +
        '<div class="card-head">' + image + '<div><h2>' + escapeHtml(item.name) + '</h2><a class="url" href="' + escapeHtml(item.site_url) + '" target="_blank" rel="noreferrer">' + escapeHtml(item.site_url) + '</a></div></div>' +
        '<p class="description">' + escapeHtml(item.description) + '</p>' +
        '<div class="meta"><span class="status">' + escapeHtml(item.status) + '</span><time>' + escapeHtml(formatTime(item.created_at)) + '</time></div>' +
        '<div class="actions">' + actions + '</div></article>';
    }).join('');
    container.querySelectorAll('img.avatar').forEach((image) => image.addEventListener('error', () => {
      const fallback = document.createElement('span');
      fallback.className = 'avatar avatar-fallback';
      fallback.textContent = image.dataset.fallback || '?';
      image.replaceWith(fallback);
    }));
  };

  const load = async () => {
    container.innerHTML = '<p class="empty">正在读取申请…</p>';
    const query = filter === 'all' ? '' : '?status=' + encodeURIComponent(filter);
    try {
      const response = await fetch('/api/friend-applications' + query, { headers: { Accept: 'application/json' } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '读取申请失败');
      render(result.applications || []);
    } catch (error) {
      container.innerHTML = '<p class="empty">' + escapeHtml(error instanceof Error ? error.message : '读取申请失败') + '</p>';
    }
  };

  container.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    const card = button?.closest('[data-id]');
    if (!button || !card) return;
    const action = button.dataset.action;
    const token = githubToken();
    if (action === 'approve' && !token) {
      toast('请先打开文章编辑器并登录 GitHub');
      return;
    }
    if (action === 'delete' && !window.confirm('确定删除这条申请记录吗？')) return;
    card.querySelectorAll('button').forEach((item) => { item.disabled = true; });
    try {
      const response = await fetch('/api/friend-applications', {
        method: 'POST',
        headers: {
          Accept: 'application/json', 'Content-Type': 'application/json', 'X-Friend-Admin': '1',
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        },
        body: JSON.stringify({ id: Number(card.dataset.id), action })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '操作失败');
      toast(result.message || '操作完成');
      if (result.commitUrl) window.open(result.commitUrl, '_blank', 'noopener,noreferrer');
      await load();
    } catch (error) {
      toast(error instanceof Error ? error.message : '操作失败');
      card.querySelectorAll('button').forEach((item) => { item.disabled = false; });
    }
  });

  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('active', item === button));
    load();
  }));

  updateAuth();
  load();
})();
`;
