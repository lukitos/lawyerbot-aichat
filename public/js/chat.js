const SERVER_URL = 'http://localhost:4000';
const API_SERVER_URL = 'http://localhost:8000/api';

// Make connection
const socket = io.connect(SERVER_URL);

// Initialize API.AI
let APIAI_TOKEN = '';
axios.get(`${API_SERVER_URL}/keys/apiai`)
  .then(token => {
    APIAI_TOKEN = token.data;
    window.init(APIAI_TOKEN);
  });

// Query DOM
var message = document.getElementById('message');
var btn = document.getElementById('send');
var output = document.getElementById('output');
var feedback = document.getElementById('feedback');

// Initialize
output.innerHTML = '<p><strong>Welcome! Lawyer Bot here... how can I help you?</strong></p>';

// Who is speaking
let bot = 'Lawyer Bot: ';
let human = 'You: ';
let handle = '';

// Emit events
btn.addEventListener('click', function () {
  handle = human;
  socket.emit('chat', {
    message: message.value,
    handle: handle
  });
  message.value = '';
});

message.addEventListener('keypress', function (e) {
  if (e.keyCode === 13) {
    handle = human;
    socket.emit('chat', {
      message: message.value,
      handle: handle
    });
    message.value = '';
  }
});

// Listen for events
socket.on('chat', function (data) {
  // Display user entered message
  output.innerHTML += '<p><strong>' + data.handle + ' </strong>' + data.message + '</p>';

  // Display bot response message
  handleBotResponse(data);

});

// Handle bot response
function handleBotResponse(data) {

  sendText(data.message)
    .then(function(response) {
      // console.log('in handleBotResponse >>> response: ', response);
      let sessionId = response.sessionId;
      console.log('sessionId=', sessionId);
      let {fulfillment, parameters, action} = response.result;
      sendResponse(fulfillment);
      // Scroll to the bottom of the chat output area and focus to input field
      let chatOutput = $('#output');
      chatOutput.animate({ scrollTop: chatOutput.prop('scrollHeight')}, 500);
      $('#message').focus();
      storeToCRM(action, parameters);
    })
    .catch(function(err) {
      console.log('in handleBotResponse >>> error occurred: ', err);
    });
}

// Handle formatting response from API.AI
function sendResponse(fulfillment) {
  // console.log('in sendResponse >> fulfillment: ', fulfillment);
  handle = bot;
  let repliesHTML = '';
  fulfillment.messages.forEach(function (message) {
    if (message.type === 4) {
      message.payload.replies.forEach(function (reply) {
        repliesHTML += `<a onClick="handleReply('` + reply + `')" class="btn-replies btn-secondary btn-sm">` + reply + `</a> &nbsp;`
      });
    }
  });
  output.innerHTML += `<p><strong> ${handle} </strong> ${fulfillment.speech} </p>`;
  if (repliesHTML !== '') {
    output.innerHTML += `<p> ${repliesHTML} </p>`;
  }

}

// Handle quick replies
function handleReply(reply) {
  handle = human;
  // Display user choice
  output.innerHTML += `<p><strong> ${handle} </strong> ${reply} </p>`;

  // Display bot response
  let data = {
    message: reply,
    handle: handle
  }
  handleBotResponse(data);
}

// Save data to CRM
function storeToCRM(action, parameters) {
  if (action === 'collect'
    && parameters.name !== ''
    && parameters.name !== NaN
    && parameters.name !== undefined
    && parameters.email !== ''
    && parameters.email !== NaN
    && parameters.email !== undefined
    && parameters.phone !== ''
    && parameters.phone !== NaN
    && parameters.phone !== undefined
  ) {
    let contact = {
      name: parameters.name,
      email: parameters.email,
      phone: parameters.phone,
      source: 'bot',
      assignedto: '',
      comments: ''
    };
    // console.log('contact=', contact);
    axios.post(`${API_SERVER_URL}/contact`, contact).then(data => {
      console.log('Successfully added contact: ', data);
      axios.patch(`${API_SERVER_URL}/metrics`, { "chat_lead": 0 })
        .then(() => {
          console.log('Successfully increment the # of lead generated from chat');
        });
    });
  }
}
