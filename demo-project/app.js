document.getElementById('btn-action').addEventListener('click', () => {
  const result = document.getElementById('result');
  result.textContent = '✓ Secure interaction confirmed at ' + new Date().toLocaleTimeString();
});
