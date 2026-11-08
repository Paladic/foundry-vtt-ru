/**
 * JB2A Free Content registers module settings with literal English strings.
 * The language dictionary cannot override those strings directly.
 */
export function localizeJb2aSettings() {
  if (game.i18n.lang !== "ru" || !game.modules.get("JB2A_DnD5e")?.active) return;

  const translations = {
    "JB2A_DnD5e.runonlyonce": {
      name: "Отключить информационную карточку в чате",
      hint: "Если включено, при запуске мира информационная карточка JB2A не появляется в чате.",
    },
    "JB2A_DnD5e.jb2aLocation": {
      name: "Расположение файлов JB2A (по умолчанию: modules)",
      hint: "Требуется перезагрузка. Меняйте значение, только если файлы JB2A размещены во внешнем хранилище, например S3. Иначе оставьте modules. Указывайте путь без завершающего символа /.",
    },
  };

  for (const [key, labels] of Object.entries(translations)) {
    const setting = game.settings.settings.get(key);
    if (!setting) continue;

    setting.name = labels.name;
    setting.hint = labels.hint;
  }
}
