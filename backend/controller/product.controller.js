import cloudinary from "../lib/cloudinary.js";
import redis from "../lib/redis.js";
// import { updateFeaturedProductsCache } from "../lib/updateCache.js";
import Product from "../models/product.models.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    return res.status(200).json(products);
  } catch (error) {
    console.error(
      "❌ Error occurred while getting all products:",
      error.message
    );
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const featuredProducts = await redis.get("featuredProducts");
    if (featuredProducts) {
      return res.status(200).json(JSON.parse(featuredProducts));
    }
    const products = await Product.find({ isFeatured: true }).lean();
    if (!products) {
      return res.status(404).json({ message: "No featured products found" });
    }
    await redis.set("featuredProducts", JSON.stringify(products));
    return res.status(200).json(products);
  } catch (error) {
    console.error(
      "❌ Error occurred while getting featured products:", // Fixed log message
      error.message
    );
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, image, price, description, category } = req.body;
    if (!name || !image || !price || !description || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let cloudinaryRes = await cloudinary.uploader.upload(image, {
      folder: "products",
    });

    const imgUrl = cloudinaryRes.secure_url || "";

    const newProduct = await Product.create({
      name,
      image: imgUrl,
      price,
      description,
      category,
    });
    return res.status(201).json(newProduct);
  } catch (error) {
    console.error("❌ Error occurred while creating product:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (deletedProduct.image) {
      const publicId = deletedProduct.image.split("/").pop().split(".")[0]; // Fixed variable name
      await cloudinary.uploader.destroy(`products/${publicId}`);
      console.log("Image deleted from Cloudinary");
    }
    return res.status(200).json(deletedProduct);
  } catch (error) {
    console.error("❌ Error occurred while deleting product:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $sample: { size: 3 } },
      {
        $project: {
          _id: 1,
          name: 1,
          image: 1,
          price: 1,
          description: 1,
        },
      },
    ]);
    return res.status(200).json(products);
  } catch (error) {
    console.error(
      "❌ Error occurred while getting recommended products:",
      error.message
    );
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }
    const products = await Product.find({ category: category });
    return res.status(200).json(products);
  } catch (error) {
    console.error(
      "❌ Error occurred while getting products by category:",
      error.message
    );
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const toggleFeatured = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.isFeatured = !product.isFeatured;
      const updatedProduct = await product.save();
      await updateFeaturedProductsCache();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log("Error in toggleFeaturedProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

async function updateFeaturedProductsCache() {
  try {
    // The lean() method  is used to return plain JavaScript objects instead of full Mongoose documents. This can significantly improve performance

    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.log("error in update cache function");
  }
}
