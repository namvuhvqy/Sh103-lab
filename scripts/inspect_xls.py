import glob
import os

try:
    import xlrd
except ImportError:
    import subprocess
    subprocess.run(["pip", "install", "xlrd"], check=True)
    import xlrd

for path in glob.glob("/mnt/c/Users/Admin/Desktop/docs sh103-lab/danh mục biểu mẫu/*.xls"):
    print("\n" + "="*50)
    print("FILE:", os.path.basename(path))
    wb = xlrd.open_workbook(path)
    for sheet in wb.sheets():
        print(f"\n--- Sheet: {sheet.name} (Rows: {sheet.nrows}, Cols: {sheet.ncols}) ---")
        for r in range(min(35, sheet.nrows)):
            row_vals = [str(sheet.cell_value(r, c)).strip().replace("\n", " ") for c in range(sheet.ncols)]
            non_empty = [v for v in row_vals if v]
            if non_empty:
                print(f"Row {r+1:2d}: " + " | ".join(row_vals[:12]))
