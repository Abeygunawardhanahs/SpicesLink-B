const Supplier = require('../models/Supplier');

exports.rateSupplier = async (req, res) => {
  try {
    console.log("=== RATE SUPPLIER DEBUG ===");
    console.log("Body:", req.body);

    const { supplierId, rating } = req.body;

    if (!supplierId || !rating) {
      return res.status(400).json({ success: false, message: "Supplier ID and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    console.log("Found supplier:", supplier.fullName);

    const totalRating = supplier.rating * supplier.ratingCount + rating;
    supplier.ratingCount += 1;
    supplier.rating = totalRating / supplier.ratingCount;

    await supplier.save();

    res.status(200).json({
      success: true,
      message: "Rating submitted successfully",
      supplier: {
        id: supplier._id,
        name: supplier.fullName,
        rating: supplier.rating,
        ratingCount: supplier.ratingCount,
      },
    });
  } catch (error) {
    console.error("=== RATE SUPPLIER ERROR ===", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
