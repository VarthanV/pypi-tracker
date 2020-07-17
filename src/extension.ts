import * as vscode from "vscode";
import * as childProcess from "child_process";

let outputChannel: vscode.OutputChannel;
let rootPath = vscode.workspace.rootPath;
let filePath = `${rootPath}/requirements.txt`;
let packages: string[] = [];

// Executed when the Extension is activated

export function activate(context: vscode.ExtensionContext) {
  console.log("Extension is Working");
  outputChannel = vscode.window.createOutputChannel("Pypi Watcher");
  context.subscriptions.push(outputChannel);
  getInitialPackages(context);
  requirementsWatch(context);
}

// Returns the Packages in the requirements.txt as an array of strings of names of the packages
function returnPackages(): string[] {
  let initialPackages: string[] = [];
  let text = vscode.workspace.openTextDocument(filePath).then((file) => {
    initialPackages = file
      .getText()
      .split("\n")
      .filter((i) => i);
  });
  return initialPackages;
}

/*
Fetch the Packages that are present in the requirements.txt file  
and maintain a record of it in an array

*/
function getInitialPackages(context: vscode.ExtensionContext) {
  let initialPackages = returnPackages();
  for (const pack of initialPackages) {
    packages.push(pack);
  }
}

// Watcher that watches the requirements.txt file for changes

function requirementsWatch(context: vscode.ExtensionContext) {
  let fileWatcher = vscode.workspace.createFileSystemWatcher(filePath);
  fileWatcher.onDidChange((e) => {
    let text = vscode.workspace.openTextDocument(filePath).then((file) => {
      let packs: string[] = file
        .getText()
        .split("\n")
        .filter((i) => i);
      //Install Logic
      for (const pack of packs) {
        if (!packages.includes(pack)) {
          installPackage(pack);
        }
      }
      // Uninstall Logic
      for (const pack of packages) {
        if (!packs.includes(pack) && packages.includes(pack)) {
          unInstallPackage(pack);
        }
      }
    });
  });
  context.subscriptions.push(fileWatcher);
}

// Installs a Package
function installPackage(name: string) {
  packages.push(name);
  let command = `pip install ${name}`;
  let installProcess = childProcess.exec(command, { cwd: rootPath });
  logOutput(`Installing ${name} \n`);

  installProcess.stderr?.on("data", (message) => {
  
    logOutput(message);
  });
  installProcess.stdout?.on("data", (message) => {
    logOutput(message);
  });
}
// Logs output to the command
function logOutput(message: string) {
  outputChannel.append(message +"\n");
}
// Uninstalls a Package
function unInstallPackage(name: string) {
  packages = packages.filter((item) => item !== name);
  let command = `pip uninstall ${name} -y `;
  let installProcess = childProcess.exec(command, { cwd: rootPath });
  logOutput(`Uninstalling ${name} \n `);
  installProcess.stderr?.on("data", (message) => {
    logOutput(message);
  });
  installProcess.stdout?.on("data", (message) => {
    logOutput(message);
  });
}


// this method is called when your extension is deactivated
export function deactivate() {

}
