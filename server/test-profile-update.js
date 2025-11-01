const fetch = require('node-fetch');

async function testProfileUpdate() {
  const baseURL = 'http://localhost:5000';
  
  console.log('🧪 Testing Profile Update API...');
  
  // Тест 1: Регистрация нового пользователя
  console.log('\n1️⃣ Testing registration...');
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
      // Тест 2: Получение профиля
      console.log('\n2️⃣ Testing GET profile...');
      const profileResponse = await fetch(`${baseURL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const profileData = await profileResponse.json();
      console.log('GET Profile Status:', profileResponse.status);
      console.log('GET Profile Response:', profileData);

      // Тест 3: Обновление профиля
      console.log('\n3️⃣ Testing PUT profile...');
      const updateResponse = await fetch(`${baseURL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: 'Иванов Иван Иванович',
          groupNumber: 'ГР-2024-01'
        }),
      });
      
      const updateData = await updateResponse.json();
      console.log('PUT Profile Status:', updateResponse.status);
      console.log('PUT Profile Response:', updateData);

      // Тест 4: Проверка обновленного профиля
      console.log('\n4️⃣ Testing GET updated profile...');
      const updatedProfileResponse = await fetch(`${baseURL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const updatedProfileData = await updatedProfileResponse.json();
      console.log('GET Updated Profile Status:', updatedProfileResponse.status);
      console.log('GET Updated Profile Response:', updatedProfileData);
      
    }
    
  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

testProfileUpdate();
