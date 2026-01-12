const { CookieJar } = require('tough-cookie');
const { default: fetch, CookieJar: FetchCookieJar } = require('fetch-cookie');

async function testCashFlowSummary() {
  try {
    // Create a cookie jar to maintain session
    const cookieJar = new CookieJar();
    const fetchWithCookies = fetch(cookieJar);

    // First, login
    console.log('Logging in...');
    const loginResponse = await fetchWithCookies('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.error('Login failed:', loginResponse.status, loginResponse.statusText);
      const errorText = await loginResponse.text();
      console.error('Error details:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('Login successful:', loginData);

    // Now test the cash flow summary
    console.log('Testing cash flow summary...');
    const summaryResponse = await fetchWithCookies('http://localhost:5000/api/cash-flow/summary');

    if (!summaryResponse.ok) {
      console.error('Summary API Error:', summaryResponse.status, summaryResponse.statusText);
      return;
    }

    const data = await summaryResponse.json();
    console.log('Cash Flow Summary:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCashFlowSummary();