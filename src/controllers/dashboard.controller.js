import { nodeCache } from "../app.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { calculatePercentage } from "../utils/calculatePercentage.js";
import { getInventories } from "../utils/getInventories.js";
import { allOrders } from "./order.controller.js";
import { getChartData } from "../utils/getChartData.js";

// Define constant for the number of months to consider
const SIX_MONTHS = 6;

const getDashboardStats = asyncHandler(async (req, res, next) => {
  // Initialize the object to hold dashboard statistics
  let dashboardStats = {};
  // Define cache key for caching dashboard statistics
  const cacheKey = "admin-stats";

  // Check if dashboard statistics are cached
  if (nodeCache.has(cacheKey)) {
    // Retrieve cached dashboard statistics
    dashboardStats = JSON.parse(nodeCache.get(cacheKey));
  } else {
    // If dashboard statistics are not cached, compute them
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - SIX_MONTHS);

    // Define date ranges for this month and last month
    const thisMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    };

    const lastMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0),
    };

    // Fetch data for this month and last month
    const [
      thisMonthProducts,
      thisMonthUsers,
      thisMonthOrders,
      lastMonthProducts,
      lastMonthUsers,
      lastMonthOrders,
      productsCount,
      usersCount,
      allOrders,
      lastSixMonthOrders,
      categories,
      femaleUsersCount,
      latestTransactions,
    ] = await Promise.all([
      Product.find({
        createdAt: {
          $gte: thisMonth.start,
          $lte: thisMonth.end,
        },
      }),
      User.find({
        createdAt: {
          $gte: thisMonth.start,
          $lte: thisMonth.end,
        },
      }),
      Order.find({
        createdAt: {
          $gte: thisMonth.start,
          $lte: thisMonth.end,
        },
      }),
      Product.find({
        createdAt: {
          $gte: lastMonth.start,
          $lte: lastMonth.end,
        },
      }),
      User.find({
        createdAt: {
          $gte: lastMonth.start,
          $lte: lastMonth.end,
        },
      }),
      Order.find({
        createdAt: {
          $gte: lastMonth.start,
          $lte: lastMonth.end,
        },
      }),
      Product.countDocuments(),
      User.countDocuments(),
      Order.find({}).select("total"),
      Order.find({
        createdAt: {
          $gte: sixMonthsAgo,
          $lte: today,
        },
      }),
      Product.distinct("category"),
      User.countDocuments({ gender: "female" }),
      Order.find({})
        .select(["orderItems", "discount", "total", "status"])
        .limit(4),
    ]);

    // Calculate revenue for this month, last month, and overall
    const thisMonthRevenue = thisMonthOrders.reduce(
      (total, order) => total + (order?.total || 0),
      0
    );

    const lastMonthRevenue = lastMonthOrders.reduce(
      (total, order) => total + (order?.total || 0),
      0
    );

    const revenue = allOrders.reduce(
      (total, order) => total + (order?.total || 0),
      0
    );

    // Calculate percentage changes in revenue, products, users, and orders
    const changePercent = {
      revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
      product: calculatePercentage(thisMonthProducts.length, lastMonthProducts.length),
      user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
      orders: calculatePercentage(thisMonthOrders.length, lastMonthOrders.length),
    };

    // Count of revenue, products, users, and orders
    const count = {
      revenue,
      product: productsCount,
      user: usersCount,
      order: allOrders.length,
    };

    // Initialize arrays to hold order counts and monthly revenue
    const orderMonthCounts = new Array(SIX_MONTHS).fill(0);
    const orderMonthlyRevenue = new Array(SIX_MONTHS).fill(0);

    // Calculate order counts and monthly revenue for the last six months
    lastSixMonthOrders.forEach((order) => {
      const creationDate = order.createdAt;
      const monthDiff = ((today.getMonth() - creationDate.getMonth() + 12) % 12);

      if (monthDiff < SIX_MONTHS) {
        orderMonthCounts[SIX_MONTHS - monthDiff - 1] += 1;
        orderMonthlyRevenue[SIX_MONTHS - monthDiff - 1] += order.total;
      }
    });

    // Calculate category count using external function
    const categoryCount = await getInventories({ categories, productsCount });

    // Calculate male and female user ratio
    const userRatio = {
      male: usersCount - femaleUsersCount,
      female: femaleUsersCount,
    };

    // Modify latest transactions to include only necessary fields
    const modifiedLatestTransactions = latestTransactions.map((transaction) => ({
      _id: transaction._id,
      discount: transaction.discount,
      amount: transaction.total,
      quantity: transaction.orderItems.length,
      status: transaction.status,
    }));

    // Construct dashboard statistics object
    dashboardStats = {
      categoryCount,
      changePercent,
      count,
      chart: {
        order: orderMonthCounts,
        revenue: orderMonthlyRevenue,
      },
      userRatio,
      latestTransactions: modifiedLatestTransactions,
    };

    // Cache dashboard statistics
    nodeCache.set(cacheKey, JSON.stringify(dashboardStats));
  }

  // Return dashboard statistics as JSON response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        dashboardStats,
        "Dashboard statistics received successfully"
      )
    );
});


