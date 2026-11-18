async function responseMessage(response) {
  // 判断状态，再决定是否解析正文。
}

function makeResponseMessage(status, body) {
  const response = new Response(body, { status });
  return responseMessage(response);
}
