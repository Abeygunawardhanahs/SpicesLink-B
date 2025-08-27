// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   role: {
//     type: String,
//     enum: ['Buyer', 'Supplier'],
//     required: true
//   },
//   shopName: String,
//   shopOwnerName: String,
//   shopLocation: String,
//   contactNumber: String,
//   emailAddress: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   password: String,
//   lastLogin: {
//     type: Date,
//     default: null
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// userSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// module.exports = mongoose.model('User', userSchema);
