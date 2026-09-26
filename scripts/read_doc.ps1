[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$parent = "C:\Users\Admin\Desktop\docs sh103-lab"
$sub = Get-ChildItem -Path $parent | Where-Object { $_.PSIsContainer -and $_.Name -like "*bi*u m*" }
$target = Get-ChildItem -Path $sub.FullName | Where-Object { $_.Extension -eq ".doc" }
Write-Output "Found target file: $($target.FullName)"
$doc = $word.Documents.Open($target.FullName)
Write-Output "=== TEXT OF BM.01 ==="
Write-Output $doc.Content.Text
Write-Output "=== TABLES COUNT: $($doc.Tables.Count) ==="
for ($i = 1; $i -le $doc.Tables.Count; $i++) {
    $tbl = $doc.Tables.Item($i)
    Write-Output "--- TABLE $i (Rows: $($tbl.Rows.Count), Cols: $($tbl.Columns.Count)) ---"
    for ($r = 1; $r -le [Math]::Min($tbl.Rows.Count, 35); $r++) {
        $rowText = @()
        for ($c = 1; $c -le [Math]::Min($tbl.Columns.Count, 10); $c++) {
            try {
                $cellVal = $tbl.Cell($r, $c).Range.Text.Trim().Replace("`r", "").Replace("`a", "")
                $rowText += "[$cellVal]"
            } catch {}
        }
        Write-Output "R$r : $($rowText -join ' | ')"
    }
}
$doc.Close([ref]0)
$word.Quit()
