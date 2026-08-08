const legacyPostIds: Record<string, string> = {
	"1246": "/2026/06/14/jetson-orin-openclaw-memory/",
	"1236": "/2026/06/09/jetson-python-uv-system-site-packages/",
	"1177": "/2026/03/18/rime-ice-pinyin-multi-device-setup-sync/",
	"1127": "/2026/01/23/frp-panel-authentik-sso-guide/",
	"1112": "/2026/01/17/jetson-container-trt-yolo26-inference-guide/",
	"1096": "/2026/01/17/yolo26-jetson-orin-tensorrt-inference/",
	"1085": "/2026/01/13/jetson-orin-torchaudio-compile-guide/",
	"1080": "/2026/01/13/jetson-orin-torchvision-compile-guide/",
	"1057": "/2026/01/13/jetson-orin-pytorch-whl-build-guide/",
	"1063": "/2026/01/13/jetson-orin-tensorrt-whl-compilation-guide/",
	"1049": "/2026/01/11/immortalwrt-compile-kmod-compatibility/",
	"1001": "/2026/01/10/jetson-orin-tensorrt-sam3-tutorial/",
	"958": "/2026/01/01/jetson-ha-bambu-spaghetti-detection/",
	"889": "/2025/11/03/jetson-orin-onnx-gpu/",
	"863": "/2025/10/05/ubuntu-2004-xrdp-setup/",
	"843": "/2025/09/26/headscale-tutorial/",
	"837": "/2025/09/22/yolo-v8-rdk-x5-deployment/",
	"821": "/2025/09/11/cudy-tr3000-immortalwrt-guide/",
	"935": "/2025/08/09/linux-llama-deploy-gguf/",
	"759": "/2025/08/08/yolo-conda-windows/",
	"707": "/2025/07/25/tensorrt-llm-qwq-32b-quantization/",
	"933": "/2025/07/20/ubuntu-stable-diffusion-aki/",
	"934": "/2025/07/20/ubuntu-multi-cuda-setup/",
	"932": "/2025/07/19/a100-tensorrt-llm-qwen3-8b/",
	"931": "/2025/07/19/pve-ubuntu-a100-driver-cuda-tensorrt/",
	"930": "/2025/07/15/unraid-cuda-immich-deduplication/",
	"929": "/2025/07/11/unraid-immich-cuda-setup/",
	"928": "/2025/07/10/cf-ssl-dnssec-error/",
	"552": "/2025/07/02/nvidia-jetson-orin-nano-flash/",
	"540": "/2025/06/25/vscode-remote-ssh-setup/",
	"520": "/2025/05/21/tailscale-rdp-monitor/",
	"449": "/2025/04/20/ucsc-ctf2025-writeup/",
	"422": "/2025/03/14/deeplearning-opencv-setup/",
	"410": "/2025/02/11/frp-docker-toml-guide/",
	"404": "/2025/02/07/esp32-wifi-issues/",
	"337": "/2024/11/25/huawei-cloud-homework-backup/",
	"254": "/2024/05/10/easyconnect-relay-proxy/",
	"240": "/2024/01/29/export-microsoft-authenticator-2fa/",
	"212": "/2023/12/30/metatube-plugin-guide/",
	"169": "/2023/12/02/synology-openvpn-setup/",
	"158": "/2023/11/03/aliyun-free-doh-dot/",
	"133": "/2023/10/17/nas-tools-plugin-extension/",
	"102": "/2023/08/12/emby-plugins-guide/",
	"43": "/2023/06/14/pve-hack-synology-alist/",
	"33": "/2023/06/14/huawei-watch-adb-install/",
	"591": "/2025/07/11/unraid-immich-cuda-setup/",
	"626": "/2025/07/20/ubuntu-multi-cuda-setup/",
};

export const onRequest: PagesFunction<unknown, "id"> = async (context) => {
	const id = Array.isArray(context.params.id)
		? context.params.id.join("/")
		: context.params.id;
	const target = legacyPostIds[id ?? ""];
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
