[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Application]::EnableVisualStyles()

$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = "Select project folder to protect with Small Software Cloud"
$dialog.ShowNewFolderButton = $true

$form = New-Object System.Windows.Forms.Form
$form.TopMost = $true
$form.Width = 0
$form.Height = 0
$form.ShowInTaskbar = $false
$form.Opacity = 0
$form.WindowState = [System.Windows.Forms.FormWindowState]::Minimized

$result = $dialog.ShowDialog($form)
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    [Console]::Out.Write($dialog.SelectedPath)
}
$form.Dispose()
$dialog.Dispose()
