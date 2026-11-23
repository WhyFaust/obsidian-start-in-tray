"use strict";

const { Notice, Plugin, PluginSettingTab, Setting } = require("obsidian");
const { execFile } = require("node:child_process");
const { mkdir, readFile, writeFile, unlink } = require("node:fs/promises");
const { homedir } = require("node:os");
const { isAbsolute, join, dirname } = require("node:path");

const STARTUP_FLAG = "FAUST_OBSIDIAN_LOGIN_TRAY";
const CLOSE_PLUGIN = "faust-close-to-tray";
const ENTRY = "faust-obsidian-start-in-tray.desktop";
const OWNER = "X-Faust-Start-In-Tray=true";

function desktopArgument(value) {
    if (/[\x00-\x1f\x7f]/.test(value)) throw new Error("Недопустимый путь к Obsidian");
    const quoted = value.replaceAll("%", "%%").replace(/["`$\\]/g, "\\$&");
    return ('"' + quoted + '"').replaceAll("\\", "\\\\");
}

function notifierReady() {
    return new Promise((resolve) => {
        execFile("/usr/bin/gdbus", [
            "call", "--session", "--timeout", "1",
            "--dest", "org.kde.StatusNotifierWatcher",
            "--object-path", "/StatusNotifierWatcher",
            "--method", "org.freedesktop.DBus.Properties.Get",
            "org.kde.StatusNotifierWatcher", "IsStatusNotifierHostRegistered",
        ], { timeout: 1600 }, (error, stdout) => {
            resolve(!error && stdout.trim() === "(<true>,)");
        });
    });
}

module.exports = class LoginTray extends Plugin {
    onload() {
        if (process.platform !== "linux") return;
        const config = process.env.XDG_CONFIG_HOME;
        this.entry = join(config && isAbsolute(config) ? config : join(homedir(), ".config"), "autostart", ENTRY);
        this.addSettingTab(new LoginSettings(this.app, this));
        if (process.env[STARTUP_FLAG] !== "1") return;
        delete process.env[STARTUP_FLAG];
        void this.hideAtLogin();
    }

    onunload() {
        this.stopped = true;
    }

    async hideAtLogin() {
        for (let attempt = 0; attempt < 10 && !this.stopped; attempt++) {
            const ready = await notifierReady();
            if (ready && !this.stopped &&
                this.app.plugins?.plugins?.[CLOSE_PLUGIN]?.hideToTray?.()) return;
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
    }

    async ownsEntry() {
        try {
            const contents = await readFile(this.entry, "utf8");
            if (!contents.split(/\r?\n/).includes(OWNER)) {
                throw new Error("Имя файла автозапуска уже занято");
            }
            return true;
        } catch (error) {
            if (error.code === "ENOENT") return false;
            throw error;
        }
    }

    async setAutostart(enabled) {
        const exists = await this.ownsEntry();
        if (enabled && !exists) {
            const exe = process.execPath;
            if (!isAbsolute(exe)) throw new Error("Не найден исполняемый файл Obsidian");
            const text = [
                "[Desktop Entry]", "Type=Application", "Name=Obsidian (tray)", OWNER,
                "Terminal=false", "Icon=obsidian",
                "Exec=/usr/bin/env " + STARTUP_FLAG + "=1 " + desktopArgument(exe),
                "",
            ].join("\n");
            await mkdir(dirname(this.entry), { recursive: true });
            await writeFile(this.entry, text, { flag: "wx", mode: 0o600 });
        } else if (!enabled && exists) {
            await unlink(this.entry);
        }
    }
};

class LoginSettings extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    async display() {
        this.containerEl.empty();
        try {
            const enabled = await this.plugin.ownsEntry();
            new Setting(this.containerEl)
                .setName("Запускать при входе в систему")
                .setDesc("Для скрытия окна включите Keep Open in Tray. Вход без системного трея оставляет окно открытым.")
                .addToggle((control) => control.setValue(enabled).onChange(async (value) => {
                    control.setDisabled(true);
                    try {
                        await this.plugin.setAutostart(value);
                    } catch (error) {
                        control.setValue(!value);
                        new Notice(error.message);
                    } finally {
                        control.setDisabled(false);
                    }
                }));
        } catch (error) {
            new Notice(error.message);
        }
    }
}
