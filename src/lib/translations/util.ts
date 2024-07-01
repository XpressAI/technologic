enum Locale {
  en = "en",
  jp = "ja"
}

/** Gets the language locale from local storage given a key. If no locale is found,
 * it resolves to use a default, which is passed in as the second parameter.*/
function getLocaleFromLocalStorageWithDefault(key: string = "locale", defaultLocale: Locale = Locale.en): string {
  let locale = localStorage.getItem(key);

  if (locale) {
    return locale
  } else {
    return JSON.stringify(defaultLocale);
  }

}

/** Gets the users default locale via browser's navigator property */
function getUserLocale(): string {
  if (navigator.languages != undefined)
    return navigator.languages[0];
  return navigator.language;
}

export {
  Locale,
  getLocaleFromLocalStorageWithDefault
}
