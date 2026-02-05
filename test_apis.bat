@echo off
echo Testando APIs do sistema...
echo.

echo 1. Testando API de empresas:
curl -s -b "session=your_session" "http://localhost:5001/api/companies" | jq ".[] | {id: .id, nome: .nome}"
echo.

echo 2. Procurando empresa de manutenção...
for /f "tokens=*" %%i in ('curl -s -b "session=your_session" "http://localhost:5001/api/companies" ^| jq -r ".[] | select(.nome | test(\"MANUTEN\"; \"i\")) | .id"') do set COMPANY_ID=%%i

echo Company ID encontrado: %COMPANY_ID%
echo.

echo 3. Testando API de cash flow com companyId:
curl -s -b "session=your_session" "http://localhost:5001/api/cash-flow?companyId=%COMPANY_ID%" | jq ". | length"
echo.

echo 4. Testando API de summary com companyId:
curl -s -b "session=your_session" "http://localhost:5001/api/cash-flow/summary?companyId=%COMPANY_ID%" | jq .
echo.

echo 5. Testando API de movements com companyId:
curl -s -b "session=your_session" "http://localhost:5001/api/cash-flow/movements?companyId=%COMPANY_ID%" | jq ". | length"
echo.

pause
