$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $doc = $word.Documents.Open("C:\Users\Admin\Desktop\docs sh103-lab\danh mục biểu mẫu\Phụ lục.docx")
    
    Write-Output "=== DOCUMENT TEXT ==="
    $doc.Content.Text | Out-File -FilePath "C:\Users\Admin\Desktop\phu_luc_text.txt" -Encoding utf8
    
    Write-Output "=== TABLES COUNT: $($doc.Tables.Count) ==="
    $tableData = @()
    for ($i = 1; $i -le $doc.Tables.Count; $i++) {
        $tbl = $doc.Tables.Item($i)
        $tableData += "`n--- TABLE $i (Rows: $($tbl.Rows.Count), Cols: $($tbl.Columns.Count)) ---"
        for ($r = 1; $r -le $tbl.Rows.Count; $r++) {
            $rowText = @()
            for ($c = 1; $c -le $tbl.Columns.Count; $c++) {
                try {
                    $cell = $tbl.Cell($r, $c)
                    $txt = $cell.Range.Text.Trim("`r", "`a", "`n", "`t", " ")
                    $rowText += $txt
                } catch {
                    $rowText += ""
                }
            }
            $tableData += ($rowText -join " | ")
        }
    }
    $tableData | Out-File -FilePath "C:\Users\Admin\Desktop\phu_luc_tables.txt" -Encoding utf8
    Write-Output "Extraction complete!"
} finally {
    $doc.Close([ref]$false)
    $word.Quit()
}
