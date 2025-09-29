// Simple test script to verify authentication endpoints work correctly

const testAuthEndpoints = async () => {
  const baseURL = 'http://localhost:5000/api/auth';
  
  console.log('🧪 Testing Authentication Endpoints...\n');

  // Test data
  const testUser = {
    username: 'testuser_' + Date.now(),
    email: 'test_' + Date.now() + '@example.com',
    fullName: 'Test User',
    password: 'password123'
  };

  try {
    // 1. Test Registration
    console.log('1️⃣ Testing Registration...');
    const registerResponse = await fetch(`${baseURL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const registerData = await registerResponse.json();
    
    if (registerData.success) {
      console.log('✅ Registration successful');
      console.log(`   User: ${registerData.data.user.fullName}`);
      console.log(`   Email: ${registerData.data.user.email}`);
      console.log(`   Token: ${registerData.data.token.substring(0, 20)}...`);
    } else {
      console.log('❌ Registration failed:', registerData.message);
      return;
    }

    // 2. Test Login
    console.log('\n2️⃣ Testing Login...');
    const loginResponse = await fetch(`${baseURL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      }),
    });

    const loginData = await loginResponse.json();
    
    if (loginData.success) {
      console.log('✅ Login successful');
      console.log(`   Welcome back: ${loginData.data.user.fullName}`);
      
      // 3. Test Token Verification (using /me endpoint)
      console.log('\n3️⃣ Testing Token Verification (/me endpoint)...');
      const meResponse = await fetch(`${baseURL}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.data.token}`,
          'Content-Type': 'application/json',
        },
      });

      const meData = await meResponse.json();
      
      if (meData.success) {
        console.log('✅ Token verification successful');
        console.log(`   User data retrieved: ${meData.data.user.fullName}`);
      } else {
        console.log('❌ Token verification failed:', meData.message);
      }
    } else {
      console.log('❌ Login failed:', loginData.message);
    }

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure your backend server is running on http://localhost:5000');
    console.log('   Start it with: cd backend && npm start');
  }

  console.log('\n🏁 Test complete!');
};

// Run the test
testAuthEndpoints();