const getPieCharts = asyncHandler(async (req, res, next) => {
  let charts;
  const key = "admin-pie-charts";

  if (nodeCache.has(key)) {
    charts = JSON.parse(nodeCache.get(key));
  } else {
    const allOrdersPromise = Order.find({}).select([
      "total",
      "discount",
      "subTotal",
      "tax",
      "shippingCharges",
    ]);

    const [
      processingOrders,
      shippedOrders,
      deliveredOrders,
      categories,
      productsCount,
      outOfStock,
      allOrders,
      allUsers,
      adminUsersCount,
      customerUsersCount,
    ] = await Promise.all([
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped" }),
      Order.countDocuments({ status: "Delivered" }),
      Product.distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      allOrdersPromise,
      User.find({}).select(["dob"]),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
    ]);

    const orderFullfilment = {
      processing: processingOrders,
      shipped: shippedOrders,
      delivered: deliveredOrders,
    };

    const productCategories = await getInventories({ categories, productsCount });

    const stockAvailability = {
      inStock: productsCount - outOfStock,
      outOfStock,
    };

    const revenueData = allOrders.reduce(
      (acc, order) => {
        acc.grossIncome += order.total || 0;
        acc.discount += order.discount || 0;
        acc.productionCost += order.shippingCharges || 0;
        acc.burnt += order.tax || 0;
        return acc;
      },
      { grossIncome: 0, discount: 0, productionCost: 0, burnt: 0 }
    );

    const marketingCost = Math.round(revenueData.grossIncome * 0.3);

    const revenueDistribution = {
      netMargin:
        revenueData.grossIncome -
        (revenueData.discount +
          revenueData.productionCost +
          revenueData.burnt +
          marketingCost),
      ...revenueData,
      marketingCost,
    };

    const usersAgeGroup = allUsers.reduce(
      (acc, user) => {
        if (user.age < 20) acc.teen++;
        else if (user.age >= 20 && user.age < 50) acc.adult++;
        else acc.old++;
        return acc;
      },
      { teen: 0, adult: 0, old: 0 }
    );

    const adminCustomer = {
      admin: adminUsersCount,
      customer: customerUsersCount,
    };

    charts = {
      orderFullfilment,
      productCategories,
      stockAvailability,
      revenueDistribution,
      usersAgeGroup,
      adminCustomer,
    };

    nodeCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json(
    new ApiResponse(200, charts, "Pie chart data received successfully")
  );
});


const getBarCharts = asyncHandler(async (req, res, next) => {
  let charts;
  const key = "admin-bar-charts";
  
  if (nodeCache.has(key)) {
    charts = JSON.parse(nodeCache.get(key));
    res.json(charts); // Send cached data immediately
  } else {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const sixMonthsProductPromise = Product.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      }
    }).select("createdAt").exec();

    const sixMonthsUserPromise = User.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      }
    }).select("createdAt").exec();

    const twelveMonthsOrderPromise = Order.find({
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      }
    }).select("createdAt").exec();

    // Wait for all promises to resolve
    const [products, users, orders] = await Promise.all([
      sixMonthsProductPromise,
      sixMonthsUserPromise,
      twelveMonthsOrderPromise
    ]);

    // Perform necessary operations on data here, then set cache

    const productCounts = getChartData({ length: 6, today: today, docArr: products });
    const usersCounts = getChartData({ length: 6, today: today, docArr: users });
    const ordersCounts = getChartData({ length: 12, today: today, docArr: orders });

    
    charts = {
      users: usersCounts,
      products: productCounts,
      orders: ordersCounts,
    };
  
    nodeCache.set(key, JSON.stringify(charts));

    return res
    .status(200)
    .json(new ApiResponse(
      200,
      charts,
      "bar chart data received successfully"
    ))
  }
});


// Define an asynchronous handler function to get line charts data
const getLineCharts = asyncHandler(async (req, res, next) => {
  let charts;
  const key = "admin-line-charts";

  // Check if data is cached
  if (nodeCache.has(key)) {
    // If cached, parse the data
    charts = JSON.parse(nodeCache.get(key));
  } else {
    // If not cached, calculate the data
    const today = new Date();

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Define the base query for database retrieval
    const baseQuery = {
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    };

    // Retrieve data for products, users, and orders
    const [products, users, orders] = await Promise.all([
      Product.find(baseQuery).select("createdAt"),
      User.find(baseQuery).select("createdAt"),
      Order.find(baseQuery).select(["createdAt", "discount", "total"]),
    ]);

    // Calculate counts for products, users, discounts, and revenue over the last 12 months
    const productCounts = getChartData({ length: 12, today, docArr: products });
    const usersCounts = getChartData({ length: 12, today, docArr: users });
    const discount = getChartData({
      length: 12,
      today,
      docArr: orders,
      property: "discount",
    });
    const revenue = getChartData({
      length: 12,
      today,
      docArr: orders,
      property: "total",
    });

    // Create the charts object
    charts = {
      users: usersCounts,
      products: productCounts,
      discount,
      revenue,
    };

    // Cache the data
    nodeCache.set(key, JSON.stringify(charts));
  }

  // Return the charts data in the response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    charts,
    "line charts data received successfully"
  ))
});



export { getDashboardStats ,getPieCharts , getBarCharts, getLineCharts};
 