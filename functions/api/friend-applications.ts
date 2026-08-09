interface Env {
	BLOG_DB: D1Database;
	TELEGRAM_BOT_TOKEN?: string;
	TELEGRAM_CHAT_ID?: string;
	TURNSTILE_SECRET_KEY: string;
}

type TurnstileResult = {
	success: boolean;
	action?: string;
	"error-codes"?: string[];
};

function json(data: unknown, status = 200): Response {
	return Response.json(data, {
		status,
		headers: {
			"Cache-Control": "no-store",
			"Content-Type": "application/json; charset=utf-8",
			"X-Content-Type-Options": "nosniff",
		},
	});
}

function formValue(form: FormData, key: string): string {
	const value = form.get(key);
	return typeof value === "string" ? value.trim() : "";
}

function normalizedHttpUrl(value: string, required: boolean): string | null {
	if (!value && !required) return "";
	try {
		const parsed = new URL(value);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
			return null;
		parsed.hash = "";
		return parsed.toString();
	} catch {
		return null;
	}
}

function escapeTelegramHtml(value: string): string {
	return value.replace(/[&<>]/g, (character) => {
		if (character === "&") return "&amp;";
		if (character === "<") return "&lt;";
		return "&gt;";
	});
}

async function notifyTelegram(
	env: Env,
	application: {
		name: string;
		siteUrl: string;
		avatarUrl: string;
		description: string;
	},
): Promise<void> {
	if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
	const details = [
		"🔗 <b>新友链申请</b>",
		`<b>名称：</b>${escapeTelegramHtml(application.name)}`,
		`<b>地址：</b><a href="${escapeTelegramHtml(application.siteUrl)}">${escapeTelegramHtml(application.siteUrl)}</a>`,
		`<b>简介：</b>${escapeTelegramHtml(application.description)}`,
	];
	if (application.avatarUrl) {
		details.push(
			`<b>头像：</b><a href="${escapeTelegramHtml(application.avatarUrl)}">查看</a>`,
		);
	}

	const response = await fetch(
		`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				chat_id: env.TELEGRAM_CHAT_ID,
				text: details.join("\n"),
				parse_mode: "HTML",
				link_preview_options: { is_disabled: true },
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: "审核友链",
								url: "https://editor.nvcc-v.com/friends/",
							},
						],
					],
				},
			}),
		},
	);
	if (!response.ok) throw new Error(`Telegram API returned ${response.status}`);
}

export const onRequestPost: PagesFunction<Env> = async ({
	request,
	env,
	waitUntil,
}) => {
	const requestUrl = new URL(request.url);
	const origin = request.headers.get("Origin");
	if (origin && origin !== requestUrl.origin) {
		return json({ error: "Invalid request origin" }, 403);
	}

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return json({ error: "Invalid form data" }, 400);
	}

	if (formValue(form, "website")) {
		return json({ ok: true }, 201);
	}

	const name = formValue(form, "name");
	const description = formValue(form, "description");
	const siteUrl = normalizedHttpUrl(formValue(form, "url"), true);
	const avatarUrl = normalizedHttpUrl(formValue(form, "avatar"), false);
	if (
		name.length < 1 ||
		name.length > 60 ||
		description.length < 2 ||
		description.length > 240 ||
		!siteUrl ||
		avatarUrl === null
	) {
		return json({ error: "请检查名称、网址、头像和简介格式" }, 400);
	}

	const token = formValue(form, "cf-turnstile-response");
	if (!token || !env.TURNSTILE_SECRET_KEY) {
		return json({ error: "请先完成人机验证" }, 400);
	}

	const verification = new FormData();
	verification.set("secret", env.TURNSTILE_SECRET_KEY);
	verification.set("response", token);
	const remoteIp = request.headers.get("CF-Connecting-IP");
	if (remoteIp) verification.set("remoteip", remoteIp);

	const verifyResponse = await fetch(
		"https://challenges.cloudflare.com/turnstile/v0/siteverify",
		{ method: "POST", body: verification },
	);
	const verifyResult = await verifyResponse.json<TurnstileResult>();
	if (!verifyResult.success || verifyResult.action !== "friend_application") {
		return json({ error: "人机验证失败，请刷新后重试" }, 403);
	}

	await env.BLOG_DB.prepare(
		`INSERT INTO friend_applications
			(name, site_url, avatar_url, description)
		 VALUES (?, ?, ?, ?)
		 ON CONFLICT(site_url) DO UPDATE SET
			name = excluded.name,
			avatar_url = excluded.avatar_url,
			description = excluded.description,
			status = 'pending',
			updated_at = CURRENT_TIMESTAMP`,
	)
		.bind(name, siteUrl, avatarUrl || null, description)
		.run();
	waitUntil(
		notifyTelegram(env, {
			name,
			siteUrl,
			avatarUrl: avatarUrl || "",
			description,
		}).catch(() => undefined),
	);

	return json({ ok: true, message: "申请已提交，审核后会出现在友链页。" }, 201);
};

export const onRequest: PagesFunction<Env> = async (context) => {
	if (context.request.method === "POST") return onRequestPost(context);
	return new Response("Method Not Allowed", {
		status: 405,
		headers: { Allow: "POST" },
	});
};
