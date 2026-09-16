/**
 * Constantes y utilidades para la gestión centralizada de recursos e imágenes del MFE Admin.
 */

export const DEFAULT_AVATAR_PATH = 'assets/images/default-avatar.svg';
export const PHOTO_CARD_PATH = 'assets/images/photo_card.jpg';

export const ASSET_PATHS = {
  defaultAvatar: DEFAULT_AVATAR_PATH,
  photoCard: PHOTO_CARD_PATH,
  logoJcc: 'assets/images/logo-jcc.png'
};

/**
 * Devuelve la foto proporcionada o la foto por defecto si está vacía/nula.
 */
export function getFotoContadorOrDefault(fotoUrl?: string | null): string {
  if (!fotoUrl || fotoUrl.trim() === '' || fotoUrl === '...' || fotoUrl.includes('placeholder')) {
    return DEFAULT_AVATAR_PATH;
  }
  return fotoUrl;
}
