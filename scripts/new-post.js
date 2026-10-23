import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { stringify } from "yaml";

const [argument] = process.argv.slice(2);
const slug = argument?.replace(/\.md$/i, "");
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
	console.error("Usage: pnpm new-post <lowercase-slug>");
	process.exit(1);
}
const published = new Intl.DateTimeFormat("en-CA", {
	timeZone: "Asia/Shanghai",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
}).format(new Date());
const metadata = {
	title: slug,
	published,
	description: "",
	image: "",
	tags: [],
	category: "",
	draft: true,
	lang: "zh-CN",
	permalink: `/${published.replaceAll("-", "/")}/${slug}/`,
};
const directory = path.resolve("src/content/posts");
await mkdir(directory, { recursive: true });
const target = path.join(directory, `${slug}.md`);
await writeFile(target, `---\n${stringify(metadata)}---\n`, { flag: "wx" });
console.log(`Created draft ${target}`);
