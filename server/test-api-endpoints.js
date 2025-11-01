const fetch = require('node-fetch');

async function testAPIEndpoints() {
  const baseURL = 'http://localhost:5000';
  
  console.log('🧪 Testing API endpoints...');
  
  try {
    // Тест 1: Проверяем, что сервер запущен
    console.log('\n1️⃣ Testing server availability...');
    const healthResponse = await fetch(`${baseURL}/`);
    console.log('Server Status:', healthResponse.status);
    
    if (healthResponse.status !== 200) {
      console.log('❌ Server is not responding correctly');
      return;
    }
    
    // Тест 2: Регистрация пользователя
    console.log('\n2️⃣ Testing registration...');
    const testEmail = `test${Date.now()}@example.com`;
    const registerResponse = await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: '123456'
      }),
    });
    
    console.log('Register Status:', registerResponse.status);
    const registerData = await registerResponse.json();
    console.log('Register Response:', registerData);
    
    if (!registerData.access_token) {
      console.log('❌ Registration failed, stopping tests');
      return;
    }
    
    // Тест 3: GET profile
    console.log('\n3️⃣ Testing GET /auth/profile...');
    const getProfileResponse = await fetch(`${baseURL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${registerData.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('GET Profile Status:', getProfileResponse.status);
    const getProfileData = await getProfileResponse.json();
    console.log('GET Profile Response:', getProfileData);
    
    // Тест 4: PUT profile (основной тест)
    console.log('\n4️⃣ Testing PUT /auth/profile...');
    const putProfileResponse = await fetch(`${baseURL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${registerData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: 'Тестовый Пользователь',
        groupNumber: 'ГР-2024-01'
      }),
    });
    
    console.log('PUT Profile Status:', putProfileResponse.status);
    console.log('PUT Profile Headers:', Object.fromEntries(putProfileResponse.headers.entries()));
    
    if (putProfileResponse.status === 404) {
      console.log('❌ 404 Error - PUT /auth/profile route not found');
      console.log('💡 Check if:');
      console.log('   - Server is restarted after adding new routes');
      console.log('   - AuthController has @Put("profile") decorator');
      console.log('   - AuthModule is properly configured');
    } else if (putProfileResponse.status === 405) {
      console.log('❌ 405 Error - Method not allowed');
      console.log('💡 Check CORS configuration for PUT method');
    } else if (putProfileResponse.status === 500) {
      console.log('❌ 500 Error - Internal server error');
      console.log('💡 Check server logs for detailed error');
    } else if (putProfileResponse.status === 200) {
      console.log('✅ PUT /auth/profile works correctly!');
      const putProfileData = await putProfileResponse.json();
      console.log('PUT Profile Response:', putProfileData);
    } else {
      console.log(`⚠️ Unexpected status: ${putProfileResponse.status}`);
    }
    
    const putProfileData = await putProfileResponse.json();
    console.log('PUT Profile Response:', putProfileData);
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Server is not running. Start it with: npm run start:dev');
    }
  }
}

testAPIEndpoints();
