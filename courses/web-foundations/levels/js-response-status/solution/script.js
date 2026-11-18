async function responseMessage(response) {
  if (!response.ok) return '读取失败：' + response.status;
  const data = await response.json();
  return data.message;
}

function makeResponseMessage(status, body) {
  const response = new Response(body, { status });
  return responseMessage(response);
}
