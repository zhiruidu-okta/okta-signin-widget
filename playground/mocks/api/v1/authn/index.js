const testData = [
  require('./data/FACTOR_ENROLL_sms.json'),
  // require('./data/success-001.json'),
];
let index = 0;

module.exports = {
  path: '/api/v1/authn',
  proxy: false,
  method: 'POST',
  template () {
    if (index >= testData.length) {
      index = 0;
    }
    return testData[index++];
  },};
