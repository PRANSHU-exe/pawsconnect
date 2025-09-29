// Test script for PawsBot functionality
const fetch = require('node-fetch'); // You might need to install: npm install node-fetch

const testPawsBot = async () => {
  console.log('🧪 Testing Enhanced PawsBot...\n');

  const baseURL = 'http://localhost:5000/api';
  let authToken = null;

  // Test data
  const testUser = {
    username: 'pawsbot_tester_' + Date.now(),
    email: 'pawsbot_test_' + Date.now() + '@example.com',
    fullName: 'PawsBot Tester',
    password: 'password123'
  };

  try {
    // 1. Register a test user
    console.log('1️⃣ Registering test user...');
    const registerResponse = await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });

    const registerData = await registerResponse.json();
    
    if (registerData.success) {
      authToken = registerData.data.token;
      console.log('✅ User registered successfully');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
    } else {
      throw new Error('Registration failed: ' + registerData.message);
    }

    // 2. Test basic PawsBot chat
    console.log('\n2️⃣ Testing basic pet question...');
    const chatResponse1 = await fetch(`${baseURL}/chat/pawsbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        message: "How often should I feed my 2-year-old golden retriever?"
      }),
    });

    const chatData1 = await chatResponse1.json();
    
    if (chatData1.success) {
      console.log('✅ Basic chat successful');
      console.log(`   Enhanced: ${chatData1.data.enhanced ? 'Yes' : 'No'}`);
      console.log(`   Urgency: ${chatData1.data.urgency || 'Not specified'}`);
      console.log(`   Response: ${chatData1.data.response.substring(0, 150)}...`);
    } else {
      console.log('❌ Basic chat failed:', chatData1.message);
    }

    // 3. Test emergency scenario
    console.log('\n3️⃣ Testing emergency scenario...');
    const chatResponse2 = await fetch(`${baseURL}/chat/pawsbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        message: "EMERGENCY: My dog is having trouble breathing and won't move!"
      }),
    });

    const chatData2 = await chatResponse2.json();
    
    if (chatData2.success) {
      console.log('✅ Emergency chat successful');
      console.log(`   Enhanced: ${chatData2.data.enhanced ? 'Yes' : 'No'}`);
      console.log(`   Urgency: ${chatData2.data.urgency || 'Not specified'}`);
      console.log(`   Response: ${chatData2.data.response.substring(0, 200)}...`);
    } else {
      console.log('❌ Emergency chat failed:', chatData2.message);
    }

    // 4. Test behavioral question
    console.log('\n4️⃣ Testing behavioral question...');
    const chatResponse3 = await fetch(`${baseURL}/chat/pawsbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        message: "My cat keeps scratching the furniture despite having a scratching post"
      }),
    });

    const chatData3 = await chatResponse3.json();
    
    if (chatData3.success) {
      console.log('✅ Behavioral chat successful');
      console.log(`   Enhanced: ${chatData3.data.enhanced ? 'Yes' : 'No'}`);
      console.log(`   Urgency: ${chatData3.data.urgency || 'Not specified'}`);
      console.log(`   Response: ${chatData3.data.response.substring(0, 200)}...`);
    } else {
      console.log('❌ Behavioral chat failed:', chatData3.message);
    }

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   • Backend server is running on http://localhost:5000');
    console.log('   • GEMINI_API_KEY is set in your .env file');
    console.log('   • MongoDB is connected');
  }

  console.log('\n🏁 PawsBot test complete!');
  console.log('\n🌐 You can now test PawsBot in your browser at:');
  console.log('   Frontend: http://localhost:3000/pawsbot');
};

// Run the test
testPawsBot();