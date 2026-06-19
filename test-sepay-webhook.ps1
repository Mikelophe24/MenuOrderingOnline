# Gia lap webhook SePay de kiem thu tinh nang "So thu" / loa bao thu.
#
# Vi du:
#   .\test-sepay-webhook.ps1 -Amount 10000 -Content "khach boa"     # giao dich le -> "Da nhan duoc 10.000d"
#   .\test-sepay-webhook.ps1 -Amount 150000 -Content "DH5 Ban3"     # khop don #5 (neu don #5 dang chua thanh toan, tong <= 150000)
#   .\test-sepay-webhook.ps1 -Amount 10000 -Content "khach boa" -Id 999001   # gui lai cung Id -> bi bo qua (chong trung)
#
# Tham so:
#   -Amount   So tien (VND)
#   -Content  Noi dung chuyen khoan (chua "DH<id>" de khop don)
#   -Id       SePay transaction id; bo trong = sinh ngau nhien
#   -BaseUrl  Mac dinh http://localhost:5000
#   -ApiKey   Phai khop SePay:ApiKey trong appsettings (dev = YOUR_SEPAY_API_KEY)

param(
  [int]$Amount = 10000,
  [string]$Content = "khach boa",
  [long]$Id = 0,
  [string]$BaseUrl = "http://localhost:5000",
  [string]$ApiKey = "YOUR_SEPAY_API_KEY"
)

if ($Id -eq 0) { $Id = Get-Random -Minimum 100000 -Maximum 999999 }

$body = @{
  id              = $Id
  gateway         = "TPBank"
  transactionDate = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
  accountNumber   = "0123456789"
  content         = $Content
  transferType    = "in"
  transferAmount  = $Amount
  code            = $null
  referenceCode   = "TEST$Id"
} | ConvertTo-Json

Write-Host "POST $BaseUrl/api/payment/webhook  (id=$Id, amount=$Amount, content='$Content')"
try {
  $res = Invoke-RestMethod -Uri "$BaseUrl/api/payment/webhook" -Method Post `
    -Headers @{ Authorization = "Apikey $ApiKey" } -ContentType "application/json" -Body $body
  Write-Host "Response: $($res | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
  Write-Host "Loi: $($_.Exception.Message)" -ForegroundColor Red
}
