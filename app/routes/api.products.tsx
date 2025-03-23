import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { 
  getCategories, 
  getCategoryById, 
  getProducts, 
  getProductById,
  addCategory,
  updateCategory,
  deleteCategory,
  addProduct,
  updateProduct,
  deleteProduct
} from "~/utils/db.server";

// Get all categories and products
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const categoryId = url.searchParams.get("categoryId");
  
  // Get all categories
  const categories = getCategories();
  
  // If categoryId is provided, get products for that category
  let products = [];
  if (categoryId) {
    products = getProducts(parseInt(categoryId, 10));
  } else {
    products = getProducts();
  }
  
  return json({ categories, products });
}

// Create, update, or delete categories and products
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("action")?.toString();
  const target = formData.get("target")?.toString();

  // Category actions
  if (target === "category") {
    if (action === "create") {
      const name = formData.get("name")?.toString();
      const description = formData.get("description")?.toString() || "";

      if (!name) {
        return json({ success: false, message: "Category name is required" }, { status: 400 });
      }

      try {
        const result = addCategory(name, description);
        return json({ 
          success: true, 
          message: "Category created successfully",
          categoryId: result.lastInsertRowid
        });
      } catch (error: any) {
        return json(
          { success: false, message: error.message || "Failed to create category" },
          { status: 500 }
        );
      }
    } 
    else if (action === "update") {
      const id = parseInt(formData.get("id")?.toString() || "0", 10);
      const name = formData.get("name")?.toString();
      const description = formData.get("description")?.toString() || "";
      const isActive = formData.get("isActive") === "true";

      if (!id || !name) {
        return json({ success: false, message: "Category ID and name are required" }, { status: 400 });
      }

      try {
        updateCategory(id, name, description, isActive);
        return json({ success: true, message: "Category updated successfully" });
      } catch (error: any) {
        return json(
          { success: false, message: error.message || "Failed to update category" },
          { status: 500 }
        );
      }
    } 
    else if (action === "delete") {
      const id = parseInt(formData.get("id")?.toString() || "0", 10);

      if (!id) {
        return json({ success: false, message: "Category ID is required" }, { status: 400 });
      }

      try {
        deleteCategory(id);
        return json({ success: true, message: "Category deleted successfully" });
      } catch (error: any) {
        return json(
          { success: false, message: error.message || "Failed to delete category" },
          { status: 500 }
        );
      }
    }
  }
  // Product actions
  else if (target === "product") {
    if (action === "create") {
      const categoryId = parseInt(formData.get("categoryId")?.toString() || "0", 10);
      const name = formData.get("name")?.toString();
      const price = parseFloat(formData.get("price")?.toString() || "0");
      const description = formData.get("description")?.toString() || "";

      if (!categoryId || !name) {
        return json({ success: false, message: "Category ID and product name are required" }, { status: 400 });
      }

      try {
        const result = addProduct(categoryId, name, price, description);
        return json({ 
          success: true, 
          message: "Product created successfully",
          productId: result.lastInsertRowid
        });
      } catch (error: any) {
        return json(
          { success: false, message: error.message || "Failed to create product" },
          { status: 500 }
        );
      }
    } 
    else if (action === "update") {
      const id = parseInt(formData.get("id")?.toString() || "0", 10);
      const categoryId = parseInt(formData.get("categoryId")?.toString() || "0", 10);
      const name = formData.get("name")?.toString();
      const price = parseFloat(formData.get("price")?.toString() || "0");
      const description = formData.get("description")?.toString() || "";
      const isActive = formData.get("isActive") === "true";

      if (!id || !categoryId || !name) {
        return json({ success: false, message: "Product ID, category ID, and name are required" }, { status: 400 });
      }

      try {
        updateProduct(id, categoryId, name, price, description, isActive);
        return json({ success: true, message: "Product updated successfully" });
      } catch (error: any) {
        return json(
          { success: false, message: error.message || "Failed to update product" },
          { status: 500 }
        );
      }
    } 
    else if (action === "delete") {
      const id = parseInt(formData.get("id")?.toString() || "0", 10);

      if (!id) {
        return json({ success: false, message: "Product ID is required" }, { status: 400 });
      }

      try {
        deleteProduct(id);
        return json({ success: true, message: "Product deleted successfully" });
      } catch (error: any) {
        return json(
          { success: false, message: error.message || "Failed to delete product" },
          { status: 500 }
        );
      }
    }
  }

  return json({ success: false, message: "Invalid action or target" }, { status: 400 });
}
