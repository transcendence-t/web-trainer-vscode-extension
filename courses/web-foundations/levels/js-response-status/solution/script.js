async function responseMessage(response) {
  if (!response.ok) return 'Reading failed: ' + response.status;
  const data = await response.json();
  return data.message;
}

function makeResponseMessage(status, body) {
  const response = new Response(body, { status });
  return responseMessage(response);
}
