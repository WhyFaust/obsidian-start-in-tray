# Start in Tray at Login

Start Obsidian in the Linux system tray at desktop login. A normal manual
launch opens the window as usual. Tested on Ubuntu 24.04.

## Installation

1. Enable [Keep Open in Tray](https://github.com/WhyFaust/obsidian-close-to-tray)
   and make sure the system tray is available.
2. Install **Start in Tray at Login** in Community plugins. For manual
   installation, put `manifest.json` and `main.js` from the same GitHub release
   in `.obsidian/plugins/faust-login-tray/`, then enable the plugin.

## Usage

In the plugin settings, turn on **Запускать при входе в систему**
(Start at login). At your next desktop login, the window hides after the
tray is ready. If the tray is unavailable, Obsidian opens normally. Turn the
setting off before uninstalling to remove the startup entry.

## System access

The setting creates or removes only `faust-obsidian-start-in-tray.desktop`
in the user's XDG autostart directory outside the vault. The entry starts
the installed Obsidian with a flag for hidden startup. The plugin runs
`/usr/bin/gdbus` with fixed arguments to check the local tray host. It does
not contact network services.

## По-русски

Запускает Obsidian при входе в графический сеанс Linux и скрывает окно
после появления значка в системном трее. Обычный запуск открывает окно.

### Установка

1. Установите и включите [Keep Open in Tray](https://github.com/WhyFaust/obsidian-close-to-tray).
2. Скопируйте `main.js` и `manifest.json` из выпуска в
   `.obsidian/plugins/faust-login-tray/` внутри хранилища.
3. Перезапустите Obsidian, включите **Start in Tray at Login** и в его настройках
   включите **Запускать при входе в систему**.

Плагин записывает один пользовательский файл в каталог `autostart` XDG.
Перед удалением плагина выключите переключатель, чтобы убрать запись
автозапуска. Для скрытия нужны работающий StatusNotifierHost и `gdbus`.
Если трей недоступен, приложение открывается обычным способом.

### Сборка

В выпуск входят `main.js` и `manifest.json`. Сборка и зависимости npm
для этого плагина не нужны.
