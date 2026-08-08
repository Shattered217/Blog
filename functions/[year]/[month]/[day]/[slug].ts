const legacyPostSlugs: Record<string, string> = {
	"2026/01/13/torchaudio-build-install-guide":
		"/2026/01/13/jetson-orin-torchaudio-compile-guide/",
	"2026/01/01/%e5%9f%ba%e4%ba%8ejetson%e4%b8%8eha%e7%9a%84%e6%8b%93%e7%ab%b93d%e6%89%93%e5%8d%b0%e6%9c%ba%e7%82%92%e9%9d%a2%e6%a3%80%e6%b5%8b%e6%96%b9%e6%a1%88":
		"/2026/01/01/jetson-ha-bambu-spaghetti-detection/",
	"2025/07/20/ubuntu%e5%ae%89%e8%a3%85%e5%b9%b6%e4%bd%bf%e7%94%a8stable-diffusion-webui%e7%a7%8b%e5%8f%b6%e6%95%b4%e5%90%88%e5%8c%85-cuda12-8pytorch":
		"/2025/07/20/ubuntu-stable-diffusion-aki/",
	"2025/07/20/ubuntu24-04%e5%ae%89%e8%a3%85%e5%a4%9a%e7%89%88%e6%9c%accuda":
		"/2025/07/20/ubuntu-multi-cuda-setup/",
	"2025/07/19/%e5%8d%95%e5%8d%a1a100%e9%80%9a%e8%bf%87tensorrt-llm%e9%87%8f%e5%8c%96%e6%8e%a8%e7%90%86qwen3-8b%e7%ae%80%e5%8d%95%e6%95%99%e7%a8%8b":
		"/2025/07/19/a100-tensorrt-llm-qwen3-8b/",
	"2025/07/19/pveubuntu24-04%e7%9b%b4%e9%80%9aa100%e5%ae%89%e8%a3%85%e9%a9%b1%e5%8a%a8cudatensorrt%e6%95%99%e7%a8%8b":
		"/2025/07/19/pve-ubuntu-a100-driver-cuda-tensorrt/",
	"2025/07/15/unraid%e4%b8%8b%e8%b0%83%e7%94%a8cuda%e5%ae%9e%e7%8e%b0immich%e7%9b%b8%e4%bc%bc%e7%85%a7%e7%89%87%e5%8e%bb%e9%87%8dby-immich-mediakit":
		"/2025/07/15/unraid-cuda-immich-deduplication/",
	"2025/07/11/unraid%e9%83%a8%e7%bd%b2immich%e5%b9%b6%e5%90%af%e7%94%a8cuda%e5%8a%a0%e9%80%9f":
		"/2025/07/11/unraid-immich-cuda-setup/",
	"2025/07/10/%e8%ae%b0%e4%b8%80%e6%ac%a1cloudflare%e5%b0%8f%e4%ba%91%e6%9c%b5%e4%bb%a3%e7%90%86%e7%bd%91%e7%ab%99%e8%bf%9b%e4%b8%8d%e5%8e%bb%e4%ba%8b%e6%95%85":
		"/2025/07/10/cf-ssl-dnssec-error/",
	"2025/07/02/nvidia-jetson-orin-nano-super%e5%88%b7%e6%9c%ba%e6%95%99%e7%a8%8b-nvme":
		"/2025/07/02/nvidia-jetson-orin-nano-flash/",
	"2025/06/25/vscode%e5%9f%ba%e4%ba%8essh%e8%bf%9c%e7%a8%8b%e5%bc%80%e5%8f%91%e9%85%8d%e7%bd%ae%e6%95%99%e7%a8%8b":
		"/2025/06/25/vscode-remote-ssh-setup/",
	"2025/05/21/%e5%ae%9e%e6%97%b6%e7%9b%91%e6%8e%a7-windows-%e8%bf%9c%e7%a8%8b%e6%a1%8c%e9%9d%a2%e4%bc%9a%e8%af%9d%e8%84%9a%e6%9c%ac":
		"/2025/05/21/tailscale-rdp-monitor/",
	"2025/04/20/ucsc_ctf2025%e9%ab%98%e6%a0%a1%e7%bd%91%e7%bb%9c%e5%ae%89%e5%85%a8%e8%81%94%e5%90%88%e9%80%89%e6%8b%94%e8%b5%9b-wp":
		"/2025/04/20/ucsc-ctf2025-writeup/",
	"2025/03/14/deeplearning%e7%8e%af%e5%a2%83%e9%85%8d%e7%bd%ae%e6%95%99%e7%a8%8b-opencv":
		"/2025/03/14/deeplearning-opencv-setup/",
	"2025/02/11/frp-0-61-dockertoml%e9%85%8d%e7%bd%ae%e6%96%b0%e6%89%8b%e6%8c%87%e5%8c%97":
		"/2025/02/11/frp-docker-toml-guide/",
	"2025/02/07/esp32%e8%bf%9e%e4%b8%8d%e4%b8%8awifi%e7%9a%84%e8%a7%a3%e5%86%b3%e6%96%b9%e6%a1%88":
		"/2025/02/07/esp32-wifi-issues/",
	"2024/11/25/%e6%96%b0%e6%89%8b%e5%90%91%e5%a4%a7%e5%ad%a6%e7%94%9f%e7%99%bd%e5%ab%96%e5%8d%8e%e4%b8%ba%e4%ba%91%e6%90%ad%e5%bb%ba%e4%bd%9c%e4%b8%9a%e5%a4%87%e4%bb%bd%e7%bd%91%e7%9b%98":
		"/2024/11/25/huawei-cloud-homework-backup/",
	"2024/05/10/%e5%a6%82%e4%bd%95%e4%bc%98%e9%9b%85%e5%9c%b0%e5%80%9f%e5%8a%a9%e5%85%ac%e7%bd%91%e6%9c%8d%e5%8a%a1%e5%99%a8%e8%ae%bf%e9%97%ae%e5%ad%a6%e6%a0%a1%e5%86%85%e7%bd%91easyconnect":
		"/2024/05/10/easyconnect-relay-proxy/",
	"2024/01/29/%e6%89%8b%e5%8a%a8%e5%af%bc%e5%87%ba-microsoft-authenticator-%e4%b8%ad%e7%9a%842fa%e5%af%86%e9%92%a5":
		"/2024/01/29/export-microsoft-authenticator-2fa/",
	"2023/12/30/jellyfin%e5%92%8cemby%e5%88%ae%e5%89%8a%e5%b0%8f%e5%a7%90%e5%a7%90%e6%8f%92%e4%bb%b6-metatube%e4%bd%bf%e7%94%a8%e6%96%b9%e6%b3%95":
		"/2023/12/30/metatube-plugin-guide/",
	"2023/12/02/%e5%9f%ba%e4%ba%8e%e7%be%a4%e6%99%96vpn-server%e7%9a%84openvpn%e6%9c%8d%e5%8a%a1%e7%ab%af%e9%83%a8%e7%bd%b2%e6%95%99%e7%a8%8b":
		"/2023/12/02/synology-openvpn-setup/",
	"2023/11/03/%e5%a4%a7%e5%ad%a6%e7%94%9f%e7%99%bd%e5%ab%96%e9%98%bf%e9%87%8c%e4%ba%91%e6%9c%8d%e5%8a%a1%e5%99%a8%e6%90%ad%e5%bb%ba%e7%a7%81%e4%ba%badot-doh":
		"/2023/11/03/aliyun-free-doh-dot/",
	"2023/10/17/%e7%bb%99nas-tool%e6%b7%bb%e5%8a%a0%e6%8b%93%e5%b1%95%e5%8a%9f%e8%83%bd%ef%bc%8c%e8%87%aa%e5%ae%9a%e4%b9%89%e5%88%b7%e6%b5%81%e3%80%81%e7%b4%a2%e5%bc%95%e8%a7%84%e5%88%99":
		"/2023/10/17/nas-tools-plugin-extension/",
	"2023/08/12/%e7%bb%99%e4%bd%a0%e7%9a%84emby%e6%b7%bb%e5%8a%a0%e4%b8%80%e7%82%b9%e5%b0%8f%e6%8f%92%e4%bb%b6":
		"/2023/08/12/emby-plugins-guide/",
	"2023/06/14/%e5%9c%a8pve%e4%b8%8a%e7%9b%b4%e9%80%9a%e6%a0%b8%e6%98%be%e7%bb%99%e7%be%a4%e6%99%96%e6%90%ad%e9%85%8dalist%e6%8c%82%e8%bd%bd%e5%ae%9e%e7%8e%b0%e8%87%aa%e5%bb%ba%e5%bd%b1%e5%ba%93":
		"/2023/06/14/pve-hack-synology-alist/",
	"2023/06/14/%e5%9f%ba%e4%ba%8e%e6%97%a0%e7%ba%bfadb%e5%ae%9e%e7%8e%b0%e7%9a%84%e5%8d%8e%e4%b8%ba%e6%89%8b%e8%a1%a8%e7%8b%ac%e7%ab%8b%e5%ae%89%e8%a3%85%e5%ba%94%e7%94%a8":
		"/2023/06/14/huawei-watch-adb-install/",
};

function normalizedSegment(value: string | string[] | undefined): string {
	let decoded = Array.isArray(value) ? value.join("/") : value ?? "";
	try {
		for (let attempt = 0; attempt < 3; attempt += 1) {
			const next = decodeURIComponent(decoded);
			if (next === decoded) break;
			decoded = next;
		}
	} catch {
		return "";
	}
	return encodeURIComponent(decoded).toLowerCase();
}

export const onRequest: PagesFunction<
	unknown,
	"year" | "month" | "day" | "slug"
> = async (context) => {
	const year = normalizedSegment(context.params.year);
	const month = normalizedSegment(context.params.month);
	const day = normalizedSegment(context.params.day);
	const slug = normalizedSegment(context.params.slug);
	const target = legacyPostSlugs[`${year}/${month}/${day}/${slug}`];
	if (!target) return context.next();
	if (context.request.method !== "GET" && context.request.method !== "HEAD") {
		return new Response("Method Not Allowed", {
			status: 405,
			headers: { Allow: "GET, HEAD" },
		});
	}

	return new Response(null, {
		status: 301,
		headers: {
			Location: new URL(target, context.request.url).href,
			"Cache-Control": "public, max-age=86400",
		},
	});
};
