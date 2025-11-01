const fetch = require('node-fetch');

async function testProfileAPI() {
  const baseURL = 'http://localhost:5000';
  
  console.log('🧪 Testing Profile API...');
  
  // Тест 1: Попытка получить профиль без токена
  console.log('\n1️⃣ Testing profile endpoint without token...');
  try {
    const response = await fetch(`${baseURL}/auth/profile`);
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // Тест 2: Регистрация нового пользователя
  console.log('\n2️⃣ Testing registration...');
  try {
    const testEmail = `test${Date.now()}@example.com`;
    const response = await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: '123456'
      }),
    });
    
    const data = await response.json();
    console.log('Registration Status:', response.status);
    console.log('Registration Response:', data);
    
    if (data.access_token) {
      // Тест 3: Получение профиля с токеном
      console.log('\n3️⃣ Testing profile endpoint with token...');
      const profileResponse = await fetch(`${baseURL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const profileData = await profileResponse.json();
      console.log('Profile Status:', profileResponse.status);
      console.log('Profile Response:', profileData);
    }
    
  } catch (error) {
    console.error('Registration Error:', error.message);
  }
}

testProfileAPI();
