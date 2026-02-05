@echo off
echo Testando APIs do sistema...
echo.

echo 1. Testando API de empresas:
curl -s "http://localhost:5001/api/companies"
echo.

echo 2. Testando API de cash flow sem companyId:
curl -s "http://localhost:5001/api/cash-flow"
echo.

echo 3. Testando API de cash flow com companyId fake:
curl -s "http://localhost:5001/api/cash-flow?companyId=test-id"
echo.

pause
