// To use this mock,
// in terminal, run `authenticator` to start the authenticator mock server
// in DeviceChallangePollView.js,
// change the getAuthenticatorUrl to return something like 
// http://localhost:4000/probe?authenticator=6512

module.exports = {
  path: '/probe',
  method: 'GET',
  render: (req, res) => {
    res.send();
  }
};
