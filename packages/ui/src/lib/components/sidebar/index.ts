import Footer, { type SidebarFooterProps } from "./sidebar-footer.svelte";
import Header, { type SidebarHeaderProps } from "./sidebar-header.svelte";
import type { SidebarItem } from "./sidebar-item.svelte";
import Nav, { type SidebarNavProps, type SidebarSection } from "./sidebar-nav.svelte";
import Root, { type SidebarProps } from "./sidebar.svelte";

export type {
	SidebarProps,
	SidebarHeaderProps,
	SidebarFooterProps,
	SidebarNavProps,
	SidebarItem,
	SidebarSection
};

export const Sidebar = Object.assign(Root, { Header, Nav, Footer }) as typeof Root & {
	Header: typeof Header;
	Nav: typeof Nav;
	Footer: typeof Footer;
};
