$folder = "C:\Users\Admin\Desktop\docs sh103-lab\danh mục biểu mẫu"
$files = Get-ChildItem -Path $folder

Write-Host "=== INSPECTING ALL FILES IN FOLDER ==="

# Initialize COM objects
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
} catch {
    Write-Host "Word COM not available"
}

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
} catch {
    Write-Host "Excel COM not available"
}

foreach ($file in $files) {
    Write-Host "`n======================================================="
    Write-Host "FILE: $($file.Name)"
    Write-Host "======================================================="

    if ($file.Extension -in @(".doc", ".docx") -and $word) {
        try {
            $doc = $word.Documents.Open($file.FullName)
            Write-Host "--- Text snippet ---"
            $text = $doc.Content.Text
            if ($text.Length -gt 2500) {
                Write-Host $text.Substring(0, 2500)
            } else {
                Write-Host $text
            }
            Write-Host "--- Tables count: $($doc.Tables.Count) ---"
            for ($t = 1; $t -le [Math]::Min($doc.Tables.Count, 3); $t++) {
                $table = $doc.Tables.Item($t)
                Write-Host "Table $($t): Rows=$($table.Rows.Count), Cols=$($table.Columns.Count)"
                for ($r = 1; $r -le [Math]::Min($table.Rows.Count, 6); $r++) {
                    $rowText = @()
                    for ($c = 1; $c -le [Math]::Min($table.Columns.Count, 15); $c++) {
                        try {
                            $cell = $table.Cell($r, $c).Range.Text.Trim().Replace("`r", "").Replace("`a", "")
                            $rowText += "[$cell]"
                        } catch {}
                    }
                    Write-Host "R$($r): $($rowText -join ' | ')"
                }
            }
            $doc.Close([ref]$false)
        } catch {
            Write-Host "Error opening doc: $_"
        }
    }
    elseif ($file.Extension -in @(".xls", ".xlsx") -and $excel) {
        try {
            $wb = $excel.Workbooks.Open($file.FullName)
            Write-Host "Sheets: $($wb.Sheets.Count)"
            foreach ($sh in $wb.Sheets) {
                Write-Host "`n--- Sheet: $($sh.Name) ---"
                $used = $sh.UsedRange
                Write-Host "Used rows: $($used.Rows.Count), cols: $($used.Columns.Count)"
                for ($r = 1; $r -le [Math]::Min($used.Rows.Count, 15); $r++) {
                    $rowVals = @()
                    for ($c = 1; $c -le [Math]::Min($used.Columns.Count, 20); $c++) {
                        $v = $sh.Cells.Item($r, $c).Text
                        $rowVals += "[$v]"
                    }
                    Write-Host "R$($r): $($rowVals -join ' | ')"
                }
            }
            $wb.Close($false)
        } catch {
            Write-Host "Error opening xls: $_"
        }
    }
}

if ($word) { $word.Quit() }
if ($excel) { $excel.Quit() }
