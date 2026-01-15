const CashAccount = require('../models/CashAccount');

// Create account
exports.createAccount = async (req, res) => {
  try {
    const { name, balance } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const account = new CashAccount({ name, balance: Number(balance) || 0 });
    await account.save();

    res.status(201).json({ success: true, message: 'Account created', data: account });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating account', error: err.message });
  }
};

// Get all accounts
exports.getAccounts = async (req, res) => {
  try {
    const accounts = await CashAccount.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: accounts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching accounts', error: err.message });
  }
};

// Get by id
exports.getAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await CashAccount.findById(id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.status(200).json({ success: true, data: account });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching account', error: err.message });
  }
};

// Update account (name, balance optional)
exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.balance != null) updates.lastUpdated = new Date();

    const account = await CashAccount.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.status(200).json({ success: true, data: account });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating account', error: err.message });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await CashAccount.findByIdAndDelete(id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.status(200).json({ success: true, message: 'Account deleted', data: account });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting account', error: err.message });
  }
};

// Update balance only (recorded with lastUpdated)
exports.updateBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { balance, updatedAt } = req.body;
    if (balance == null) return res.status(400).json({ success: false, message: 'Balance is required' });

    const account = await CashAccount.findByIdAndUpdate(
      id,
      { balance: Number(balance), lastUpdated: updatedAt ? new Date(updatedAt) : new Date() },
      { new: true }
    );

    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.status(200).json({ success: true, data: account });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating balance', error: err.message });
  }
};
