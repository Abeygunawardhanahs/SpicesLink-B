const Reservation = require('../models/Reservation');
const Supplier = require('../models/Supplier');
const Buyer = require('../models/Buyer');

const createReservation = async (req, res) => {
  try {
    console.log('=== CREATE RESERVATION REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const {
      name,
      mobileNo,
      location,
      spiceName,
      productName,
      totalQuantity,
      qualityGrade = 'Standard',
      deliveryDate,
      paymentMethod,
      shopInfo,
      notes = '',
      accountNumber,
      bankName,
      branchHolderName
    } = req.body;

    // Validation
    if (!name || !mobileNo || !location || !totalQuantity || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Extract shop ID
    let shopId = shopInfo?.shopId || shopInfo?.id || shopInfo?._id || shopInfo;
    
    console.log('Extracted shopId:', shopId);

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'Shop information is required'
      });
    }

    // Check BOTH Supplier and Buyer models (shops can be either)
    let supplier = await Supplier.findById(shopId);
    let buyer = null;
    
    if (!supplier) {
      buyer = await Buyer.findById(shopId);
      console.log('Checking as Buyer - Found:', buyer ? 'YES' : 'NO');
    } else {
      console.log('Found as Supplier:', 'YES');
    }
    
    if (!supplier && !buyer) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Use whichever was found
    const shopOwner = supplier || buyer;

    // Process delivery date
    let processedDeliveryDate = null;
    if (deliveryDate) {
      const [day, month, year] = deliveryDate.split('/');
      processedDeliveryDate = new Date(year, month - 1, day);
    }

    // Create reservation
    const reservationData = {
      name: name.trim(),
      mobileNo: mobileNo.trim(),
      location: location.trim(),
      spiceName: (spiceName || productName).trim(),
      productName: (productName || spiceName).trim(),
      totalQuantity: parseFloat(totalQuantity),
      qualityGrade: qualityGrade.trim(),
      deliveryDate: processedDeliveryDate,
      paymentMethod,
      advancePayment: paymentMethod === 'advance',
      cashOnDelivery: paymentMethod === 'cod',
      supplier: supplier ? shopId : null,
      buyer: buyer ? shopId : null,
      shopInfo: {
        shopId: shopId,
        shopName: shopInfo?.shopName || shopOwner.businessName || shopOwner.name || '',
        shopLocation: shopInfo?.shopLocation || shopOwner.location || '',
        contactNumber: shopInfo?.contactNumber || shopOwner.contactNumber || shopOwner.phone || '',
        shopOwnerName: shopInfo?.shopOwnerName || shopOwner.ownerName || shopOwner.name || ''
      },
      notes: notes?.trim() || '',
      status: 'pending'
    };

    if (paymentMethod === 'advance') {
      reservationData.bankDetails = {
        accountNumber: accountNumber?.trim(),
        bankName: bankName?.trim(),
        branchHolderName: branchHolderName?.trim()
      };
    }

    const reservation = new Reservation(reservationData);
    const savedReservation = await reservation.save();

    console.log('Reservation saved successfully:', savedReservation._id);

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      reservationId: savedReservation._id,
      data: savedReservation
    });

  } catch (error) {
    console.error('CREATE RESERVATION ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reservation',
      error: error.message
    });
  }
};

const getSupplierReservations = async (req, res) => {
  try {
    const supplierId = req.params.supplierId || req.user.id;
    
    const reservations = await Reservation.find({ 
      $or: [
        { supplier: supplierId },
        { buyer: supplierId }
      ]
    })
    .populate('buyer', 'name email mobileNo')
    .populate('supplier', 'businessName location contactNumber')
    .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      count: reservations.length,
      data: reservations 
    });
  } catch (error) {
    console.error('GET SUPPLIER RESERVATIONS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservations',
      error: error.message
    });
  }
};

const getBuyerReservations = async (req, res) => {
  try {
    const { mobileNo } = req.params;
    
    const reservations = await Reservation.find({ mobileNo })
      .populate('supplier', 'businessName location contactNumber')
      .populate('buyer', 'name location contactNumber')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true,
      count: reservations.length,
      data: reservations 
    });
  } catch (error) {
    console.error('GET BUYER RESERVATIONS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservations',
      error: error.message
    });
  }
};

const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reservation = await Reservation.findById(id)
      .populate('supplier', 'businessName location contactNumber')
      .populate('buyer', 'name location contactNumber')
      .populate('product', 'name category');

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
    console.error('GET RESERVATION BY ID ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservation',
      error: error.message
    });
  }
};

const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;

    const reservation = await Reservation.findById(id);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    await reservation.updateStatus(status, message);

    res.json({ 
      success: true,
      message: 'Reservation status updated',
      data: reservation
    });
  } catch (error) {
    console.error('UPDATE RESERVATION STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reservation status',
      error: error.message
    });
  }
};

const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reservation = await Reservation.findByIdAndDelete(id);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    res.json({ 
      success: true,
      message: 'Reservation deleted successfully'
    });
  } catch (error) {
    console.error('DELETE RESERVATION ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete reservation',
      error: error.message
    });
  }
};

const getReservationStats = async (req, res) => {
  try {
    const supplierId = req.params.supplierId || req.user.id;

    const stats = await Reservation.aggregate([
      {
        $match: {
          $or: [
            { supplier: supplierId },
            { buyer: supplierId }
          ]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalReservations = await Reservation.countDocuments({
      $or: [
        { supplier: supplierId },
        { buyer: supplierId }
      ]
    });

    res.json({ 
      success: true, 
      data: {
        total: totalReservations,
        byStatus: stats
      }
    });
  } catch (error) {
    console.error('GET RESERVATION STATS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservation statistics',
      error: error.message
    });
  }
};

module.exports = {
  createReservation,
  getSupplierReservations,
  getBuyerReservations,
  getReservationById,
  updateReservationStatus,
  deleteReservation,
  getReservationStats
};