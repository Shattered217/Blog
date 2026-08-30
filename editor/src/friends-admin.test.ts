import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { addFriend } from "./friends-admin.ts";

const require = createRequire(import.meta.url);
const biomeBin = require.resolve("@biomejs/biome/bin/biome");

test("approved friend source remains valid under Biome with long values", () => {
	const source = `export const friendLinks = [
];
`;
	const avatarUrl = `https://cdn.example.com/${"long-path-".repeat(40)}avatar.png`;
	const result = addFriend(source, {
		id: 1,
		name: '包含 "引号" 的站点',
		site_url: "https://example.com/",
		avatar_url: avatarUrl,
		description: "第一行\n第二行带反斜杠 \\",
		status: "pending",
		created_at: "2026-08-30 09:00:00",
		updated_at: "2026-08-30 09:00:00",
	});

	assert.match(result, /biome-ignore format:/);
	assert.match(
		result,
		new RegExp(JSON.stringify(avatarUrl).replaceAll("/", "\\/")),
	);
	assert.match(result, /description: "第一行\\n第二行带反斜杠 \\\\"/);

	const directory = mkdtempSync(join(tmpdir(), "friend-source-"));
	const fixture = join(directory, "friends.ts");
	try {
		writeFileSync(fixture, result);
		execFileSync(process.execPath, [biomeBin, "ci", fixture], {
			cwd: process.cwd(),
			stdio: "pipe",
		});
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
