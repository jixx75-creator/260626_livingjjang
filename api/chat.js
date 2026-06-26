const { handleChat } = require('./_chatHandler');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const result = await handleChat(req.body || {});
  res.status(result.status).json(result.body);
};
