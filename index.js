'use babel';

function getBaseProfilesMap(connectionProfiles) {
  return connectionProfiles.reduce((map, profile) => {
    const server = profile.params.server;
    if (!map[server]) {
      map[server] = {};
    }
    const dirname = require('path').dirname(profile.params.cwd);
    if (!map[server][dirname]) {
      map[server][dirname] = profile;
    }
  }, {});
}

function getExistingProfilesMap(connectionProfiles) {
  return connectionProfiles.reduce((map, profile) => {
    const server = profile.params.server;
    if (!map[server]) {
      map[server] = {};
    }

    if (!map[server][profile.params.cwd]) {
      map[server][profile.params.cwd] = true;
    }
  }, {});
}

function getExistingWorkingSetsMap(workingSets) {
  return workingSets.reduce((map, workingSet) => {
    const mainURI = workingSet.uris[0] || null;
    if (mainURI && !map[mainURI]) {
      map[mainURI] = true;
    }
  }, {});
}

function syncNuclideRemoteProjects() {
  const baseProfiles = getBaseProfilesMap(
    atom.config.get('nuclide.nuclide-remote-projects.connectionProfiles') || []
  );
  Object.keys(baseProfiles).forEach((server) => {
    Object.keys(baseProfiles[server]).forEach((dirname) => {
      const profile = baseProfiles[server][dirname];
      const username = baseProfiles[server][dirname].params.username;

      require('child_process').exec(`ssh ${username}@${server} ls ${dirname}`, (error, stdout, stderr) => {
        if (error) {
          throw error;
        }
        saveNewRemoteFolders(profile, dirname, stdout.split('\n').filter(Boolean));
      });
    });
  });
}

function saveNewRemoteFolders(profile, dirname, folders) {
  const path = require('path');

  const connectionProfiles = atom.config.get('nuclide.nuclide-remote-projects.connectionProfiles') || [];
  const workingSets = atom.config.get('nuclide.nuclide-working-sets.workingSets') || [];

  const existingProfiles = getExistingProfilesMap(connectionProfiles);
  const existingWorkingSets = getExistingWorkingSetsMap(workingSets);
  const newProfiles = [];
  const newWorkingSets = [];

  folders.map((folder) => path.join(dirname, folder))
    .forEach((cwd) => {
      if (!existingProfiles[profile.params.server][cwd]) {
        newProfiles.push({
          deletable: true,
          displayTitle: path.basename(cwd),
          params: {
            displayTitle: path.basename(cwd),
            username: profile.params.username,
            server: profile.params.server,
            cwd: cwd,
            sshPort: profile.params.sshPort,
            authMethod: profile.params.authMethod,
            pathToPrivateKey: profile.params.pathToPrivateKey,
            remoteServerCommand: profile.params.remoteServerCommand,
          },
          saveable: true,
        });
      }

      const primaryURI = `nuclide://${profile.params.server}${cwd}`;
      if (!existingWorkingSets[primaryURI]) {
        newWorkingSets.push({
          name: `${profile.params.server}/${path.basename(cwd)}`,
          active: false,
          uris: [primaryURI],
        });
      }
    });

  atom.config.set('nuclide.nuclide-remote-projects.connectionProfiles', connectionProfiles.concat(newProfiles));
  atom.config.set('nuclide.nuclide-working-sets.workingSets', workingSets.concat(newWorkingSets));
}

export default {
  subscriptions: null,

  activate(state) {
    this.subscriptions = new (require('atom').CompositeDisposable)();

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'sync-nuclide-remote-projects:sync-remote-folders-with-saved-profiles': syncNuclideRemoteProjects,
      })
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    return {};
  }
};
