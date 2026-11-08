/**
 * PSFX registers settings with literal English labels instead of localization keys.
 * Foundry cannot translate those labels using a language dictionary alone.
 * Replace the labels only when the Russian language and PSFX are active.
 */
export function localizePsfxSettings() {
  if (game.i18n.lang !== "ru" || !game.modules.get("psfx")?.active) return;

  const translations = {
    "psfx.popup1126": {
      name: "Отключить информационную карточку в чате",
      hint: "Если включено, информационная карточка не появляется в чате при запуске мира.",
    },
    "psfx.psfxLocation": {
      name: "Расположение файлов Peri SFX (по умолчанию: modules)",
      hint: "Требуется перезагрузка. Изменяйте только в том случае, если файлы PSFX размещены во внешнем хранилище, например S3. Иначе оставьте стандартное значение modules. Указывайте путь без завершающего символа /.",
    },
  };

  for (const [key, labels] of Object.entries(translations)) {
    const setting = game.settings.settings.get(key);
    if (!setting) continue;

    setting.name = labels.name;
    setting.hint = labels.hint;
  }
}
