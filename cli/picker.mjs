// Native folder picker helper.
// Opens the OS folder dialog (Windows Explorer FolderBrowserDialog, macOS Finder, or Linux Zenity).
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function promptFolderPicker() {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      const psScript = path.join(__dirname, 'browse.ps1');
      execFile(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Sta', '-File', psScript],
        { timeout: 120000 },
        (err, stdout) => {
          if (err) {
            console.warn('[picker] Windows folder picker failed:', err.message);
            return resolve(null);
          }
          const folder = stdout.trim();
          resolve(folder || null);
        }
      );
    } else if (process.platform === 'darwin') {
      const script = 'POSIX path of (choose folder with prompt "Select project folder to protect with Small Software Cloud")';
      execFile('osascript', ['-e', script], { timeout: 120000 }, (err, stdout) => {
        if (err) return resolve(null);
        resolve(stdout.trim() || null);
      });
    } else {
      execFile('zenity', ['--file-selection', '--directory', '--title=Select project folder to protect'], { timeout: 120000 }, (err, stdout) => {
        if (err) return resolve(null);
        resolve(stdout.trim() || null);
      });
    }
  });
}
