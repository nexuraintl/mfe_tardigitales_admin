export interface MenuItem {
  id?: string;
  label: string;
  icon?: string;
  iconClass?: string;
  path?: string;
  badge?: string;
  badgeClass?: string;
  disabled?: boolean;
  children?: MenuItem[];
  expanded?: boolean;
}

export interface MenuSection {
  sectionTitle?: string;
  items: MenuItem[];
}

export interface UserProfile {
  name: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  initials?: string;
}

export interface AppTile {
  id: string;
  name: string;
  color?: string;
  iconText?: string;
  iconClass?: string;
  path?: string;
  url?: string;
  active?: boolean;
}

export interface PrimaryAction {
  label: string;
  icon?: string;
  action?: () => void;
}

export interface HeaderAction {
  id: string;
  label: string;
  icon?: string;
  tooltip?: string;
  forceTooltip?: boolean;
  btnClass?: string;
  action?: () => void;
}

