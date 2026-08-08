import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "Shattered217のBlog",
	subtitle: "专注于技术干货分享",
	description:
		"一个在校大学生的个人技术博客，可能包含高性能计算、边缘计算、路由交换、模型、云，亦或是杂七杂八~的教程指南",
	socialImage: "/og-default.png",
	lang: "zh_CN", // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
	themeColor: {
		hue: 241, // Hue used for surfaces derived from the #aeade3 accent.
		fixed: true, // Hide the theme color picker for visitors
	},
	banner: {
		enable: false,
		src: "assets/images/demo-banner.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: false, // Display the credit text of the banner image
			text: "", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		{
			src: "/favicon/favicon-32.png",
			sizes: "32x32",
		},
		{
			src: "/favicon/favicon-192.png",
			sizes: "192x192",
		},
	],
	verification: {
		baidu: "codeva-Ui2Nl4r8lL",
	},
	analytics: {
		clarity: "vb45sclx4u",
	},
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		{
			name: "友链",
			url: "/friends/",
		},
		{
			name: "GitHub",
			url: "https://github.com/Shattered217", // Internal links should not include the base path, as it is automatically added
			external: true, // Show an external link icon and will open in a new tab
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "/wp-content/uploads/2026/01/1769071791-250x250nobk.webp",
	name: "Shattered217",
	bio: "一个有趣的白日梦想家",
	links: [
		{
			name: "Bilibili",
			icon: "fa6-brands:bilibili",
			url: "https://space.bilibili.com/284936847",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/Shattered217",
		},
		{
			name: "Steam",
			icon: "fa6-brands:steam",
			url: "https://steamcommunity.com/id/Shattered217/",
		},
		{
			name: "小红书",
			icon: "material-symbols:menu-book-outline-rounded",
			url: "https://www.xiaohongshu.com/user/profile/678be992000000000e010c44",
		},
		{
			name: "Email",
			icon: "material-symbols:mail-outline-rounded",
			url: "mailto:me@shattered.top",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};
