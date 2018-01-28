# sync-nuclide-remote-projects package

Automatically create nuclide profiles for all your remote project folders.

An Example:
Suppose I have an existing remote-project profile, it's pointing to the machine `dev-starscream` and the code is in `/home/ryan/code/project1`. The Nuclide URI for that would be: `nuclide://dev-starscream/home/ryan/code/project1`.

`Click Nuclide > Remote Projects > Sync Remote Folders with Saved Profiles` in the menu bar (or use the Command Pallet) to find all the other folders inside `nuclide://dev-starscream/home/ryan/code/*` and automatically create remote-project profiles and workingSets for everything.

Backup your `~/.atom/config.cson` file if you're unsure before starting. The settings that this touches are `nuclide.nuclide-remote-projects.connectionProfiles` and `nuclide.nuclide-working-sets.workingSets`.

Note: This package does interact with internal nuclide settings and injects itself inside the Nuclide menu bar item.
