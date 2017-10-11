var client;
window.init = function(token) {
  client = new ApiAi.ApiAiClient({accessToken: token});
};

function sendText(text) {
  return client.textRequest(text);
}
