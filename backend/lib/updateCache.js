export const updateFeaturedProductsCache = async () =>{
    try{
        const featuredProducts = await Product.find({isFeatured: true}).lean();
        await redis.set("featuredProducts", JSON.stringify(featuredProducts));
    }catch(error){
        console.log("❌ Error occurred while updating featured products cache:", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}