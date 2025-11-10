// Debug script for backup system
// Add this to your browser console to debug backup issues

console.log('=== BACKUP SYSTEM DEBUG ===');

// Check if user is authenticated
const token = localStorage.getItem('auth_token');
console.log('Auth token exists:', !!token);
if (token) {
    console.log('Token preview:', token.substring(0, 20) + '...');
}

// Check API base URL
console.log('API Base URL:', 'http://127.0.0.1:8000/api');

// Test API connectivity
async function testBackupAPI() {
    try {
        console.log('Testing backup dashboard...');
        const response = await fetch('http://127.0.0.1:8000/api/backup', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✓ Backup dashboard accessible');
            console.log('Available backups:', data.data?.available_backups?.length || 0);
        } else {
            const errorText = await response.text();
            console.log('✗ Backup dashboard failed:', response.status, errorText);
        }
    } catch (error) {
        console.log('✗ Network error:', error.message);
    }
}

// Test backup creation
async function testBackupCreation() {
    try {
        console.log('Testing database backup creation...');
        const response = await fetch('http://127.0.0.1:8000/api/backup/database', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✓ Database backup creation successful');
            console.log('Message:', data.message);
        } else {
            const errorText = await response.text();
            console.log('✗ Database backup creation failed:', response.status, errorText);
        }
    } catch (error) {
        console.log('✗ Network error:', error.message);
    }
}

// Run tests
testBackupAPI().then(() => {
    console.log('\n--- Testing backup creation ---');
    return testBackupCreation();
}).then(() => {
    console.log('\n=== DEBUG COMPLETED ===');
});

// Export functions for manual testing
window.debugBackup = {
    testAPI: testBackupAPI,
    testCreation: testBackupCreation
};



