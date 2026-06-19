#!/usr/bin/env bash
# Gia lap webhook SePay de kiem thu tinh nang "So thu" / loa bao thu (chay trong Git Bash).
#
# Cach dung:
#   ./test-sepay-webhook.sh 10000 "khach boa"            # giao dich le -> "Da nhan duoc 10.000d"
#   ./test-sepay-webhook.sh 150000 "DH5 Ban3"            # khop don #5 (neu don #5 chua thanh toan, tong <= 150000)
#   ./test-sepay-webhook.sh 10000 "khach boa" 999001     # truyen Id co dinh -> gui 2 lan de test chong trung
#
# Bien moi truong tuy chon:
#   BASE_URL  (mac dinh http://localhost:5000)
#   API_KEY   (mac dinh YOUR_SEPAY_API_KEY - phai khop SePay:ApiKey trong appsettings)

AMOUNT="${1:-10000}"
CONTENT="${2:-khach boa}"
ID="${3:-$RANDOM}"
BASE_URL="${BASE_URL:-http://localhost:5000}"
API_KEY="${API_KEY:-YOUR_SEPAY_API_KEY}"
DATE="$(date '+%Y-%m-%d %H:%M:%S')"

echo "POST $BASE_URL/api/payment/webhook  (id=$ID, amount=$AMOUNT, content='$CONTENT')"
curl -s -X POST "$BASE_URL/api/payment/webhook" \
  -H "Authorization: Apikey $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"id\":$ID,\"gateway\":\"TPBank\",\"transactionDate\":\"$DATE\",\"accountNumber\":\"0123456789\",\"content\":\"$CONTENT\",\"transferType\":\"in\",\"transferAmount\":$AMOUNT,\"code\":null,\"referenceCode\":\"TEST$ID\"}"
echo
