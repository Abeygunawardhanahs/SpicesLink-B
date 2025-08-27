// const User = require('../models/User');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');

// // ================== BUYER REGISTRATION ==================
// exports.registerBuyer = async (req, res) => {
//   try {
//     const {
//       shopName,
//       shopOwnerName,
//       shopLocation,
//       contactNumber,
//       emailAddress,
//       password,
//     } = req.body;

//     const existingUser = await User.findOne({ emailAddress });
//     if (existingUser) {
//       return res.status(400).json({ message: 'Email already exists' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const buyer = new User({
//       role: 'Buyer',
//       shopName,
//       shopOwnerName,
//       shopLocation,
//       contactNumber,
//       emailAddress: emailAddress.toLowerCase(),
//       password: hashedPassword,
//     });

//     await buyer.save();
//     res.status(201).json({ message: 'Buyer registered successfully', user: buyer });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ================== BUYER LOGIN ==================
// exports.loginBuyer = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({
//       emailAddress: email.toLowerCase(),
//       role: 'Buyer'
//     });
//     if (!user) return res.status(401).json({ message: 'Invalid email or password' });

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) return res.status(401).json({ message: 'Invalid email or password' });

//     const token = jwt.sign(
//       { userId: user._id, emailAddress: user.emailAddress, role: user.role },
//       process.env.JWT_SECRET || 'spiceslink-secret-key',
//       { expiresIn: '7d' }
//     );

//     await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

//     res.status(200).json({ token, user });
//   } catch (error) {
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

// // ================== SUPPLIER REGISTRATION ==================
// exports.registerSupplier = async (req, res) => {
//   try {
//     const { fullName, contactNumber, email, password } = req.body;

//     if (!fullName || !contactNumber || !email || !password) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     const existingUser = await User.findOne({ emailAddress: email.toLowerCase() });
//     if (existingUser) {
//       return res.status(400).json({ message: 'Email already exists' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const supplier = new User({
//       role: 'Supplier',
//       shopOwnerName: fullName,
//       contactNumber,
//       emailAddress: email.toLowerCase(),
//       password: hashedPassword
//     });

//     await supplier.save();

//     res.status(201).json({
//       success: true,
//       message: 'Supplier registered successfully',
//       user: {
//         id: supplier._id,
//         fullName: supplier.shopOwnerName,
//         emailAddress: supplier.emailAddress,
//         contactNumber: supplier.contactNumber,
//         role: supplier.role
//       }
//     });

//   } catch (error) {
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

// // ================== SUPPLIER LOGIN ==================
// exports.loginSupplier = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({
//       emailAddress: email.toLowerCase(),
//       role: 'Supplier'
//     });
//     if (!user) return res.status(401).json({ message: 'Invalid email or password' });

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) return res.status(401).json({ message: 'Invalid email or password' });

//     const token = jwt.sign(
//       { userId: user._id, emailAddress: user.emailAddress, role: user.role },
//       process.env.JWT_SECRET || 'spiceslink-secret-key',
//       { expiresIn: '7d' }
//     );

//     await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

//     res.status(200).json({ token, user });
//   } catch (error) {
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };
