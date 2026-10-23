import { createRemoteJWKSet, jwtVerify } from "jose";

export interface AccessEnv {
	REQUIRE_ACCESS?: string;
	ACCESS_TEAM_DOMAIN?: string;
	ACCESS_AUD?: string;
}

const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export async function hasAccessIdentity(
	request: Request,
	env: AccessEnv,
): Promise<boolean> {
	const host = new URL(request.url).hostname;
	if (
		env.REQUIRE_ACCESS === "false" &&
		(host === "localhost" || host === "127.0.0.1")
	)
		return true;
	const token = request.headers.get("Cf-Access-Jwt-Assertion");
	const domain = env.ACCESS_TEAM_DOMAIN;
	if (
		!token ||
		!domain ||
		!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain) ||
		!env.ACCESS_AUD
	)
		return false;
	try {
		let keys = keySets.get(domain);
		if (!keys) {
			keys = createRemoteJWKSet(
				new URL(`https://${domain}/cdn-cgi/access/certs`),
			);
			keySets.set(domain, keys);
		}
		await jwtVerify(token, keys, {
			issuer: `https://${domain}`,
			audience: env.ACCESS_AUD,
			algorithms: ["RS256"],
			requiredClaims: ["exp", "iat", "sub"],
		});
		return true;
	} catch {
		return false;
	}
}
