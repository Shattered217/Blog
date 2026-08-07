CREATE TABLE IF NOT EXISTS post_views (
	path TEXT PRIMARY KEY,
	views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS friend_applications (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	site_url TEXT NOT NULL UNIQUE,
	avatar_url TEXT,
	description TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS friend_applications_status_created
	ON friend_applications (status, created_at DESC);

INSERT INTO post_views (path, views) VALUES
	('/2026/06/14/jetson-orin-openclaw-memory/', 211),
	('/2026/06/09/jetson-python-uv-system-site-packages/', 233),
	('/2026/03/18/rime-ice-pinyin-multi-device-setup-sync/', 1405),
	('/2026/01/23/frp-panel-authentik-sso-guide/', 669),
	('/2026/01/17/jetson-container-trt-yolo26-inference-guide/', 821),
	('/2026/01/17/yolo26-jetson-orin-tensorrt-inference/', 1016),
	('/2026/01/13/jetson-orin-torchaudio-compile-guide/', 638),
	('/2026/01/13/jetson-orin-torchvision-compile-guide/', 1037),
	('/2026/01/13/jetson-orin-pytorch-whl-build-guide/', 1134),
	('/2026/01/13/jetson-orin-tensorrt-whl-compilation-guide/', 756),
	('/2026/01/11/immortalwrt-compile-kmod-compatibility/', 941),
	('/2026/01/10/jetson-orin-tensorrt-sam3-tutorial/', 1171),
	('/2026/01/01/jetson-ha-bambu-spaghetti-detection/', 984),
	('/2025/11/03/jetson-orin-onnx-gpu/', 1045),
	('/2025/10/05/ubuntu-2004-xrdp-setup/', 692),
	('/2025/09/26/headscale-tutorial/', 1778),
	('/2025/09/22/yolo-v8-rdk-x5-deployment/', 1207),
	('/2025/09/11/cudy-tr3000-immortalwrt-guide/', 1464),
	('/2025/08/09/linux-llama-deploy-gguf/', 874),
	('/2025/08/08/yolo-conda-windows/', 757),
	('/2025/07/25/tensorrt-llm-qwq-32b-quantization/', 713),
	('/2025/07/20/ubuntu-stable-diffusion-aki/', 1414),
	('/2025/07/20/ubuntu-multi-cuda-setup/', 960),
	('/2025/07/19/a100-tensorrt-llm-qwen3-8b/', 903),
	('/2025/07/19/pve-ubuntu-a100-driver-cuda-tensorrt/', 791),
	('/2025/07/15/unraid-cuda-immich-deduplication/', 930),
	('/2025/07/11/unraid-immich-cuda-setup/', 1452),
	('/2025/07/10/cf-ssl-dnssec-error/', 603),
	('/2025/07/02/nvidia-jetson-orin-nano-flash/', 1555),
	('/2025/06/25/vscode-remote-ssh-setup/', 703),
	('/2025/05/21/tailscale-rdp-monitor/', 632),
	('/2025/04/20/ucsc-ctf2025-writeup/', 703),
	('/2025/03/14/deeplearning-opencv-setup/', 981),
	('/2025/02/11/frp-docker-toml-guide/', 2656),
	('/2025/02/07/esp32-wifi-issues/', 1010),
	('/2024/11/25/huawei-cloud-homework-backup/', 1248),
	('/2024/05/10/easyconnect-relay-proxy/', 2744),
	('/2024/01/29/export-microsoft-authenticator-2fa/', 3253),
	('/2023/12/30/metatube-plugin-guide/', 4016),
	('/2023/12/02/synology-openvpn-setup/', 4189),
	('/2023/11/03/aliyun-free-doh-dot/', 2319),
	('/2023/10/17/nas-tools-plugin-extension/', 3039),
	('/2023/08/12/emby-plugins-guide/', 3562),
	('/2023/06/14/pve-hack-synology-alist/', 2933),
	('/2023/06/14/huawei-watch-adb-install/', 2017)
ON CONFLICT(path) DO UPDATE SET views = MAX(post_views.views, excluded.views);
