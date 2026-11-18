async function responseMessage(response) {
  // determines the status and then decides whether to parse the text.
}

function makeResponseMessage(status, body) {
  const response = new Response(body, { status });
  return responseMessage(response);
}
