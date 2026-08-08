const descriptions: Record<string, string> = {
	"/linux/":
		"Linux 环境配置、服务器运维与 GPU 计算记录，重点保留实际部署中遇到的问题和可复现的解决步骤。",
	"/linux/jetson/":
		"围绕 NVIDIA Jetson 的系统部署、CUDA 环境、TensorRT 编译和边缘端模型推理实践。",
	"/android/":
		"Android 设备调试、应用数据迁移和日常折腾记录，关注能直接落地的工具与操作方法。",
	"/windows/":
		"Windows 开发环境、远程桌面和实用脚本配置，记录那些不容易一次配置成功的细节。",
	"/ctf/":
		"CTF 比赛题解与复盘，按题型记录分析过程、关键思路和最终可验证的解法。",
	"/mcu/":
		"ESP32 与 MicroPython 实验记录，主要整理联网、固件和软硬件兼容问题的排查过程。",
	"/tag/jetson/":
		"Jetson Orin 系列开发板的刷机、编译、推理与性能调优文章集合。",
	"/tag/ai/":
		"本地 AI 环境搭建、模型转换和推理部署记录，覆盖服务器与边缘设备两类场景。",
	"/tag/tensorrt/":
		"TensorRT 与 TensorRT-LLM 的编译、量化和推理实践，侧重版本兼容与实际性能。",
	"/tag/dev-tools/":
		"开发工具、远程环境和跨设备工作流配置，让重复操作尽量变成可复用的流程。",
	"/tag/network/":
		"组网、VPN、远程访问和 DNS 故障排查，记录家庭、校园与云服务器之间的连接问题。",
	"/tag/security/":
		"账号安全、双因素验证、证书与 CTF 相关内容，重点关注备份和可恢复性。",
	"/tag/openwrt/":
		"OpenWrt 与 ImmortalWrt 的刷机、固件编译和内核模块兼容记录。",
	"/tag/sysadmin/":
		"Linux 服务器、虚拟化与服务部署中的运维笔记，包含配置、排障和后续维护。",
	"/tag/smart-home/":
		"Home Assistant、传感器和边缘设备联动实践，记录从接入到自动化落地的过程。",
	"/tag/docker/":
		"Docker 与 Compose 服务部署示例，整理镜像、网络、存储和硬件加速配置。",
	"/tag/cuda/":
		"NVIDIA CUDA 驱动、工具链和多版本环境管理，覆盖虚拟机、服务器与 NAS。",
	"/tag/nas/": "UNRAID、群晖、Immich 与媒体服务相关的 NAS 部署和数据管理实践。",
	"/tag/mcu/":
		"单片机联网和 MicroPython 调试记录，目前主要围绕 ESP32 的 Wi-Fi 兼容问题。",
	"/tag/media-server/":
		"Emby、Jellyfin、NAS-Tools 等媒体服务的插件、刮削与媒体库管理配置。",
};

export function getTaxonomyDescription(
	path: string,
	name: string,
	type: "category" | "tag",
	count: number,
): string {
	return (
		descriptions[path] ??
		`${name}${type === "category" ? "分类" : "标签"}下共有 ${count} 篇文章，集中整理相关配置、实践与排障记录。`
	);
}
