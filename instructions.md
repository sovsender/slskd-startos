# slskd

## Documentation

- [slskd configuration reference](https://github.com/slskd/slskd/blob/master/docs/config.md) — what each slskd setting does.
- [Soularr README](https://github.com/mrusse/soularr/blob/main/README.md) — how Soularr picks and imports albums for Lidarr.

## What you get on StartOS

- **Web UI** — slskd's own interface, for searching Soulseek, downloading, browsing other users, and chatting.
- **Soulseek Peers** — lets other Soulseek users connect to you. Without it slskd still works, but you see fewer search results and can't reach some users.
- Finished downloads land in a folder in FileBrowser Quantum or NextExplorer, where you can open, download, or move them.
- Optional **Lidarr** connection: slskd downloads the albums Lidarr wants, and Lidarr renames them and moves them into your library using its own Media Management settings.

## Getting set up

Install FileBrowser Quantum or NextExplorer first. If you plan to use Lidarr, install it too and pick the same file manager in Lidarr's **Media Storage** action.

### The folders

| Folder                   | Who uses it                                                          | Where you set it           |
| ------------------------ | -------------------------------------------------------------------- | -------------------------- |
| Download folder          | slskd saves finished downloads here. It is a temporary inbox.        | Here: **Download Folder**  |
| Music library            | Lidarr moves albums here from the inbox and renames them.            | In Lidarr: its Root Folder |
| Shared folder (optional) | slskd lets other Soulseek users read it. Usually your music library. | Here: **Shared Folder**    |

- slskd and Lidarr must use the same file manager, so both see the same files.
- The download folder and the music library must be different folders.
- You never tell Lidarr where the download folder is. slskd reports where each finished album is, and Lidarr collects it from there.

### Steps

1. Run **Set Admin Password** and keep the username and password it shows. You sign in to the Web UI with them.
2. Run **Soulseek Account**. Pick a username other Soulseek users will see. Accounts are free: if the name is new, it's registered the first time slskd logs in, with the password in the form. If you already have a Soulseek account, enter its details instead.
3. Run **Download Folder**. Choose the file manager Lidarr uses, and a folder in it that is only for downloads.
4. Start slskd and open the **Web UI**. The **Soulseek Network** status on the Dashboard turns green once you're logged in.

If Soulseek Network says the login was refused, the username probably belongs to someone else. Run **Soulseek Account** again with a different name.

If Soulseek Network says slskd has stopped retrying, it stays offline until you connect again in the slskd web interface or restart slskd. This happens after someone disconnects in the web interface, or when the same Soulseek account logs in from another app: use a separate account for each.

## Using slskd

### Sharing

Many Soulseek users only send files to people who share something back. Run **Shared Folder** and enter a folder in the same file manager as the download folder, such as `Music` (or `Files/Music` in NextExplorer). The folder must already exist. slskd can read it but never change it. Leave the field empty to stop sharing.

### Lidarr

Run **Lidarr** and choose a method. Use one method, never both: Soularr clears slskd's list of finished downloads, which the plugin relies on.

**Lidarr plugin** — Lidarr searches Soulseek and downloads through slskd itself, using the third-party [Tubifarry](https://github.com/TypNull/Tubifarry) plugin.

1. In Lidarr, open **System > Plugins**, install `https://github.com/TypNull/Tubifarry`, and restart Lidarr. Lidarr installs version 2.1.1 by default. That version does not pick its downloads back up after slskd or Lidarr restarts, so an album in progress at that moment may be left unfinished and need searching for again.
2. Here, run **Lidarr**, choose **Lidarr plugin**, and save. It shows a URL and an API key. Run the action again whenever you need to see them.
3. In Lidarr, add **Slskd** under **Settings > Indexers** and again under **Settings > Download Clients**, entering that URL and API key in both.
4. Add an artist or album in Lidarr and search for it. Lidarr downloads it through slskd, then moves it into your library.

The API key has administrator rights in slskd, because the plugin's connection test requires them. slskd is set to accept it only from the server's internal network, where other services run, and not from your LAN or the internet. Treat it like a password anyway, and don't paste it anywhere else.

#### Downloads stay in the download folder

If an album finishes in slskd but never reaches your music library, check these two causes in Lidarr:

- **The artist's folder is inside the download folder.** Lidarr won't import files it thinks are already in the artist's own folder. Open the artist, choose **Edit**, and set a path in your music library (the Root Folder), never inside the download folder.
- **The album is flagged "Has unmatched tracks".** Lidarr couldn't match every file to the album. Open **Activity > Queue**, or **Wanted > Manual Import**, review the files, match them yourself, and import.

**Soularr** — a helper inside this package checks Lidarr for missing albums on a timer, downloads them, and tells Lidarr to import them. Nothing to install in Lidarr.

1. Here, run **Lidarr** and choose **Soularr**. The defaults suit most libraries; you can change the preferred file types and how often Soularr checks Lidarr. Changing these settings later does not interrupt downloads.
2. In Lidarr, add an artist or album and make sure it's monitored. Soularr picks up missing albums on its next check.

If Soularr downloads the wrong albums, raise **Filename Match** or turn on **Include Artist in Searches**. If it finds too little, lower the match or turn artist searches off. An album still downloading when slskd restarts is not imported by Soularr; Lidarr lists it as missing and it is fetched again.

With Soularr, the **Lidarr Automation** status on the Dashboard tells you if Lidarr can't be reached, or if Lidarr can't see the download folder because it uses a different file manager.

### Transfer limits

If Soulseek traffic slows down the rest of your network, run **Transfer Limits** to cap upload and download slots and speeds.

### Receiving incoming connections

To let other users connect to you, make the **Soulseek Peers** interface reachable from the internet on port 50300. If the **Soulseek Network** status says the port is different, another service on this server is already using 50300.

### Your IP address

slskd connects directly to other Soulseek users, so they can see your server's internet address. If you publish this service through a tunnel to keep your home IP private, send its outgoing traffic through that tunnel too. If you use a tunnel for another reason, such as a port your router can't forward, you don't need to change anything.

## Limitations

- Settings that aren't in the actions above, such as user groups and blacklists, can't be changed, including from slskd's own settings page.
- Soularr's own web page isn't included, because it has no login and shows your keys.
