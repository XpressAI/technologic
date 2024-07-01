import i18n, { type Config } from 'sveltekit-i18n';
import { Locale } from './util';
import translations from './translations';

/** Setup up the initial configuration. Pass in en as the default locale. */
const config: Config = {
  initLocale: Locale.en,
  translations,
};

export const { t, l, locales, locale, loadTranslations } = new i18n(config);

/* Working with translations 
 *
 * This project uses the sveltekit-i18n library to support different languages.
 * To add a language, you can start by adding the translations for that language 
 * in the `translations.ts` file. This file contains a JavaScript object with the
 * locale (language code) as the root property, and the translations as properties 
 * on the object. These translations can later be accessed accordingly.
 *
 * `src/translations/lang.json` acts as the menu of languages available. Once you've
 * completed the necessary translations, you can add the language code here, which 
 * will make it selectable in the app settings menu.
 *
 * The fallback language is set to English (en) by default. Once the user selects 
 * a language, the language is saved to local storage and is then used as the default 
 * locale for subsequent sessions.
 *
 * Tips: 
 * - If you need to work wth raw HTML tags within the translations, you can use raw 
 *   HTML as a string and then use Svelte's {@html} to parse the string into valid HTML.
 *   This can be really useful because translations don't usually have hyperlinks at the 
 *   same position.
*/
