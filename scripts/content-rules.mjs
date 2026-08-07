const TAGS = Object.freeze({
	ai: { name: "AI", permalink: "/tag/ai/" },
	jetson: { name: "Jetson", permalink: "/tag/jetson/" },
	cuda: { name: "CUDA", permalink: "/tag/cuda/" },
	tensorrt: { name: "TensorRT", permalink: "/tag/tensorrt/" },
	docker: { name: "Docker", permalink: "/tag/docker/" },
	network: { name: "网络", permalink: "/tag/network/" },
	openwrt: { name: "OpenWrt", permalink: "/tag/openwrt/" },
	nas: { name: "NAS", permalink: "/tag/nas/" },
	media: { name: "媒体服务", permalink: "/tag/media-server/" },
	security: { name: "安全", permalink: "/tag/security/" },
	sysadmin: { name: "系统运维", permalink: "/tag/sysadmin/" },
	devtools: { name: "开发工具", permalink: "/tag/dev-tools/" },
	mcu: { name: "MCU", permalink: "/tag/mcu/" },
	smarthome: { name: "智能家居", permalink: "/tag/smart-home/" },
});

const POST_TAG_KEYS = Object.freeze({
	"a100-tensorrt-llm-qwen3-8b": ["ai", "tensorrt"],
	"aliyun-free-doh-dot": ["network", "security"],
	"cf-ssl-dnssec-error": ["network", "security"],
	"cudy-tr3000-immortalwrt-guide": ["openwrt", "network"],
	"deeplearning-opencv-setup": ["ai", "cuda"],
	"easyconnect-relay-proxy": ["network", "docker"],
	"emby-plugins-guide": ["media", "docker"],
	"esp32-wifi-issues": ["mcu", "network"],
	"export-microsoft-authenticator-2fa": ["security"],
	"frp-docker-toml-guide": ["network", "docker"],
	"frp-panel-authentik-sso-guide": ["network", "security"],
	"headscale-tutorial": ["network", "docker"],
	"huawei-cloud-homework-backup": ["sysadmin", "nas"],
	"huawei-watch-adb-install": ["devtools"],
	"immortalwrt-compile-kmod-compatibility": ["openwrt", "sysadmin"],
	"jetson-container-trt-yolo26-inference-guide": ["jetson", "tensorrt"],
	"jetson-ha-bambu-spaghetti-detection": ["smarthome", "ai"],
	"jetson-orin-onnx-gpu": ["jetson", "ai"],
	"jetson-orin-openclaw-memory": ["jetson", "ai"],
	"jetson-orin-pytorch-whl-build-guide": ["jetson", "ai"],
	"jetson-orin-tensorrt-sam3-tutorial": ["jetson", "tensorrt"],
	"jetson-orin-tensorrt-whl-compilation-guide": ["jetson", "tensorrt"],
	"jetson-orin-torchaudio-compile-guide": ["jetson", "ai"],
	"jetson-orin-torchvision-compile-guide": ["jetson", "ai"],
	"jetson-python-uv-system-site-packages": ["jetson", "tensorrt"],
	"linux-llama-deploy-gguf": ["ai", "sysadmin"],
	"metatube-plugin-guide": ["media"],
	"nas-tools-plugin-extension": ["nas", "media"],
	"nvidia-jetson-orin-nano-flash": ["jetson", "sysadmin"],
	"pve-hack-synology-alist": ["nas", "sysadmin"],
	"pve-ubuntu-a100-driver-cuda-tensorrt": ["cuda", "tensorrt"],
	"rime-ice-pinyin-multi-device-setup-sync": ["devtools"],
	"synology-openvpn-setup": ["nas", "network"],
	"tailscale-rdp-monitor": ["network", "sysadmin"],
	"tensorrt-llm-qwq-32b-quantization": ["ai", "tensorrt"],
	"ubuntu-2004-xrdp-setup": ["network", "sysadmin"],
	"ubuntu-multi-cuda-setup": ["cuda", "sysadmin"],
	"ubuntu-stable-diffusion-aki": ["ai", "cuda"],
	"ucsc-ctf2025-writeup": ["security"],
	"unraid-cuda-immich-deduplication": ["nas", "cuda"],
	"unraid-immich-cuda-setup": ["nas", "cuda"],
	"vscode-remote-ssh-setup": ["devtools", "network"],
	"yolo-conda-windows": ["ai", "devtools"],
	"yolo-v8-rdk-x5-deployment": ["ai"],
	"yolo26-jetson-orin-tensorrt-inference": ["jetson", "tensorrt"],
});

function classifyTag(value) {
	const text = value.toLowerCase();
	if (/tensorrt|trt|量化/.test(text)) return "tensorrt";
	if (/cuda|gpu|显卡/.test(text)) return "cuda";
	if (/jetson|orin|rdk/.test(text)) return "jetson";
	if (/docker|容器/.test(text)) return "docker";
	if (/openwrt|immortalwrt|固件|路由器|内核模块/.test(text)) return "openwrt";
	if (/jellyfin|emby|媒体|影音|插件|刷流|索引器/.test(text)) return "media";
	if (/nas|unraid|群晖|synology|immich|照片|云盘|可道云/.test(text)) return "nas";
	if (/ctf|安全|加密|2fa|密钥|authenticator|证书/.test(text)) return "security";
	if (/esp32|mcu|micropython|wifi/.test(text)) return "mcu";
	if (/智能家居|3d打印/.test(text)) return "smarthome";
	if (/vscode|rime|输入法|adb|应用|开发|脚本/.test(text)) return "devtools";
	if (/vpn|frp|headscale|tailscale|dns|cdn|网络|内网|远程|ssh|xrdp/.test(text)) return "network";
	if (/ai|yolo|模型|pytorch|深度学习|llama|sam|qwen|opencv|推理/.test(text)) return "ai";
	return "sysadmin";
}

export function compactTags(slug, sourceTags = []) {
	const configured = POST_TAG_KEYS[slug];
	const keys = configured ?? [
		...new Set(sourceTags.map((tag) => classifyTag(String(tag)))),
	].slice(0, 2);
	return keys.map((key) => TAGS[key]);
}

export function legacyTagTarget(name, permalink, fallback) {
	const retained = Object.values(TAGS).find(
		(tag) => tag.permalink.toLowerCase() === permalink.toLowerCase(),
	);
	if (retained) return retained.permalink;
	return TAGS[classifyTag(`${name} ${permalink}`)]?.permalink ?? fallback;
}

export function stripAiSummary(markdown) {
	return markdown.replace(
		/^AI智能摘要[\t ]*\n[\s\S]*?^—[\t ]*AI[\t ]*生成的文章内容摘要[\t ]*\n+/m,
		"",
	);
}
