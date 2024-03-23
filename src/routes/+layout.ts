export const ssr = false;

// i18n
import { loadTranslations } from '$lib/translations';
import { Locale, getLocaleFromLocalStorageWithDefault } from '$lib/translations/util';

export const load = async ({ url }: any) => {
  const { pathname } = url;
  const initLocale = JSON.parse(getLocaleFromLocalStorageWithDefault("locale", Locale.en));

  await loadTranslations(initLocale, pathname);
  return {};
}
