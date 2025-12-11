// Test script to check embedding format issues
// Run this in browser console or Node.js to test

// Sample embeddings from your screenshot
const positiveEmbedding = [0.000842263, -0.002, 0.05063534, -0.01822311];
const negativeEmbedding = [-0.06215555, 0.0441964, -0.009831056, -0.06050];

console.log('Positive embedding:', positiveEmbedding);
console.log('Negative embedding:', negativeEmbedding);

// Test JSON serialization
console.log('Positive as JSON:', JSON.stringify(positiveEmbedding));
console.log('Negative as JSON:', JSON.stringify(negativeEmbedding));

// Test string conversion
console.log('Positive as string:', positiveEmbedding.toString());
console.log('Negative as string:', negativeEmbedding.toString());

// Test array conversion back
const positiveStr = JSON.stringify(positiveEmbedding);
const negativeStr = JSON.stringify(negativeEmbedding);

console.log('Parsed positive:', JSON.parse(positiveStr));
console.log('Parsed negative:', JSON.parse(negativeStr));

// Test if there are any NaN values
console.log('Positive has NaN:', positiveEmbedding.some(isNaN));
console.log('Negative has NaN:', negativeEmbedding.some(isNaN));

// Test vector format for PostgreSQL
console.log('Positive vector format:', `[${positiveEmbedding.join(',')}]`);
console.log('Negative vector format:', `[${negativeEmbedding.join(',')}]`);