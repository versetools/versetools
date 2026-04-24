import Actions, { type NavActionsProps } from "./nav-actions.svelte";
import List, { type NavListProps, type NavItem, type NavItemGroup } from "./nav-list.svelte";
import Root, { type NavProps } from "./nav.svelte";

export type { NavProps, NavActionsProps, NavListProps, NavItem, NavItemGroup };

export const Nav = Object.assign(Root, { List, Actions });
