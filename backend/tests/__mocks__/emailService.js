module.exports = {
  sendEmail: jest.fn().mockResolvedValue({
    messageId: 'test-message-id',
    accepted: ['test@example.com'],
    response: '250 Message accepted'
  })
};
