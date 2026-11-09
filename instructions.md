# slskd

## Documentation

- [slskd configuration reference](https://github.com/slskd/slskd/blob/master/docs/config.md) — what each slskd setting does.
- [Soularr README](https://github.com/mrusse/soularr/blob/main/README.md) — how Soularr picks and imports albums for Lidarr.

## What you get on StartOS

- **Web UI** — slskd's own interface, for searching Soulseek, downloading, browsing other users, and chatting.
- **Soulseek Peers** — lets other Soulseek users connect to you. Without it slskd still works, but you see fewer search results and can't reach some users.
- Finished downloads land in a folder in FileBrowser Quantum or NextExplorer, where you can open, download, or move them.
- Optional **Lidarr Automation**: Soularr checks Lidarr for missing albums, downloads them through slskd, and tells Lidarr to import them. Lidarr then renames them and moves them into your library using its own Media Management settings.

## Getting set up

Install FileBrowser Quantum or NextExplorer first. If you plan to use Lidarr Automation, install Lidarr too and pick the same file manager in Lidarr's **Media Storage** action.

1. Run **Set Admin Password** and keep the username and password it shows. You sign in to the Web UI with them.
2. Run **Soulseek Account**. Pick a username other Soulseek users will see. Accounts are free: if the name is new, it's registered the first time slskd logs in, with the password in the form. If you already have a Soulseek account, enter its details instead.
3. Run **Download Location** and choose the same file manager Lidarr uses, and a folder in it.
4. Start slskd and open the **Web UI**. The **Soulseek Network** status on the Dashboard turns green once you're logged in.

If Soulseek Network says the login was refused, the username probably belongs to someone else. Run **Soulseek Account** again with a different name.

## Using slskd

### Sharing

Many Soulseek users only send files to people who share something back. Run **Sharing** and enter a folder in the same file manager as your downloads, such as `Music` (or `Files/Music` in NextExplorer). The folder must already exist. slskd can read it but never change it. Leave the field empty to stop sharing.

### Lidarr Automation

1. In Lidarr, run **Media Storage** and select the same file manager slskd downloads to.
2. Here, run **Lidarr Automation** and choose **On**. The defaults suit most libraries; you can change the preferred file types and how often Soularr checks Lidarr.
3. In Lidarr, add an artist or album and make sure it's monitored. Soularr picks up missing albums on its next check.

If Soularr downloads the wrong albums, run **Lidarr Automation** again and raise **Filename Match** or turn on **Include Artist in Searches**. If it finds too little, lower the match or turn artist searches off.

The **Lidarr Automation** status on the Dashboard tells you if Lidarr can't be reached, or if Lidarr can't see the download folder because it uses a different file manager.

### Transfer limits

If Soulseek traffic slows down the rest of your network, run **Transfer Limits** to cap upload and download slots and speeds.

### Receiving incoming connections

To let other users connect to you, make the **Soulseek Peers** interface reachable from the internet on port 50300. If the **Soulseek Network** status says the port is different, another service on this server is already using 50300.

### Your IP address

slskd connects directly to other Soulseek users, so they can see your server's internet address. If you publish this service through a tunnel to keep your home IP private, send its outgoing traffic through that tunnel too. If you use a tunnel for another reason, such as a port your router can't forward, you don't need to change anything.

## Limitations

- Settings that aren't in the actions above, such as user groups and blacklists, can't be changed, including from slskd's own settings page.
- Soularr's own web page isn't included, because it has no login and shows your keys.
