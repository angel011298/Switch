import { sanitizeData, sanitizeString } from './lib/security/sanitizer';

const testData = {
  name: '   <script>alert("xss")</script> Juan Perez   ',
  email: 'juan@example.com<iframe src="malicious"></iframe>',
  meta: {
    title: '<b>Important</b> Data',
    tags: ['<tag1>', 'normal', '<i>italic</i>']
  }
};

const sanitized = sanitizeData(testData);
console.log('Original:', JSON.stringify(testData, null, 2));
console.log('Sanitized:', JSON.stringify(sanitized, null, 2));

if (sanitized.name === 'Juan Perez' && sanitized.meta.title === 'Important Data') {
  console.log('✅ Sanitization test passed!');
} else {
  console.log('❌ Sanitization test failed!');
}
