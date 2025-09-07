const Reservation = require('../models/Reservation');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Buyer = require('../models/Buyer');

// Create a new reservation
const createReservation = async (req, res) => {
  try {
    console.log('📝 Creating new reservation...');
    console.log('Request body:', req.body);

    const {
      name,
      mobileNo,
      location,
      spiceName,
      productName,
      totalQuantity,
      qualityGrade,
      deliveryDate,
      paymentMethod,
      accountNumber,
      bankName,
      branchHolderName,
      shopInfo,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !mobileNo || !location || !totalQuantity || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, mobileNo, location, totalQuantity, paymentMethod'
      });
    }

    // Validate shop info
    if (!shopInfo || !shopInfo.shopId) {
      return res.status(400).json({
        success: false,
        message: 'Shop information is required'
      });
    }

    // Verify supplier exists
    const supplier = await Supplier.findById(shopInfo.shopId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Create bank details object
    const bankDetails = paymentMethod === 'advance' ? {
      accountNumber: accountNumber || '',
      bankName: bankName || '',
      branchHolderName: branchHolderName || ''
    } : {};

    // Create reservation
    const reservationData = {
      name: name.trim(),
      mobileNo: mobileNo.trim(),
      location: location.trim(),
      spiceName: spiceName || productName,
      productName: productName || spiceName,
      totalQuantity: parseFloat(totalQuantity),
      qualityGrade: qualityGrade || 'Standard',
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      paymentMethod,
      bankDetails,
      supplier: supplier._id,
      shopInfo: {
        shopId: supplier._id,
        shopName: supplier.businessName || supplier.name,
        shopLocation: supplier.location
      },
      notes: notes || '',
      status: 'pending'
    };

    // If buyer is authenticated, add buyer ID (compatible with your existing auth)
    if (req.user && req.user.id && req.user.role === 'buyer') {
      reservationData.buyer = req.user.id;
    }

    const reservation = new Reservation(reservationData);
    await reservation.save();

    // Populate the response
    await reservation.populate([
      { path: 'supplier', select: 'businessName name location contactNumber email' },
      { path: 'buyer', select: 'name email mobileNo' }
    ]);

    console.log('✅ Reservation created successfully:', reservation._id);

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: reservation,
      reservationId: reservation._id
    });

  } catch (error) {
    console.error('❌ Error creating reservation:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create reservation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all reservations for a supplier
const getSupplierReservations = async (req, res) => {
  try {
    const supplierId = req.params.supplierId || req.user?.id;
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    if (!supplierId) {
      return res.status(400).json({
        success: false,
        message: 'Supplier ID is required'
      });
    }

    // Build query
    const query = { supplier: supplierId };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get reservations with pagination
    const [reservations, totalCount] = await Promise.all([
      Reservation.find(query)
        .populate('buyer', 'name email mobileNo')
        .populate('product', 'name category')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Reservation.countDocuments(query)
    ]);

    // Get status counts
    const statusCounts = await Reservation.aggregate([
      { $match: { supplier: new mongoose.Types.ObjectId(supplierId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusCountsObj = statusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: reservations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: skip + reservations.length < totalCount,
        hasPrev: parseInt(page) > 1
      },
      statusCounts: statusCountsObj
    });

  } catch (error) {
    console.error('❌ Error fetching supplier reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get reservation by ID
const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id)
      .populate('supplier', 'businessName name location contactNumber email')
      .populate('buyer', 'name email mobileNo')
      .populate('product', 'name category pricePerKg');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    res.json({
      success: true,
      data: reservation
    });

  } catch (error) {
    console.error('❌ Error fetching reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update reservation status (for suppliers)
const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message, estimatedPrice, counterOffer } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Check if user is the supplier for this reservation
    if (req.user && req.user.id !== reservation.supplier.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reservations'
      });
    }

    // Update reservation
    reservation.status = status;
    reservation.updatedAt = Date.now();

    // Add supplier response
    if (['accepted', 'rejected'].includes(status)) {
      reservation.supplierResponse = {
        respondedAt: new Date(),
        message: message || '',
        estimatedPrice: estimatedPrice || null,
        counterOffer: counterOffer || null
      };
    }

    await reservation.save();

    // Populate the response
    await reservation.populate([
      { path: 'supplier', select: 'businessName name location contactNumber' },
      { path: 'buyer', select: 'name email mobileNo' }
    ]);

    res.json({
      success: true,
      message: `Reservation ${status} successfully`,
      data: reservation
    });

  } catch (error) {
    console.error('❌ Error updating reservation status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reservation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get buyer's reservations
const getBuyerReservations = async (req, res) => {
  try {
    const buyerId = req.user?.id;
    const { mobileNo } = req.query;

    if (!buyerId && !mobileNo) {
      return res.status(400).json({
        success: false,
        message: 'Buyer ID or mobile number is required'
      });
    }

    // Build query
    const query = buyerId ? { buyer: buyerId } : { mobileNo: mobileNo };

    const reservations = await Reservation.find(query)
      .populate('supplier', 'businessName name location contactNumber')
      .populate('product', 'name category')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reservations,
      count: reservations.length
    });

  } catch (error) {
    console.error('❌ Error fetching buyer reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete reservation
const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Check permissions - only allow deletion if it's pending and user is the creator
    if (reservation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete pending reservations'
      });
    }

    await Reservation.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Reservation deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete reservation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get reservation statistics
const getReservationStats = async (req, res) => {
  try {
    const supplierId = req.params.supplierId || req.user?.id;

    if (!supplierId) {
      return res.status(400).json({
        success: false,
        message: 'Supplier ID is required'
      });
    }

    const stats = await Reservation.aggregate([
      { $match: { supplier: new mongoose.Types.ObjectId(supplierId) } },
      {
        $group: {
          _id: null,
          totalReservations: { $sum: 1 },
          pendingReservations: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          acceptedReservations: {
            $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
          },
          rejectedReservations: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          completedReservations: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalQuantityRequested: { $sum: '$totalQuantity' },
          averageQuantity: { $avg: '$totalQuantity' }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalReservations: 0,
      pendingReservations: 0,
      acceptedReservations: 0,
      rejectedReservations: 0,
      completedReservations: 0,
      totalQuantityRequested: 0,
      averageQuantity: 0
    };

    // Get recent reservations
    const recentReservations = await Reservation.find({ supplier: supplierId })
      .populate('buyer', 'name mobileNo')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name productName totalQuantity status createdAt');

    res.json({
      success: true,
      data: {
        ...result,
        recentReservations
      }
    });

  } catch (error) {
    console.error('❌ Error fetching reservation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createReservation,
  getSupplierReservations,
  getReservationById,
  updateReservationStatus,
  getBuyerReservations,
  deleteReservation,
  getReservationStats
};const mongoose = require('mongoose');
const Schema = mongoose.Schema;