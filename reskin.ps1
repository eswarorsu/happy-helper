param([string]$FilePath)
$c = Get-Content $FilePath -Raw -Encoding UTF8
$c = $c -replace 'bg-slate-50', 'bg-[#FAF7F2]'
$c = $c -replace 'bg-white/80 backdrop-blur-md', 'bg-[#1B1F3B] backdrop-blur-md'
$c = $c -replace 'border-slate-200', 'border-[#E8E2D9]'
$c = $c -replace 'text-slate-900', 'text-[#1B1F3B]'
$c = $c -replace 'bg-slate-900', 'bg-indigo-600'
$c = $c -replace 'hover:bg-slate-800', 'hover:bg-indigo-700'
$c = $c -replace 'shadow-slate-200', 'shadow-[#E8E2D9]/50'
$c = $c -replace 'shadow-indigo-200', 'shadow-indigo-300/30'
$c = $c -replace 'border-slate-100', 'border-[#E8E2D9]/60'
$c = $c -replace 'bg-slate-100', 'bg-indigo-50'
[System.IO.File]::WriteAllText($FilePath, $c, [System.Text.Encoding]::UTF8)
Write-Host "Done: $FilePath ($(($c.Length)) chars)"
